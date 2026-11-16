import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AppConfig } from "../../config/app-config.js";
import { upRepository } from "../../../test/stub-health.js";
import { testConfig } from "../../../test/test-config.js";
import { createLogger } from "../logger.js";
import { createErrorHandler } from "./error-handler.js";
import { applyRequestPipeline } from "./pipeline.js";
import { requestId } from "./request-id.js";

const logger = createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" });

function appWith(overrides: Partial<AppConfig> = {}): express.Express {
  return createApp({
    logger,
    config: testConfig(overrides),
    health: { repository: upRepository() },
  });
}

// A test-only app that uses the real pipeline plus routes that do not exist
// in production, to observe cookies and compression.
function pipelineApp(): express.Express {
  const app = express();
  app.use(requestId);
  applyRequestPipeline(app, testConfig());
  app.get("/test/cookies", (req, res) => {
    res.json({ data: req.cookies as Record<string, string>, meta: {} });
  });
  app.get("/test/large", (_req, res) => {
    res.json({ data: { text: "x".repeat(10_000) }, meta: {} });
  });
  app.use(createErrorHandler(logger));
  return app;
}

describe("helmet", () => {
  it("sets security headers and removes x-powered-by", async () => {
    const res = await request(appWith()).get("/api/x");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("CSP: fonts from the same origin only, styles from the same origin plus inline (DEC-022)", async () => {
    const res = await request(appWith()).get("/api/health");
    const csp = String(res.headers["content-security-policy"]);
    const directives = new Map(
      csp.split(";").map((part) => {
        const [name = "", ...values] = part.trim().split(/\s+/);
        return [name, values] as const;
      }),
    );

    expect(directives.get("default-src")).toEqual(["'self'"]);
    expect(directives.get("font-src")).toEqual(["'self'"]);
    // React and FullCalendar set inline styles, so 'unsafe-inline' stays.
    expect(directives.get("style-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directives.get("script-src")).toEqual(["'self'"]);
    expect(csp).not.toContain("https:");
    expect(csp).not.toContain("fonts.googleapis.com");
    expect(csp).not.toContain("fonts.gstatic.com");
  });
});

describe("JSON body limit", () => {
  it("returns 413 PAYLOAD_TOO_LARGE without the parser message", async () => {
    const big = JSON.stringify({ text: "x".repeat(2048) });

    const res = await request(appWith({ BODY_LIMIT: "1kb" }))
      .post("/api/x")
      .set("Content-Type", "application/json")
      .send(big);

    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
        details: [],
      },
    });
    expect(res.text).not.toMatch(/entity|limit|1024/i);
  });

  it("accepts a body under the limit", async () => {
    const res = await request(appWith({ BODY_LIMIT: "1kb" }))
      .post("/api/x")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ ok: true }));

    expect(res.status).toBe(404);
  });
});

describe("global rate limit", () => {
  it("returns 429 RATE_LIMITED with Retry-After after RATE_LIMIT_MAX requests", async () => {
    const app = appWith({ RATE_LIMIT_ENABLED: true, RATE_LIMIT_MAX: 3 });

    for (let i = 0; i < 3; i += 1) {
      const res = await request(app).get("/api/x");
      expect(res.status).not.toBe(429);
    }
    const limited = await request(app).get("/api/x");

    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait and try again.",
        details: [],
      },
    });
    const retryAfter = Number(limited.headers["retry-after"]);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(limited.headers["x-request-id"]).toBeDefined();
  });

  it("never limits when RATE_LIMIT_ENABLED is false", async () => {
    const app = appWith({ RATE_LIMIT_ENABLED: false, RATE_LIMIT_MAX: 1 });

    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).get("/api/x");
      expect(res.status).toBe(404);
    }
  });

  it("ignores X-Forwarded-For when TRUST_PROXY is 0 (one shared bucket)", async () => {
    const app = appWith({
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_MAX: 1,
      TRUST_PROXY: 0,
    });

    const first = await request(app)
      .get("/api/x")
      .set("X-Forwarded-For", "203.0.113.10");
    const second = await request(app)
      .get("/api/x")
      .set("X-Forwarded-For", "203.0.113.20");

    expect(first.status).toBe(404);
    expect(second.status).toBe(429);
  });

  it("keys by the forwarded client address when TRUST_PROXY is 1", async () => {
    const app = appWith({
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_MAX: 1,
      TRUST_PROXY: 1,
    });

    const first = await request(app)
      .get("/api/x")
      .set("X-Forwarded-For", "203.0.113.10");
    const second = await request(app)
      .get("/api/x")
      .set("X-Forwarded-For", "203.0.113.20");

    expect(first.status).toBe(404);
    expect(second.status).toBe(404);
  });
});

describe("cookie-parser", () => {
  it("parses the Cookie header into req.cookies", async () => {
    const res = await request(pipelineApp())
      .get("/test/cookies")
      .set("Cookie", "a=1; b=two");

    expect(res.body).toEqual({ data: { a: "1", b: "two" }, meta: {} });
  });
});

describe("compression", () => {
  it("gzips a large response when the client accepts gzip", async () => {
    const res = await request(pipelineApp())
      .get("/test/large")
      .set("Accept-Encoding", "gzip");

    // The header proves the server compressed it; Supertest decodes the body.
    expect(res.headers["content-encoding"]).toBe("gzip");
    const body = res.body as { data: { text: string } };
    expect(body.data.text).toHaveLength(10_000);
  });

  it("does not compress when the client does not accept gzip", async () => {
    const res = await request(pipelineApp())
      .get("/test/large")
      .set("Accept-Encoding", "identity");

    expect(res.headers["content-encoding"]).toBeUndefined();
  });
});

// AUD-016 (docs/AUDIT_REPORT.md): the global limit is for the API. Files of the
// built client (scripts, images) do not use it up.
describe("global rate limit covers /api only (AUD-016)", () => {
  it("requests outside /api are never limited and do not count", async () => {
    const app = appWith({ RATE_LIMIT_ENABLED: true, RATE_LIMIT_MAX: 2 });

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app).get(`/assets/script-${String(i)}.js`);
      expect(res.status).toBe(404);
    }
    expect((await request(app).get("/api/x")).status).toBe(404);
    expect((await request(app).get("/api/x")).status).toBe(404);
    expect((await request(app).get("/api/x")).status).toBe(429);
    expect((await request(app).get("/assets/logo.png")).status).toBe(404);
  });
});
