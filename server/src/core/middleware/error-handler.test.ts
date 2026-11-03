import { Writable } from "node:stream";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitedError,
  RuleViolationError,
  StateInvalidError,
  UnauthenticatedError,
  ValidationError,
} from "../errors.js";
import { createLogger } from "../logger.js";
import { createErrorHandler } from "./error-handler.js";
import { requestId } from "./request-id.js";

const SECRET_SQL = "SELECT * FROM users WHERE password='hunter2'";

function buildApp(): { app: express.Express; logs: () => string } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString("utf8"));
      callback();
    },
  });
  const logger = createLogger({ NODE_ENV: "test", LOG_LEVEL: "info" }, stream);

  const app = express();
  app.use(requestId);
  const appErrors = {
    validation: () =>
      new ValidationError("Check the form.", [
        { field: "name", message: "Required." },
      ]),
    unauthenticated: () => new UnauthenticatedError(),
    forbidden: () => new ForbiddenError(),
    "not-found": () => new NotFoundError(),
    conflict: () => new ConflictError(),
    "state-invalid": () => new StateInvalidError(),
    "rule-violation": () => new RuleViolationError(),
    "rate-limited": () => new RateLimitedError(),
    internal: () => new InternalError(),
  };
  for (const [name, make] of Object.entries(appErrors)) {
    app.get(`/throw/${name}`, () => {
      throw make();
    });
  }
  app.get("/throw-unknown", () => {
    throw new Error(SECRET_SQL);
  });
  app.get("/reject-async", async () => {
    await Promise.resolve();
    throw new ConflictError("Async conflict.");
  });
  app.get("/reject-async-unknown", () => Promise.reject(new Error(SECRET_SQL)));
  app.use(createErrorHandler(logger));

  return { app, logs: () => chunks.join("") };
}

const expected = [
  ["validation", 400, "VALIDATION_ERROR"],
  ["unauthenticated", 401, "UNAUTHENTICATED"],
  ["forbidden", 403, "FORBIDDEN"],
  ["not-found", 404, "NOT_FOUND"],
  ["conflict", 409, "CONFLICT"],
  ["state-invalid", 409, "STATE_INVALID"],
  ["rule-violation", 422, "RULE_VIOLATION"],
  ["rate-limited", 429, "RATE_LIMITED"],
  ["internal", 500, "INTERNAL"],
] as const;

describe("errorHandler", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(expected)(
    "AppError %s returns %i with the standard shape",
    async (name, status, code) => {
      const { app } = buildApp();

      const res = await request(app).get(`/throw/${name}`);

      expect(res.status).toBe(status);
      expect(Object.keys(res.body as object)).toEqual(["error"]);
      const body = res.body as {
        error: { code: string; message: string; details: unknown[] };
      };
      expect(Object.keys(body.error).sort()).toEqual([
        "code",
        "details",
        "message",
      ]);
      expect(body.error.code).toBe(code);
      expect(typeof body.error.message).toBe("string");
      expect(Array.isArray(body.error.details)).toBe(true);
    },
  );

  it("keeps validation details", async () => {
    const { app } = buildApp();

    const res = await request(app).get("/throw/validation");

    expect(res.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Check the form.",
        details: [{ field: "name", message: "Required." }],
      },
    });
  });

  it("turns an unknown error into INTERNAL 500 without leaking it, and logs it with the request id", async () => {
    const { app, logs } = buildApp();

    const res = await request(app)
      .get("/throw-unknown")
      .set("X-Request-Id", "req-known-0001");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: "INTERNAL",
        message: "Something went wrong. Please try again.",
        details: [],
      },
    });
    expect(res.text).not.toContain("SELECT");
    expect(res.text).not.toContain("hunter2");
    expect(res.text).not.toContain(" at ");

    const logLine = JSON.parse(logs().trim().split("\n").at(-1) ?? "{}") as {
      requestId: string;
      err: { message: string; stack: string };
      method: string;
      path: string;
    };
    expect(logLine.requestId).toBe("req-known-0001");
    expect(logLine.err.message).toContain("SELECT");
    expect(logLine.err.stack.length).toBeGreaterThan(0);
    expect(logLine.method).toBe("GET");
    expect(logLine.path).toBe("/throw-unknown");
  });

  it("receives errors from a rejected async handler (Express 5)", async () => {
    const { app } = buildApp();

    const res = await request(app).get("/reject-async");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: "CONFLICT", message: "Async conflict.", details: [] },
    });
  });

  it("hides an unknown rejected promise as INTERNAL 500", async () => {
    const { app } = buildApp();

    const res = await request(app).get("/reject-async-unknown");

    expect(res.status).toBe(500);
    expect(res.text).not.toContain("SELECT");
  });

  it("includes no stack in development either", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { app } = buildApp();

    const res = await request(app).get("/throw-unknown");

    expect(res.status).toBe(500);
    expect(res.text).not.toContain("stack");
    expect(res.text).not.toContain(" at ");
    expect(res.text).not.toContain("SELECT");
  });
});
