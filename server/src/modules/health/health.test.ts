import { Writable } from "node:stream";
import type { Logger } from "pino";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import type { AppConfig } from "../../config/app-config.js";
import { HEALTH_TIMEOUT_MS } from "../../config/limits.js";
import { ServiceUnavailableError } from "../../core/errors.js";
import { createLogger } from "../../core/logger.js";
import { testConfig } from "../../../test/test-config.js";
import {
  downRepository,
  hangingRepository,
  upRepository,
} from "../../../test/stub-health.js";
import type { HealthRepository } from "./health.repository.js";
import { createHealthService } from "./health.service.js";

const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const LEAKY_ERROR = Object.assign(
  new Error(
    "connect ECONNREFUSED 127.0.0.1:3306 mysql host=db.internal user=root password=s3cret ricportal",
  ),
  { code: "ECONNREFUSED" },
);
const FORBIDDEN_WORDS = [
  "host",
  "password",
  "mysql",
  "s3cret",
  "econnrefused",
  "127.0.0.1",
  "db.internal",
  "ricportal",
  "root",
  "stack",
];

const silent = createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" });

function capturingLogger(): { logger: Logger; lines: string[] } {
  const lines: string[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString("utf8"));
      callback();
    },
  });
  return {
    logger: createLogger({ NODE_ENV: "test", LOG_LEVEL: "warn" }, destination),
    lines,
  };
}

type AppOptions = {
  timeoutMs?: number;
  config?: Partial<AppConfig>;
  logger?: Logger;
};

function appWith(repository: HealthRepository, options: AppOptions = {}) {
  return createApp({
    logger: options.logger ?? silent,
    config: testConfig(options.config),
    health: { repository, timeoutMs: options.timeoutMs },
  });
}

const UNAVAILABLE = {
  error: {
    code: "SERVICE_UNAVAILABLE",
    message: "The service is temporarily unavailable. Please try again.",
    details: [],
  },
};

type HealthBody = { data: { status: string; db: string; time: string } };

describe("GET /api/health", () => {
  it("returns 200 with status ok, db up and an ISO UTC time when the database answers", async () => {
    const before = Date.now();
    const res = await request(appWith(upRepository())).get("/api/health");
    const after = Date.now();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        status: "ok",
        db: "up",
        time: expect.stringMatching(ISO_UTC) as unknown,
      },
      meta: {},
    });
    const { time } = (res.body as HealthBody).data;
    const parsed = Date.parse(time);
    expect(new Date(parsed).toISOString()).toBe(time);
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });

  it("returns 503 SERVICE_UNAVAILABLE without any database text when the database fails", async () => {
    const res = await request(appWith(downRepository(LEAKY_ERROR))).get(
      "/api/health",
    );

    expect(res.status).toBe(503);
    expect(res.body).toEqual(UNAVAILABLE);
    const text = res.text.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      expect(text).not.toContain(word);
    }
    expect(res.text).not.toContain(LEAKY_ERROR.message);
  });

  it("returns 503 within the timeout when the database hangs", async () => {
    const started = Date.now();
    const res = await request(
      appWith(hangingRepository(), { timeoutMs: 100 }),
    ).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual(UNAVAILABLE);
    // Raised from 1000 after a 1450 ms run under full-suite load (sprint log).
    // Still shorter than the 2000 ms production timeout; the repository hangs
    // forever, so only the 100 ms timeout can end this request.
    expect(Date.now() - started).toBeLessThan(1900);
  });

  it.each([
    ["up", upRepository()],
    ["down", downRepository(LEAKY_ERROR)],
  ])(
    "sets X-Request-Id and Cache-Control: no-store when the database is %s",
    async (_state, repository) => {
      const res = await request(appWith(repository)).get("/api/health");

      expect(res.headers["x-request-id"]).toMatch(SAFE_ID);
      expect(res.headers["cache-control"]).toBe("no-store");
    },
  );

  it("keeps a safe incoming X-Request-Id", async () => {
    const res = await request(appWith(upRepository()))
      .get("/api/health")
      .set("X-Request-Id", "monitor-12345678");

    expect(res.headers["x-request-id"]).toBe("monitor-12345678");
  });

  it("is covered by the global rate limit", async () => {
    const app = appWith(upRepository(), {
      config: { RATE_LIMIT_ENABLED: true, RATE_LIMIT_MAX: 2 },
    });

    expect((await request(app).get("/api/health")).status).toBe(200);
    expect((await request(app).get("/api/health")).status).toBe(200);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(429);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      "RATE_LIMITED",
    );
  });

  it("returns the standard 404 for POST", async () => {
    const res = await request(appWith(upRepository())).post("/api/health");

    expect(res.status).toBe(404);
    expect((res.body as { error: { code: string } }).error.code).toBe(
      "NOT_FOUND",
    );
  });

  it("logs a warning with only the error code when the database is down", async () => {
    const { logger, lines } = capturingLogger();
    await request(appWith(downRepository(LEAKY_ERROR), { logger })).get(
      "/api/health",
    );

    const logged = lines.join("");
    expect(logged).toContain("health check: database down");
    expect(logged).toContain('"code":"ECONNREFUSED"');
    expect(logged).not.toContain("s3cret");
    expect(logged).not.toContain("127.0.0.1");
    expect(logged).not.toContain("db.internal");
  });
});

describe("health service", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses a 2 second timeout by default", () => {
    expect(HEALTH_TIMEOUT_MS).toBe(2000);
  });

  it("clears its timer after a fast ping", async () => {
    vi.useFakeTimers();
    const service = createHealthService({
      repository: upRepository(),
      logger: silent,
    });

    await expect(service.check()).resolves.toMatchObject({ db: "up" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("fails with ServiceUnavailableError exactly at the default timeout", async () => {
    vi.useFakeTimers();
    const { logger, lines } = capturingLogger();
    const service = createHealthService({
      repository: hangingRepository(),
      logger,
    });

    const result = service.check();
    const settled = vi.fn();
    result.then(settled, settled);

    await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS - 1);
    expect(settled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableError);
    expect(lines.join("")).toContain('"code":"timeout"');
  });

  it("uses the injected clock for time", async () => {
    const service = createHealthService({
      repository: upRepository(),
      logger: silent,
      now: () => new Date("2026-11-03T02:30:00.000Z"),
    });

    await expect(service.check()).resolves.toEqual({
      status: "ok",
      db: "up",
      time: "2026-11-03T02:30:00.000Z",
    });
  });
});
