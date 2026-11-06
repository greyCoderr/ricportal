import type { Role } from "@ricportal/shared";
import type { Request, RequestHandler } from "express";
import { SESSION_COOKIE, verifySessionToken } from "../auth-token.js";
import { ForbiddenError, UnauthenticatedError } from "../errors.js";
import type { AuthUser } from "../scope.js";

export type SessionLookup = (userId: number) => Promise<
  | (AuthUser & {
      tokenVersion: number;
      status: string;
    })
  | null
>;

// Reads the session cookie, checks the signature, expiry and token_version,
// and loads the current user. A disabled or changed account stops working at
// once because the row is read on every request.
export function createAuthenticate(deps: {
  secret: string;
  now: () => Date;
  lookup: SessionLookup;
}): RequestHandler {
  return async (req, _res, next) => {
    const cookies = req.cookies as Record<string, string | undefined>;
    const token = cookies[SESSION_COOKIE];
    if (token === undefined || token === "") {
      throw new UnauthenticatedError();
    }
    const payload = await verifySessionToken(token, deps.secret, deps.now());
    if (payload === null) {
      throw new UnauthenticatedError();
    }
    const user = await deps.lookup(payload.userId);
    if (
      user === null ||
      user.status !== "ACTIVE" ||
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthenticatedError();
    }
    req.user = {
      id: user.id,
      role: user.role,
      centerId: user.centerId,
      mustChangePassword: user.mustChangePassword,
    };
    next();
  };
}

// Role guard. A user who must change the password can use nothing else until
// it is changed (P1-T13); the auth routes do not use this guard.
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.user;
    if (user === undefined) {
      throw new UnauthenticatedError();
    }
    if (user.mustChangePassword) {
      throw new ForbiddenError("Please change your password first.");
    }
    if (!roles.includes(user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}

export function currentUser(req: Request): AuthUser {
  if (req.user === undefined) {
    throw new UnauthenticatedError();
  }
  return req.user;
}
