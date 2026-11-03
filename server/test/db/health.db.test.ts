import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { createLogger } from "../../src/core/logger.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createHealthRepository } from "../../src/modules/health/health.repository.js";
import { testConfig } from "../test-config.js";
import { createTestPrisma } from "./test-database.js";

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/health against ricportal_test", () => {
  it("returns 200 with db up through the real repository", async () => {
    const app = createApp({
      logger: createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      config: testConfig(),
      health: { repository: createHealthRepository(prisma) },
    });

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: { status: "ok", db: "up" },
      meta: {},
    });
  });
});
