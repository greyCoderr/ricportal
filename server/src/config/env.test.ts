import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env.js";

const DB = "mysql://user@127.0.0.1:3306/ricportal_fake";

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
    });

    expect(env).toEqual({
      NODE_ENV: "production",
      PORT: 8080,
      LOG_LEVEL: "warn",
      TZ: "Asia/Manila",
      DATABASE_URL: DB,
    });
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
