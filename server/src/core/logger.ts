import {
  pino,
  type DestinationStream,
  type Logger,
  type LoggerOptions,
} from "pino";
import type { Env } from "../config/env.js";

type LoggerEnv = Pick<Env, "NODE_ENV" | "LOG_LEVEL">;

const SENSITIVE_FIELDS = [
  "password",
  "cookie",
  "authorization",
  "set-cookie",
] as const;

// Each field is redacted at the top level and up to two levels deep
// (for example req.headers.cookie).
const REDACT_PATHS = SENSITIVE_FIELDS.flatMap((field) => {
  const key = field.includes("-") ? `["${field}"]` : field;
  const nested = field.includes("-") ? key : `.${key}`;
  return [key, `*${nested}`, `*.*${nested}`];
});

function baseOptions(env: LoggerEnv): LoggerOptions {
  return {
    level: env.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
  };
}

export function buildLoggerOptions(env: LoggerEnv): LoggerOptions {
  if (env.NODE_ENV === "development") {
    return { ...baseOptions(env), transport: { target: "pino-pretty" } };
  }
  return baseOptions(env);
}

export function createLogger(
  env: LoggerEnv,
  destination?: DestinationStream,
): Logger {
  if (destination !== undefined) {
    return pino(baseOptions(env), destination);
  }
  return pino(buildLoggerOptions(env));
}
