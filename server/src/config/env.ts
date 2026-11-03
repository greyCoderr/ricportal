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

const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  TZ: z.string().min(1).default("Asia/Manila"),
  DATABASE_URL: z.string().min(1),
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
