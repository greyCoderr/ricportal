import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, createCenter, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Stage J1d, docs/AUDIT_REPORT.md.

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
  app = buildApp(prisma);
  world = await seedWorld(prisma);
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
});

describe("a moved Teacher no longer sees the old center's reports (BR-02, AUD-021)", () => {
  type Summary = {
    data: {
      counts: { submittedReports: number; pendingReports: number };
      reports: unknown[];
      activity: unknown[];
    };
    meta: { total: number };
  };

  it("the Teacher Profile counts and lists only the current center", async () => {
    const report = await prisma.report.create({
      data: {
        centerId: world.centerA.id,
        teacherId: world.teacherA.id,
        type: "LIQUIDATION",
        status: "SUBMITTED",
        periodStart: new Date("2026-11-01T00:00:00Z"),
        periodEnd: new Date("2026-11-30T00:00:00Z"),
        submittedAt: new Date("2026-11-03T01:30:00Z"),
      },
    });
    await prisma.liquidationSnapshot.create({
      data: { reportId: report.id, versionNo: 1, payload: { total: "0.00" } },
    });
    const teacher = await loginAs(app, "teacher.a");
    const before = (await teacher.get("/api/auth/profile/teacher-summary"))
      .body as Summary;
    expect(before.data.counts.submittedReports).toBe(1);

    const other = await createCenter(prisma, "Center C");
    const admin = await loginAs(app, "admin.t");
    expect(
      (
        await admin
          .patch(`/api/teachers/${String(world.teacherA.id)}`)
          .send({ centerId: other.id })
      ).status,
    ).toBe(200);

    const after = (await teacher.get("/api/auth/profile/teacher-summary"))
      .body as Summary;
    expect(after.data.counts.submittedReports).toBe(0);
    expect(after.data.counts.pendingReports).toBe(0);
    expect(after.data.reports).toEqual([]);
    expect(after.data.activity).toEqual([]);
    expect(after.meta.total).toBe(0);
  });
});
