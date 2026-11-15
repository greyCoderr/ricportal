import { DEFAULT_SERVER_PORT } from "@ricportal/shared";
import { z } from "zod";

const NODE_ENVS = ["development", "test", "production"] as const;
const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

const SIZE_UNITS = { b: 1, kb: 1024, mb: 1024 * 1024 } as const;
const MAX_BODY_BYTES = 10 * SIZE_UNITS.mb;
const SIZE_PATTERN = /^([1-9][0-9]{0,8})(b|kb|mb)$/;

function isBodyLimit(value: string): boolean {
  const match = SIZE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }
  const [, amount, unit] = match;
  if (
    amount === undefined ||
    (unit !== "b" && unit !== "kb" && unit !== "mb")
  ) {
    return false;
  }
  return Number(amount) * SIZE_UNITS[unit] <= MAX_BODY_BYTES;
}

function wholeNumber(min: number, max: number) {
  return z.coerce.number().int().min(min).max(max);
}

const envSchema = z.object({
  // No default (AUD-009): see withDefaults.
  NODE_ENV: z.enum(NODE_ENVS).optional(),
  PORT: wholeNumber(1, 65535).default(DEFAULT_SERVER_PORT),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  TZ: z.string().min(1).default("Asia/Manila"),
  DATABASE_URL: z.string().min(1),
  BODY_LIMIT: z.string().refine(isBodyLimit).default("100kb"),
  RATE_LIMIT_ENABLED: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(true),
  RATE_LIMIT_WINDOW_MS: wholeNumber(1000, 86_400_000).default(900_000),
  RATE_LIMIT_MAX: wholeNumber(1, 100_000).default(300),
  TRUST_PROXY: wholeNumber(0, 10).default(0),
  // Development and test get safe defaults; production must set these.
  JWT_SECRET: z.string().min(32).optional(),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  SESSION_HOURS: wholeNumber(1, 168).optional(),
  ADMIN_USERNAME: z.string().min(4).max(30).optional(),
  ADMIN_PASSWORD: z.string().min(8).max(72).optional(),
  DEFAULT_PASSWORD: z.string().min(8).max(72).optional(),
  BCRYPT_COST: wholeNumber(4, 15).optional(),
});

type ParsedEnv = z.output<typeof envSchema>;
type EnvKey = keyof ParsedEnv;

// Fake values for this machine only. They apply only when NODE_ENV is written
// out as development or test (AUD-009). They are in the repository, so anyone
// can read them: a server that used them by accident would accept forged
// sessions.
const DEV_JWT_SECRET = "development-only-jwt-secret-not-for-production";
const DEV_ADMIN_USERNAME = "admin";
const DEV_ADMIN_PASSWORD = "Admin2026!";
// D6: what a reset or a blank password on a new account sets.
const DEV_DEFAULT_PASSWORD = "RICPortal2026!";

const REQUIRED_IN_PRODUCTION = [
  "JWT_SECRET",
  "COOKIE_SECURE",
  "SESSION_HOURS",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "DEFAULT_PASSWORD",
] as const;

export type Env = Omit<
  ParsedEnv,
  (typeof REQUIRED_IN_PRODUCTION)[number] | "BCRYPT_COST" | "NODE_ENV"
> & {
  NODE_ENV: (typeof NODE_ENVS)[number];
  JWT_SECRET: string;
  COOKIE_SECURE: boolean;
  SESSION_HOURS: number;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  DEFAULT_PASSWORD: string;
  BCRYPT_COST: number;
};

const ENV_KEYS = Object.keys(envSchema.shape) as EnvKey[];

// Fixed messages, so a bad value can never appear in the output.
const RULES: Record<EnvKey, string> = {
  NODE_ENV: `must be one of: ${NODE_ENVS.join(", ")}`,
  PORT: "must be a whole number from 1 to 65535",
  LOG_LEVEL: `must be one of: ${LOG_LEVELS.join(", ")}`,
  TZ: "must be a time zone name such as Asia/Manila",
  DATABASE_URL: "must be a database connection URL",
  BODY_LIMIT: "must be a size such as 100kb or 1mb, at most 10mb",
  RATE_LIMIT_ENABLED: "must be true or false",
  RATE_LIMIT_WINDOW_MS: "must be a whole number from 1000 to 86400000",
  RATE_LIMIT_MAX: "must be a whole number from 1 to 100000",
  TRUST_PROXY: "must be a whole number from 0 to 10",
  JWT_SECRET: "must be at least 32 characters",
  COOKIE_SECURE: "must be true or false",
  SESSION_HOURS: "must be a whole number from 1 to 168",
  ADMIN_USERNAME: "must be 4 to 30 characters",
  ADMIN_PASSWORD: "must be 8 to 72 characters",
  DEFAULT_PASSWORD: "must be 8 to 72 characters",
  BCRYPT_COST: "must be a whole number from 4 to 15",
};

export class EnvError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(
      [
        "Invalid environment configuration:",
        ...problems.map((p) => `  - ${p}`),
      ].join("\n"),
    );
    this.name = "EnvError";
    this.problems = problems;
  }
}

const NODE_ENV_NOT_SET =
  "NODE_ENV is not set, so the production rules apply (on your own machine set NODE_ENV=development)";

// A missing or empty NODE_ENV counts as production (AUD-009): the server
// refuses to start unless every secret is given, and never falls back to the
// built-in ones.
function withDefaults(parsed: ParsedEnv): Env {
  const nodeEnv = parsed.NODE_ENV ?? "production";
  if (nodeEnv === "production") {
    const missing = REQUIRED_IN_PRODUCTION.filter(
      (key) => parsed[key] === undefined,
    );
    if (missing.length > 0) {
      throw new EnvError([
        ...(parsed.NODE_ENV === undefined ? [NODE_ENV_NOT_SET] : []),
        ...missing.map((key) => `${key} is missing`),
      ]);
    }
  }
  return {
    ...parsed,
    NODE_ENV: nodeEnv,
    JWT_SECRET: parsed.JWT_SECRET ?? DEV_JWT_SECRET,
    COOKIE_SECURE: parsed.COOKIE_SECURE ?? false,
    SESSION_HOURS: parsed.SESSION_HOURS ?? 8,
    ADMIN_USERNAME: parsed.ADMIN_USERNAME ?? DEV_ADMIN_USERNAME,
    ADMIN_PASSWORD: parsed.ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD,
    DEFAULT_PASSWORD: parsed.DEFAULT_PASSWORD ?? DEV_DEFAULT_PASSWORD,
    BCRYPT_COST: parsed.BCRYPT_COST ?? (nodeEnv === "test" ? 4 : 12),
  };
}

export function parseEnv(
  source: Readonly<Record<string, string | undefined>>,
): Env {
  const input: Partial<Record<EnvKey, string>> = {};
  for (const key of ENV_KEYS) {
    const value = source[key];
    if (value !== undefined && value !== "") {
      input[key] = value;
    }
  }

  const result = envSchema.safeParse(input);
  if (result.success) {
    return withDefaults(result.data);
  }

  const badKeys = new Set(result.error.issues.map((issue) => issue.path[0]));
  const problems = ENV_KEYS.filter((key) => badKeys.has(key)).map((key) =>
    input[key] === undefined ? `${key} is missing` : `${key} ${RULES[key]}`,
  );
  throw new EnvError(problems);
}
