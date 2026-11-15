import { LOCKED_MESSAGE } from "@ricportal/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { createLogger } from "../../src/core/logger.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createHealthRepository } from "../../src/modules/health/health.repository.js";
import { testConfig } from "../test-config.js";
import { buildApp, seedWorld, TEST_PASSWORD } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Stage J1d, docs/AUDIT_REPORT.md.

type ErrorBody = { error: { code: string; message: string } };

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  await seedWorld(prisma);
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
});

describe("failed logins from one address are limited (BR-19, P1-T07, AUD-010)", () => {
  const LIMIT = 30;

  function limitedApp() {
    return createApp({
      logger: createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      config: testConfig({ RATE_LIMIT_ENABLED: true, RATE_LIMIT_MAX: 100_000 }),
      health: { repository: createHealthRepository(prisma) },
      prisma,
    });
  }

  function login(
    target: ReturnType<typeof limitedApp>,
    username: string,
    password: string,
  ) {
    return request(target).post("/api/auth/login").send({ username, password });
  }

  it("one wrong password each on many usernames: the 31st attempt is refused", async () => {
    const target = limitedApp();
    for (let i = 0; i < LIMIT; i += 1) {
      const res = await login(target, `nobody.${String(i)}`, "Wrong2026pw");
      expect(res.status).toBe(401);
    }

    const refused = await login(target, "teacher.a", TEST_PASSWORD);

    expect(refused.status).toBe(429);
    expect((refused.body as ErrorBody).error.code).toBe("RATE_LIMITED");
    expect((refused.body as ErrorBody).error.message).toBe(LOCKED_MESSAGE);
    expect(Number(refused.headers["retry-after"])).toBeGreaterThan(0);
    // Only login is limited; the rest of the API still answers.
    expect((await request(target).get("/api/health")).status).toBe(200);
    expect((await request(target).get("/api/public/centers")).status).toBe(200);
  }, 60_000);

  it("successful logins do not use up the limit", async () => {
    const target = limitedApp();
    for (let i = 0; i < LIMIT + 5; i += 1) {
      expect((await login(target, "teacher.a", TEST_PASSWORD)).status).toBe(
        200,
      );
    }
    expect((await login(target, "nobody.here", "Wrong2026pw")).status).toBe(
      401,
    );
  }, 60_000);

  it("the limiter is off when RATE_LIMIT_ENABLED is false, as in the other tests", async () => {
    for (let i = 0; i < LIMIT + 2; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ username: `nobody.${String(i)}`, password: "Wrong2026pw" });
      expect(res.status).toBe(401);
    }
  }, 60_000);
});
