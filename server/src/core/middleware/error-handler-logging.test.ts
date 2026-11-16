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

describe("database errors are logged without their values (BR-21, AUD-019)", () => {
  it("a validation error is logged by name only, never with its arguments", async () => {
    const { app, logs } = buildApp(
      prismaError(
        "PrismaClientValidationError",
        undefined,
        `Invalid \`prisma.student.create()\` invocation: { data: { firstName: "${CHILD}" } }`,
      ),
    );

    const res = await request(app).get("/throw");

    expect(res.status).toBe(500);
    expect(logs()).toContain("PrismaClientValidationError");
    expect(logs()).not.toContain("Juan");
    expect(logs()).not.toContain("2022-01-05");
  });

  it("a known request error keeps its code in the log, without message or meta", async () => {
    const { app, logs } = buildApp(
      prismaError(
        "PrismaClientKnownRequestError",
        "P2003",
        `Foreign key constraint failed ${CHILD}`,
      ),
    );

    await request(app).get("/throw");

    expect(logs()).toContain("P2003");
    expect(logs()).toContain("PrismaClientKnownRequestError");
    expect(logs()).not.toContain("Juan");
  });

  it("any other error is still logged in full", async () => {
    const { app, logs } = buildApp(new Error("plain failure in our own code"));
    await request(app).get("/throw");
    expect(logs()).toContain("plain failure in our own code");
  });
});
