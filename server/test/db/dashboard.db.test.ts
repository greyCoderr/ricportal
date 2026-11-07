import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createUser,
  loginAs,
  seedMenuDays,
  seedStudents,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

const URL = "/api/dashboard/summary";

type Summary = {
  activeTeachers: number;
  disabledTeachers: number;
  centersWithTeacher: number;
  enrolledStudents: number;
  reports: { submitted: number; needRevision: number; approved: number };
};

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
  await prisma.setting.createMany({
    data: [
      { key: "currentSchoolYear", value: "2026-2027" },
      { key: "perChildDailyRate", value: "25.00" },
    ],
  });
});

async function summary(): Promise<Summary> {
  const admin = await loginAs(app, "admin.t");
  const res = await admin.get(URL);
  expect(res.status).toBe(200);
  return (res.body as { data: Summary }).data;
}

describe("GET /api/dashboard/summary (D10)", () => {
  it("counts the teachers and leaves disabled ones out of the active count", async () => {
    await createUser(prisma, {
      username: "teacher.off",
      role: "TEACHER",
      status: "DISABLED",
      centerId: world.centerB.id,
    });
    const data = await summary();
    expect(data.activeTeachers).toBe(2);
    expect(data.disabledTeachers).toBe(1);
    expect(data.centersWithTeacher).toBe(2);
  });

  it("does not count a center whose only teacher is disabled", async () => {
    await prisma.user.update({
      where: { id: world.teacherB.id },
      data: { status: "DISABLED" },
    });
    const data = await summary();
    expect(data.activeTeachers).toBe(1);
    expect(data.centersWithTeacher).toBe(1);
  });

  it("counts active students of this school year across centers", async () => {
    await seedStudents(prisma, world.centerA.id, 3);
    await seedStudents(prisma, world.centerB.id, 2, { prefix: "Bee" });
    await seedStudents(prisma, world.centerA.id, 4, {
      status: "ARCHIVED",
      prefix: "Arch",
    });
    expect((await summary()).enrolledStudents).toBe(5);
  });

  it("leaves out students of an earlier school year", async () => {
    await seedStudents(prisma, world.centerA.id, 2);
    await prisma.student.updateMany({ data: { schoolYear: "2025-2026" } });
    await seedStudents(prisma, world.centerA.id, 1, { prefix: "Now" });
    expect((await summary()).enrolledStudents).toBe(1);
  });

  it("counts reports by status, with the database as the check", async () => {
    await seedMenuDays(prisma, world.admin.id, [
      ["2026-11-09", "PORK PICADILLO"],
      ["2026-11-10", "CHICKEN TINOLA"],
      ["2026-11-11", "EGG CALDERETA"],
    ]);
    const teacher = await loginAs(app, "teacher.a");
    const admin = await loginAs(app, "admin.t");
    const ids: number[] = [];
    for (const day of ["2026-11-09", "2026-11-10", "2026-11-11"]) {
      const pr = `/api/purchase-requests/${day}`;
      await teacher.post(`${pr}/open`);
      await teacher.post(`${pr}/lock`);
      const res = await teacher
        .post("/api/liquidation/submit")
        .send({ from: day, to: day });
      expect(res.status).toBe(201);
      ids.push((res.body as { data: { id: number } }).data.id);
    }
    await admin
      .post(`/api/reports/${String(ids[0])}/review`)
      .send({ decision: "APPROVED" });
    await admin
      .post(`/api/reports/${String(ids[1])}/review`)
      .send({ decision: "NEED_REVISION", feedback: "Please fix the rice." });

    const { reports } = await summary();
    expect(reports).toEqual({ submitted: 1, needRevision: 1, approved: 1 });
    for (const [key, status] of [
      ["submitted", "SUBMITTED"],
      ["needRevision", "NEED_REVISION"],
      ["approved", "APPROVED"],
    ] as const) {
      expect(reports[key]).toBe(
        await prisma.report.count({ where: { status } }),
      );
    }
  });

  it("an empty system is all zeros", async () => {
    await prisma.user.updateMany({
      where: { role: "TEACHER" },
      data: { status: "DISABLED" },
    });
    expect(await summary()).toEqual({
      activeTeachers: 0,
      disabledTeachers: 2,
      centersWithTeacher: 0,
      enrolledStudents: 0,
      reports: { submitted: 0, needRevision: 0, approved: 0 },
      submittedByType: { enrollment: 0, accomplishment: 0 },
    });
  });

  it("is for the Admin only", async () => {
    for (const username of ["teacher.a", "parent.a"]) {
      const agent = await loginAs(app, username);
      expect((await agent.get(URL)).status).toBe(403);
    }
  });
});

describe("GET /api/reports status filter", () => {
  it("filters the queue, and a bad status is 400", async () => {
    await seedMenuDays(prisma, world.admin.id, [["2026-11-09", "PORK"]]);
    const teacher = await loginAs(app, "teacher.a");
    const pr = "/api/purchase-requests/2026-11-09";
    await teacher.post(`${pr}/open`);
    await teacher.post(`${pr}/lock`);
    await teacher
      .post("/api/liquidation/submit")
      .send({ from: "2026-11-09", to: "2026-11-09" });
    const admin = await loginAs(app, "admin.t");
    const count = async (status: string) =>
      (
        (await admin.get(`/api/reports?status=${status}`)).body as {
          meta: { total: number };
        }
      ).meta.total;
    expect(await count("SUBMITTED")).toBe(1);
    expect(await count("APPROVED")).toBe(0);
    expect((await admin.get("/api/reports?status=NOPE")).status).toBe(400);
  });

  it("a Teacher's filtered list stays their own", async () => {
    await seedMenuDays(prisma, world.admin.id, [["2026-11-09", "PORK"]]);
    const teacher = await loginAs(app, "teacher.a");
    const pr = "/api/purchase-requests/2026-11-09";
    await teacher.post(`${pr}/open`);
    await teacher.post(`${pr}/lock`);
    await teacher
      .post("/api/liquidation/submit")
      .send({ from: "2026-11-09", to: "2026-11-09" });
    const other = await loginAs(app, "teacher.b");
    const res = await other.get("/api/reports?status=SUBMITTED");
    expect((res.body as { meta: { total: number } }).meta.total).toBe(0);
  });
});
