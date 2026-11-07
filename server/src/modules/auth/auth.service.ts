import {
  INVALID_LOGIN_MESSAGE,
  LOCKED_MESSAGE,
  STATUS_LOGIN_MESSAGES,
  type changePasswordSchema,
  type loginSchema,
  type parentSignupSchema,
  type ProfileDto,
  type profileUpdateSchema,
  type PublicCenter,
  type Role,
  type SessionUser,
  type SignupResult,
} from "@ricportal/shared";
import type { z } from "zod";
import { LOGIN_LOCK_MS, LOGIN_MAX_FAILURES } from "../../config/limits.js";
import { signSessionToken, type TokenConfig } from "../../core/auth-token.js";
import {
  ConflictError,
  ForbiddenError,
  RateLimitedError,
  RuleViolationError,
  UnauthenticatedError,
  ValidationError,
} from "../../core/errors.js";
import { hashPassword, verifyPassword } from "../../core/password.js";
import type { AuthRepository } from "./auth.repository.js";

type SessionRow = NonNullable<
  Awaited<ReturnType<AuthRepository["findSessionUser"]>>
>;

function toSessionUser(row: SessionRow): SessionUser {
  return {
    id: row.id,
    role: row.role,
    username: row.username,
    fullName: row.fullName,
    centerId: row.centerId,
    centerName: row.center?.name ?? null,
    mustChangePassword: row.mustChangePassword,
  };
}

type ProfileRow = NonNullable<
  Awaited<ReturnType<AuthRepository["findProfile"]>>
>;

function toProfile(row: ProfileRow): ProfileDto {
  return {
    id: row.id,
    role: row.role,
    username: row.username,
    fullName: row.fullName,
    mobile: row.mobile,
    centerId: row.centerId,
    centerName: row.center?.name ?? null,
    status: row.status,
  };
}

function lockedError(until: Date, now: Date): RateLimitedError {
  return new RateLimitedError(
    LOCKED_MESSAGE,
    [],
    Math.ceil((until.getTime() - now.getTime()) / 1000),
  );
}

// Counts failures for usernames that do not exist, so an unknown username gets
// the same 429 as a locked account and existence is never revealed (DEC-026).
// Kept in memory: it holds nothing about real accounts and a restart clears it.
const MAX_TRACKED_UNKNOWN = 10_000;

class UnknownUserThrottle {
  private readonly entries = new Map<
    string,
    { count: number; lockedUntil: Date | null }
  >();

  lockedUntil(username: string, now: Date): Date | null {
    const entry = this.entries.get(username);
    if (entry?.lockedUntil == null) {
      return null;
    }
    if (entry.lockedUntil <= now) {
      this.entries.delete(username);
      return null;
    }
    return entry.lockedUntil;
  }

  fail(username: string, now: Date): void {
    if (this.entries.size >= MAX_TRACKED_UNKNOWN) {
      this.entries.clear();
    }
    const count = (this.entries.get(username)?.count ?? 0) + 1;
    this.entries.set(username, {
      count,
      lockedUntil:
        count >= LOGIN_MAX_FAILURES
          ? new Date(now.getTime() + LOGIN_LOCK_MS)
          : null,
    });
  }
}

export function createAuthService(deps: {
  repository: AuthRepository;
  config: TokenConfig & { BCRYPT_COST: number };
  now: () => Date;
}) {
  const { repository, config, now } = deps;
  const unknownUsers = new UnknownUserThrottle();
  // Compared against when the username is unknown, so both paths do the work.
  const dummyHash = hashPassword("not-a-real-password-1", config.BCRYPT_COST);

  async function issueToken(row: SessionRow): Promise<string> {
    return signSessionToken(
      { userId: row.id, tokenVersion: row.tokenVersion },
      config,
      now(),
    );
  }

  return {
    async login(input: z.output<typeof loginSchema>) {
      const username = input.username.toLowerCase();
      const at = now();

      const unknownLock = unknownUsers.lockedUntil(username, at);
      if (unknownLock !== null) {
        throw lockedError(unknownLock, at);
      }

      const user = await repository.findForLogin(username);
      if (user === null) {
        await verifyPassword(input.password, await dummyHash);
        unknownUsers.fail(username, at);
        throw new UnauthenticatedError(INVALID_LOGIN_MESSAGE);
      }

      // While locked the password is not checked at all (BR-19).
      if (user.lockedUntil !== null && user.lockedUntil > at) {
        throw lockedError(user.lockedUntil, at);
      }

      const matches = await verifyPassword(input.password, user.passwordHash);
      if (!matches) {
        // A lock that has run out starts a new count.
        const previous = user.lockedUntil === null ? user.failedLoginCount : 0;
        const count = previous + 1;
        await repository.recordFailure(
          user.id,
          count,
          count >= LOGIN_MAX_FAILURES
            ? new Date(at.getTime() + LOGIN_LOCK_MS)
            : null,
        );
        throw new UnauthenticatedError(INVALID_LOGIN_MESSAGE);
      }

      if (user.status !== "ACTIVE") {
        await repository.clearFailures(user.id);
        throw new ForbiddenError(STATUS_LOGIN_MESSAGES[user.status]);
      }

      await repository.recordLogin(user.id, at);
      return { user: toSessionUser(user), token: await issueToken(user) };
    },

    async me(userId: number): Promise<SessionUser> {
      const row = await repository.findSessionUser(userId);
      if (row === null) {
        throw new UnauthenticatedError();
      }
      return toSessionUser(row);
    },

    async profile(userId: number): Promise<ProfileDto> {
      const row = await repository.findProfile(userId);
      if (row === null) {
        throw new UnauthenticatedError();
      }
      return toProfile(row);
    },

    async updateProfile(
      user: { id: number; role: Role },
      input: z.output<typeof profileUpdateSchema>,
    ): Promise<ProfileDto> {
      if (user.role === "PARENT" && input.mobile === undefined) {
        throw new ValidationError("Some fields are not valid.", [
          {
            field: "mobile",
            message: "Enter a mobile number like 09171234567.",
          },
        ]);
      }
      return toProfile(
        await repository.updateProfile(user.id, {
          fullName: input.fullName,
          mobile: input.mobile ?? null,
        }),
      );
    },

    async changePassword(
      userId: number,
      input: z.output<typeof changePasswordSchema>,
    ) {
      const current = await repository.findPasswordHash(userId);
      if (current === null) {
        throw new UnauthenticatedError();
      }
      const matches = await verifyPassword(
        input.currentPassword,
        current.passwordHash,
      );
      if (!matches) {
        throw new ValidationError("Some fields are not valid.", [
          {
            field: "currentPassword",
            message: "Your current password is not correct.",
          },
        ]);
      }
      const row = await repository.changePassword(
        userId,
        await hashPassword(input.newPassword, config.BCRYPT_COST),
      );
      return { user: toSessionUser(row), token: await issueToken(row) };
    },

    async parentSignup(
      input: z.output<typeof parentSignupSchema>,
    ): Promise<SignupResult> {
      const center = await repository.findCenter(input.centerId);
      if (center?.isActive !== true) {
        throw new RuleViolationError(
          "This RIC Children Center is not available. Please choose another.",
          [{ field: "centerId", message: "Choose an active center." }],
        );
      }
      if (await repository.usernameExists(input.username)) {
        throw new ConflictError("This username is already taken.", [
          { field: "username", message: "This username is already taken." },
        ]);
      }
      await repository.createParent({
        username: input.username,
        passwordHash: await hashPassword(input.password, config.BCRYPT_COST),
        fullName: input.fullName,
        mobile: input.mobile,
        centerId: input.centerId,
        childName: input.childName,
      });
      return { centerName: center.name };
    },

    publicCenters(): Promise<PublicCenter[]> {
      return repository.listActiveCenters();
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
