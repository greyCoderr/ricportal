import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createTestPrisma();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function migrationCount(): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: bigint | number }[]>`
    SELECT COUNT(*) AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
  return Number(rows[0]?.n ?? 0);
}

describe("test database", () => {
  it("is connected to a database whose name ends with _test", async () => {
    const rows = await prisma.$queryRaw<{ name: string | null }[]>`
      SELECT DATABASE() AS name`;
    expect(rows[0]?.name).toMatch(/_test$/);
  });

  it("has the migrations applied (settings table exists)", async () => {
    expect(await migrationCount()).toBeGreaterThanOrEqual(1);
    await expect(prisma.setting.count()).resolves.toBeTypeOf("number");
  });

  it("resetDatabase empties app tables and keeps the migration history", async () => {
    const before = await migrationCount();
    await prisma.setting.create({
      data: { key: "resetCheck", value: "1" },
    });
    expect(await prisma.setting.count()).toBeGreaterThanOrEqual(1);

    await resetDatabase(prisma);

    expect(await prisma.setting.count()).toBe(0);
    expect(await migrationCount()).toBe(before);
  });
});
