import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Polish Round 3 (docs/POLISH_PLAN_3.md). H1: the RIC Teachers list carries the
// account's created date for the Date Approved column (D6).

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma, { now: () => new Date("2026-11-06T02:00:00Z") });
  world = await seedWorld(prisma);
});

describe("RIC Teachers list (D6)", () => {
  it("each row has createdAt, the date the account was approved", async () => {
    const created = new Date("2026-05-15T17:00:00.000Z");
    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: { createdAt: created },
    });
    const admin = await loginAs(app, "admin.t");
    const res = await admin.get("/api/teachers");
    expect(res.status).toBe(200);
    const rows = (res.body as { data: { id: number; createdAt: string }[] })
      .data;
    const row = rows.find((item) => item.id === world.teacherA.id);
    expect(row?.createdAt).toBe(created.toISOString());
    for (const item of rows) {
      expect(typeof item.createdAt).toBe("string");
    }
  });
});
