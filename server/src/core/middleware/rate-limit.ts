import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import type { AppConfig } from "../../config/app-config.js";
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
