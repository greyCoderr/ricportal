import {
  INVALID_LOGIN_MESSAGE,
  LOCKED_MESSAGE,
  manilaToday,
  type LoginEventDto,
  type ProfileActivityDto,
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
import { fromDbDate, toDbDate } from "../../core/dates.js";
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

const DAY_MS = 86_400_000;

function calendarDayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / DAY_MS;
}

// The first instants of this Manila month and the next.
function manilaMonthRange(at: Date): { from: Date; to: Date } {
  const [year = 0, month = 1] = manilaToday(at).split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  const iso = (y: number, m: number) =>
    `${String(y)}-${String(m).padStart(2, "0")}-01T00:00:00+08:00`;
  return {
    from: new Date(iso(year, month)),
    to: new Date(iso(next.getUTCFullYear(), next.getUTCMonth() + 1)),
  };
}

function toProfile(row: ProfileRow, at: Date): ProfileDto {
  return {
    id: row.id,
    role: row.role,
    username: row.username,
    fullName: row.fullName,
    mobile: row.mobile,
    centerId: row.centerId,
    centerName: row.center?.name ?? null,
    status: row.status,
    email: row.email,
    address: row.address,
    position: row.position,
    sex: row.sex,
    birthDate: row.birthDate === null ? null : fromDbDate(row.birthDate),
    qualification: row.qualification,
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    passwordChangedAt: row.passwordChangedAt?.toISOString() ?? null,
    passwordChangedDaysAgo:
      row.passwordChangedAt === null
        ? null
        : calendarDayNumber(manilaToday(at)) -
          calendarDayNumber(manilaToday(row.passwordChangedAt)),
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
  settings: { currentSchoolYear: () => Promise<string> };
  now: () => Date;
}) {
  const { repository, config, settings, now } = deps;
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
      return toProfile(row, now());
    },

    async activity(user: {
      id: number;
      role: Role;
      centerId: number | null;
    }): Promise<ProfileActivityDto> {
      const { from, to } = manilaMonthRange(now());
      const loginsThisMonth = await repository.countLogins(user.id, from, to);
      if (user.role === "PARENT") {
        return { role: "PARENT", loginsThisMonth };
      }
      const schoolYear = await settings.currentSchoolYear();
      if (user.role === "ADMIN") {
        const [teachersManaged, enrolledStudents, reportsGenerated] =
          await Promise.all([
            repository.countTeachers(),
            repository.countEnrolledStudents(schoolYear),
            repository.countLiquidationReports(),
          ]);
        return {
          role: "ADMIN",
          teachersManaged,
          enrolledStudents,
          reportsGenerated,
          loginsThisMonth,
        };
      }
      if (user.centerId === null) {
        throw new ForbiddenError("This account has no RIC Children Center.");
      }
      const [childrenEnrolled, parentsApproved, reportsSubmitted] =
        await Promise.all([
          repository.countEnrolledStudents(schoolYear, user.centerId),
          repository.countApprovedParents(user.centerId),
          repository.countCenterReports(user.centerId),
        ]);
      return {
        role: "TEACHER",
        childrenEnrolled,
        parentsApproved,
        reportsSubmitted,
        loginsThisMonth,
      };
    },

    async recentLogins(userId: number): Promise<LoginEventDto[]> {
      const rows = await repository.listRecentLogins(userId);
      return rows.map((row) => ({ at: row.createdAt.toISOString() }));
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
      const today = manilaToday(now());
      if (
        input.birthDate !== undefined &&
        input.birthDate !== null &&
        input.birthDate > today
      ) {
        throw new ValidationError("Some fields are not valid.", [
          {
            field: "birthDate",
            message: "The birth date cannot be in the future.",
          },
        ]);
      }
      // Left out keeps the stored value; null clears it (D9).
      const extras: Omit<
        Parameters<AuthRepository["updateProfile"]>[1],
        "fullName" | "mobile"
      > = {};
      if (input.email !== undefined) extras.email = input.email;
      if (input.address !== undefined) extras.address = input.address;
      if (input.position !== undefined) extras.position = input.position;
      if (input.sex !== undefined) extras.sex = input.sex;
      if (input.qualification !== undefined) {
        extras.qualification = input.qualification;
      }
      if (input.birthDate !== undefined) {
        extras.birthDate =
          input.birthDate === null ? null : toDbDate(input.birthDate);
      }
      return toProfile(
        await repository.updateProfile(user.id, {
          fullName: input.fullName,
          mobile: input.mobile ?? null,
          ...extras,
        }),
        now(),
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
        now(),
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
