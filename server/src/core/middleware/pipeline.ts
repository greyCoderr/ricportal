import compression from "compression";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";
import type { AppConfig } from "../../config/app-config.js";
import { createGlobalRateLimit } from "./rate-limit.js";

// Order (DEC-015): trust proxy, helmet, compression, rate limit, JSON body,
// cookies. The request id runs before this, and routes, 404 and the error
// handler after it.
export function applyRequestPipeline(app: Express, config: AppConfig): void {
  app.set("trust proxy", config.TRUST_PROXY);
  app.use(helmet());
  app.use(compression());
  if (config.RATE_LIMIT_ENABLED) {
    app.use(createGlobalRateLimit(config));
  }
  app.use(express.json({ limit: config.BODY_LIMIT }));
  app.use(cookieParser());
}
