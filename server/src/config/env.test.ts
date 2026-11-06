import { DEFAULT_SERVER_PORT } from "@ricportal/shared";
import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env.js";

const DB = "mysql://user@127.0.0.1:3306/ricportal_fake";
const PROD_SECRET = "fake-production-secret-for-this-test-only";

function errorFrom(source: Record<string, string | undefined>): EnvError {
  try {
    parseEnv(source);
  } catch (error) {
    if (error instanceof EnvError) {
      return error;
    }
    throw error;
  }
  throw new Error("parseEnv did not throw");
}

describe("parseEnv", () => {
  it("parses a valid environment with the right types", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      PORT: "8080",
      LOG_LEVEL: "warn",
      TZ: "Asia/Manila",
      DATABASE_URL: DB,
      JWT_SECRET: PROD_SECRET,
      COOKIE_SECURE: "true",
      SESSION_HOURS: "8",
      ADMIN_USERNAME: "mao.admin",
      ADMIN_PASSWORD: "NotADefault2026",
    });

    expect(env).toEqual({
      NODE_ENV: "production",
      PORT: 8080,
      LOG_LEVEL: "warn",
      TZ: "Asia/Manila",
      DATABASE_URL: DB,
      BODY_LIMIT: "100kb",
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_WINDOW_MS: 900_000,
      RATE_LIMIT_MAX: 300,
      TRUST_PROXY: 0,
      JWT_SECRET: PROD_SECRET,
      COOKIE_SECURE: true,
      SESSION_HOURS: 8,
      ADMIN_USERNAME: "mao.admin",
      ADMIN_PASSWORD: "NotADefault2026",
      BCRYPT_COST: 12,
    });
  });

  it("gives development safe defaults for the auth settings", () => {
    const env = parseEnv({ DATABASE_URL: DB });
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.SESSION_HOURS).toBe(8);
    expect(env.ADMIN_USERNAME).toBe("admin");
    expect(env.ADMIN_PASSWORD).toBe("Admin2026!");
    expect(env.BCRYPT_COST).toBe(12);
  });

  it("uses the low bcrypt cost in tests only", () => {
    expect(parseEnv({ DATABASE_URL: DB, NODE_ENV: "test" }).BCRYPT_COST).toBe(
      4,
    );
  });

  it("production must set the auth settings explicitly", () => {
    const error = errorFrom({ DATABASE_URL: DB, NODE_ENV: "production" });
    expect(error.problems).toEqual([
      "JWT_SECRET is missing",
      "COOKIE_SECURE is missing",
      "SESSION_HOURS is missing",
      "ADMIN_USERNAME is missing",
      "ADMIN_PASSWORD is missing",
    ]);
  });

  it("a short JWT_SECRET is refused without printing it", () => {
    const error = errorFrom({ DATABASE_URL: DB, JWT_SECRET: "short-secret" });
    expect(error.problems).toEqual([
      "JWT_SECRET must be at least 32 characters",
    ]);
    expect(error.message).not.toContain("short-secret");
  });

  it("applies defaults when only DATABASE_URL is given", () => {
    const env = parseEnv({ DATABASE_URL: DB });

    expect(env.NODE_ENV).toBe("development");
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.TZ).toBe("Asia/Manila");
  });

  it("treats an empty value as missing, so the default applies", () => {
    const env = parseEnv({ DATABASE_URL: DB, PORT: "" });

    expect(env.PORT).toBe(3000);
  });

  it("ignores variables it does not know", () => {
    const env = parseEnv({ DATABASE_URL: DB, SOMETHING_ELSE: "x" });

    expect(env).not.toHaveProperty("SOMETHING_ELSE");
  });

  it("fails with a readable message when DATABASE_URL is missing", () => {
    const error = errorFrom({ PORT: "3000" });

    expect(error.problems).toEqual(["DATABASE_URL is missing"]);
    expect(error.message).toContain("DATABASE_URL is missing");
  });

  it.each(["abc", "0", "70000", "3.5", "-1"])(
    "fails for PORT=%s without printing the value",
    (bad) => {
      const error = errorFrom({ DATABASE_URL: DB, PORT: bad });

      expect(error.problems).toEqual([
        "PORT must be a whole number from 1 to 65535",
      ]);
      expect(error.message).not.toContain(bad);
    },
  );

  it("names invalid NODE_ENV and LOG_LEVEL without printing their values", () => {
    const secret = "super-secret-xyz";
    const error = errorFrom({
      DATABASE_URL: DB,
      NODE_ENV: secret,
      LOG_LEVEL: secret,
    });

    expect(error.problems).toEqual([
      "NODE_ENV must be one of: development, test, production",
      "LOG_LEVEL must be one of: fatal, error, warn, info, debug, trace, silent",
    ]);
    expect(error.message).not.toContain(secret);
  });

  it("lists every bad variable in one message", () => {
    const error = errorFrom({ PORT: "abc", NODE_ENV: "nope" });

    expect(error.problems).toHaveLength(3);
    expect(error.message).toContain("NODE_ENV");
    expect(error.message).toContain("PORT");
    expect(error.message).toContain("DATABASE_URL");
  });
});

describe("parseEnv security settings", () => {
  it("applies safe defaults", () => {
    const env = parseEnv({ DATABASE_URL: DB });

    expect(env.BODY_LIMIT).toBe("100kb");
    expect(env.RATE_LIMIT_ENABLED).toBe(true);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(900_000);
    expect(env.RATE_LIMIT_MAX).toBe(300);
    expect(env.TRUST_PROXY).toBe(0);
  });

  it("parses valid values", () => {
    const env = parseEnv({
      DATABASE_URL: DB,
      BODY_LIMIT: "1mb",
      RATE_LIMIT_ENABLED: "false",
      RATE_LIMIT_WINDOW_MS: "60000",
      RATE_LIMIT_MAX: "50",
      TRUST_PROXY: "2",
    });

    expect(env.BODY_LIMIT).toBe("1mb");
    expect(env.RATE_LIMIT_ENABLED).toBe(false);
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(env.RATE_LIMIT_MAX).toBe(50);
    expect(env.TRUST_PROXY).toBe(2);
  });

  it.each([
    [
      "BODY_LIMIT",
      "20mb",
      "BODY_LIMIT must be a size such as 100kb or 1mb, at most 10mb",
    ],
    [
      "BODY_LIMIT",
      "abc",
      "BODY_LIMIT must be a size such as 100kb or 1mb, at most 10mb",
    ],
    [
      "BODY_LIMIT",
      "0kb",
      "BODY_LIMIT must be a size such as 100kb or 1mb, at most 10mb",
    ],
    ["RATE_LIMIT_ENABLED", "yes", "RATE_LIMIT_ENABLED must be true or false"],
    [
      "RATE_LIMIT_WINDOW_MS",
      "10",
      "RATE_LIMIT_WINDOW_MS must be a whole number from 1000 to 86400000",
    ],
    [
      "RATE_LIMIT_MAX",
      "0",
      "RATE_LIMIT_MAX must be a whole number from 1 to 100000",
    ],
    ["TRUST_PROXY", "11", "TRUST_PROXY must be a whole number from 0 to 10"],
    ["TRUST_PROXY", "-1", "TRUST_PROXY must be a whole number from 0 to 10"],
    ["TRUST_PROXY", "true", "TRUST_PROXY must be a whole number from 0 to 10"],
  ])("names %s=%s without printing the value", (key, value, problem) => {
    const error = errorFrom({ DATABASE_URL: DB, [key]: value });

    expect(error.problems).toEqual([problem]);
    expect(error.message).not.toContain(`=${value}`);
    expect(error.message).not.toContain(`"${value}"`);
  });

  it("never prints a secret-looking bad value", () => {
    const secret = "secret-marker-987";
    const error = errorFrom({
      DATABASE_URL: DB,
      BODY_LIMIT: secret,
      RATE_LIMIT_ENABLED: secret,
      RATE_LIMIT_WINDOW_MS: secret,
      RATE_LIMIT_MAX: secret,
      TRUST_PROXY: secret,
    });

    expect(error.problems).toHaveLength(5);
    expect(error.message).not.toContain(secret);
  });
});

describe("PORT default (shared with the client dev proxy)", () => {
  it("defaults PORT to DEFAULT_SERVER_PORT from shared", () => {
    expect(DEFAULT_SERVER_PORT).toBe(3000);
    expect(parseEnv({ DATABASE_URL: DB }).PORT).toBe(DEFAULT_SERVER_PORT);
  });
});
