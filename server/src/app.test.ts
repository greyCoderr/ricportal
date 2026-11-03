import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createLogger } from "./core/logger.js";
import { testConfig } from "../test/test-config.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const app = createApp({
  logger: createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
  config: testConfig(),
});

describe("createApp", () => {
  it("returns the 404 shape for an unknown route", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found.",
        details: [],
      },
    });
  });

  it("returns VALIDATION_ERROR 400 for an invalid JSON body without the parser message", async () => {
    const res = await request(app)
      .post("/api/anything")
      .set("Content-Type", "application/json")
      .send('{"a":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body is not valid JSON.",
        details: [],
      },
    });
    expect(res.text).not.toMatch(/Unexpected|position|JSON\.parse/);
  });
});

describe("request id", () => {
  it("keeps a safe incoming X-Request-Id", async () => {
    const res = await request(app)
      .get("/api/x")
      .set("X-Request-Id", "abc12345-test_ID");

    expect(res.headers["x-request-id"]).toBe("abc12345-test_ID");
  });

  it("generates a UUID when none is sent", async () => {
    const res = await request(app).get("/api/x");

    expect(res.headers["x-request-id"]).toMatch(UUID);
  });

  it.each([
    "<script>alert(1)</script>",
    "short",
    "has space inside",
    "a".repeat(65),
    "semi;colon;value",
  ])("replaces an unsafe id %j with a new UUID", async (unsafe) => {
    const res = await request(app).get("/api/x").set("X-Request-Id", unsafe);

    expect(res.headers["x-request-id"]).toMatch(UUID);
  });

  it("sets the header on error responses too", async () => {
    const notFound = await request(app).get("/api/x");
    const badJson = await request(app)
      .post("/api/x")
      .set("Content-Type", "application/json")
      .send("{");

    expect(notFound.headers["x-request-id"]).toMatch(UUID);
    expect(badJson.headers["x-request-id"]).toMatch(UUID);
  });
});
