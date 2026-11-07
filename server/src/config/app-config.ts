import type { Env } from "./env.js";

export type AppConfig = Pick<
  Env,
  | "BODY_LIMIT"
  | "RATE_LIMIT_ENABLED"
  | "RATE_LIMIT_WINDOW_MS"
  | "RATE_LIMIT_MAX"
  | "TRUST_PROXY"
  | "JWT_SECRET"
  | "COOKIE_SECURE"
  | "SESSION_HOURS"
  | "BCRYPT_COST"
  | "DEFAULT_PASSWORD"
>;
