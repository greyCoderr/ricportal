import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pino from "pino";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { upRepository } from "../test/stub-health.js";
import { testConfig } from "../test/test-config.js";
import { createApp } from "./app.js";

describe("production client serving", () => {
  let dist: string;
  beforeAll(() => {
    dist = mkdtempSync(join(tmpdir(), "ricportal-dist-"));
    writeFileSync(
      join(dist, "index.html"),
      "<!doctype html><title>spa</title>",
    );
    writeFileSync(join(dist, "app.js"), "export {};");
  });
  afterAll(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  function app() {
    return createApp({
      logger: pino({ level: "silent" }),
      config: testConfig(),
      health: { repository: upRepository() },
      clientDist: dist,
    });
  }

  it("serves a built file", async () => {
    const res = await request(app()).get("/app.js");
    expect(res.status).toBe(200);
    expect(res.text).toContain("export");
  });

  it("falls back to index.html for a client route", async () => {
    const res = await request(app()).get("/students/12/profile");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>spa</title>");
  });

  it("keeps API routes and the JSON 404 for unknown API paths", async () => {
    const health = await request(app()).get("/api/health");
    expect(health.status).toBe(200);
    const missing = await request(app()).get("/api/nothing-here");
    expect(missing.status).toBe(404);
    expect((missing.body as { error: { code: string } }).error.code).toBe(
      "NOT_FOUND",
    );
  });

  it("without clientDist a non-API path is a JSON 404", async () => {
    const res = await request(
      createApp({
        logger: pino({ level: "silent" }),
        config: testConfig(),
        health: { repository: upRepository() },
      }),
    ).get("/students");
    expect(res.status).toBe(404);
  });
});
