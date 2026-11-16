import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Stage J1d, docs/AUDIT_REPORT.md.

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await seedWorld(prisma);
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
});

describe("the database session uses UTC (AUD-022)", () => {
  it("a row that takes the column default gets the same time as one written by the application", async () => {
    const before = Date.now();
    await prisma.$executeRawUnsafe(
      "INSERT INTO centers (name, updated_at) VALUES ('Clock Check', NOW(3))",
    );
    const row = await prisma.center.findUniqueOrThrow({
      where: { name: "Clock Check" },
    });
    const minutesOff = Math.abs(row.createdAt.getTime() - before) / 60_000;
    expect(minutesOff).toBeLessThan(2);
    expect(Math.abs(row.updatedAt.getTime() - before) / 60_000).toBeLessThan(2);
  });
});
