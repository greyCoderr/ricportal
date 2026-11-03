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
  NODE_ENV: z.enum(NODE_ENVS).default("development"),
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
});

export type Env = z.output<typeof envSchema>;
type EnvKey = keyof Env;

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
    return result.data;
  }

  const badKeys = new Set(result.error.issues.map((issue) => issue.path[0]));
  const problems = ENV_KEYS.filter((key) => badKeys.has(key)).map((key) =>
    input[key] === undefined ? `${key} is missing` : `${key} ${RULES[key]}`,
  );
  throw new EnvError(problems);
}
