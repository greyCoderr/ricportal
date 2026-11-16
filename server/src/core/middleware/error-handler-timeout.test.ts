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

describe("a transaction that ran out of time answers 503 (AUD-015)", () => {
  it("P2028 is SERVICE_UNAVAILABLE, so the page offers to try again", async () => {
    const { app } = buildApp(
      prismaError(
        "PrismaClientKnownRequestError",
        "P2028",
        "Transaction API error: Transaction already closed",
      ),
    );
    const res = await request(app).get("/throw");
    expect(res.status).toBe(503);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      "SERVICE_UNAVAILABLE",
    );
  });
});
