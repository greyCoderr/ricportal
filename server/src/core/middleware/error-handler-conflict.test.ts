import { Writable } from "node:stream";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createLogger } from "../logger.js";
import { createErrorHandler } from "./error-handler.js";
import { requestId } from "./request-id.js";

// AUD-005, AUD-006, AUD-015 and AUD-019 (docs/AUDIT_REPORT.md): what the error
// handler does with errors that come from the database layer.

const CHILD = "Juan Dela Cruz 2022-01-05";

function prismaError(name: string, code: string | undefined, message: string) {
  const error = new Error(message);
  error.name = name;
  if (code !== undefined) {
    Object.assign(error, {
      code,
      meta: { target: ["username"], value: CHILD },
    });
  }
  return error;
}

function buildApp(thrown: Error) {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString("utf8"));
      callback();
    },
  });
  const app = express();
  app.use(requestId);
  app.get("/throw", () => {
    throw thrown;
  });
  app.use(
    createErrorHandler(
      createLogger({ NODE_ENV: "test", LOG_LEVEL: "info" }, stream),
    ),
  );
  return { app, logs: () => chunks.join("") };
}

describe("database conflicts answer 409, not 500 (AUD-005, AUD-006)", () => {
  it.each([
    ["a unique index (P2002)", "P2002"],
    ["a write conflict or deadlock (P2034)", "P2034"],
  ])("%s", async (_name, code) => {
    const { app } = buildApp(
      prismaError(
        "PrismaClientKnownRequestError",
        code,
        `Unique constraint failed on the fields: (\`username\`) ${CHILD}`,
      ),
    );

    const res = await request(app).get("/throw");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: {
        code: "CONFLICT",
        message:
          "This was just saved by another request. Please refresh and try again.",
        details: [],
      },
    });
    expect(JSON.stringify(res.body)).not.toContain("username");
  });

  it("a deadlock reported by the driver (MySQL 1213) is a 409 too", async () => {
    const error = new Error("Deadlock found when trying to get lock");
    error.name = "DriverAdapterError";
    Object.assign(error, {
      cause: { originalCode: "1213", kind: "mysql" },
    });
    const res = await request(buildApp(error).app).get("/throw");
    expect(res.status).toBe(409);
  });
});
