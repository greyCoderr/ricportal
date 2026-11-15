import { LOCKED_MESSAGE } from "@ricportal/shared";
import type { Request, RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import type { AppConfig } from "../../config/app-config.js";
import { LOGIN_IP_MAX_FAILURES, LOGIN_LOCK_MS } from "../../config/limits.js";
import { RateLimitedError } from "../errors.js";

// The limiter keys by req.ip, which Express takes from X-Forwarded-For only
// when "trust proxy" is set (TRUST_PROXY). The library sets Retry-After before
// calling the handler; the handler hands over to the standard error shape.
export function createGlobalRateLimit(config: AppConfig): RequestHandler {
  return rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    limit: config.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new RateLimitedError());
    },
  });
}

function secondsUntilReset(req: Request): number {
  const info: unknown = "rateLimit" in req ? req.rateLimit : undefined;
  if (
    typeof info === "object" &&
    info !== null &&
    "resetTime" in info &&
    info.resetTime instanceof Date
  ) {
    return Math.max(
      1,
      Math.ceil((info.resetTime.getTime() - Date.now()) / 1000),
    );
  }
  return LOGIN_LOCK_MS / 1000;
}

// The login limit per client address (BR-19, P1-T07, AUD-010), next to the lock
// per username. The lock stops many guesses at one account; this stops one
// guess each at many accounts. Only failed logins count. The answer is the same
// 429, message and Retry-After as a locked account, so it reveals nothing.
export function createLoginRateLimit(): RequestHandler {
  return rateLimit({
    windowMs: LOGIN_LOCK_MS,
    limit: LOGIN_IP_MAX_FAILURES,
    skipSuccessfulRequests: true,
    standardHeaders: false,
    legacyHeaders: false,
    handler: (req, _res, next) => {
      next(new RateLimitedError(LOCKED_MESSAGE, [], secondsUntilReset(req)));
    },
  });
}
