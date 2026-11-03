import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { buildLoggerOptions, createLogger } from "./logger.js";

function captureStream(): { stream: Writable; lines: () => string[] } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString("utf8"));
      callback();
    },
  });
  return {
    stream,
    lines: () =>
      chunks
        .join("")
        .split("\n")
        .filter((line) => line !== ""),
  };
}

describe("createLogger redaction", () => {
  it("redacts password, cookie, authorization and set-cookie fields", () => {
    const capture = captureStream();
    const logger = createLogger(
      { NODE_ENV: "test", LOG_LEVEL: "info" },
      capture.stream,
    );

    logger.info(
      {
        password: "pw-top-111",
        user: { password: "pw-nested-222" },
        cookie: "cookie-top-333",
        authorization: "auth-top-444",
        req: {
          headers: {
            cookie: "cookie-header-555",
            authorization: "Bearer auth-header-666",
          },
        },
        res: { headers: { "set-cookie": "set-cookie-777" } },
      },
      "redaction check",
    );

    const output = capture.lines().join("\n");
    for (const secret of ["111", "222", "333", "444", "555", "666", "777"]) {
      expect(output).not.toContain(secret);
    }

    const line = JSON.parse(capture.lines()[0] ?? "{}") as {
      password: string;
      user: { password: string };
      cookie: string;
      authorization: string;
      req: { headers: { cookie: string; authorization: string } };
      res: { headers: { "set-cookie": string } };
      msg: string;
    };
    expect(line.password).toBe("[REDACTED]");
    expect(line.user.password).toBe("[REDACTED]");
    expect(line.cookie).toBe("[REDACTED]");
    expect(line.authorization).toBe("[REDACTED]");
    expect(line.req.headers.cookie).toBe("[REDACTED]");
    expect(line.req.headers.authorization).toBe("[REDACTED]");
    expect(line.res.headers["set-cookie"]).toBe("[REDACTED]");
    expect(line.msg).toBe("redaction check");
  });
});

describe("createLogger level", () => {
  it("writes nothing when LOG_LEVEL is silent", () => {
    const capture = captureStream();
    const logger = createLogger(
      { NODE_ENV: "test", LOG_LEVEL: "silent" },
      capture.stream,
    );

    logger.error("should not appear");

    expect(capture.lines()).toEqual([]);
  });

  it("drops messages below LOG_LEVEL", () => {
    const capture = captureStream();
    const logger = createLogger(
      { NODE_ENV: "test", LOG_LEVEL: "warn" },
      capture.stream,
    );

    logger.info("dropped");
    logger.warn("kept");

    const messages = capture
      .lines()
      .map((line) => (JSON.parse(line) as { msg: string }).msg);
    expect(messages).toEqual(["kept"]);
  });
});

describe("buildLoggerOptions", () => {
  it("uses pino-pretty only in development", () => {
    const dev = buildLoggerOptions({
      NODE_ENV: "development",
      LOG_LEVEL: "debug",
    });
    const test = buildLoggerOptions({ NODE_ENV: "test", LOG_LEVEL: "info" });
    const prod = buildLoggerOptions({
      NODE_ENV: "production",
      LOG_LEVEL: "info",
    });

    expect(dev.transport).toEqual({ target: "pino-pretty" });
    expect(test.transport).toBeUndefined();
    expect(prod.transport).toBeUndefined();
  });

  it("sets the level from LOG_LEVEL", () => {
    expect(
      buildLoggerOptions({ NODE_ENV: "production", LOG_LEVEL: "warn" }).level,
    ).toBe("warn");
  });
});
