import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedDemo } from "../../prisma/demo-seed.js";
import { seedBase } from "../../prisma/seed-base.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs } from "./api-harness.js";
import { TEST_DEFAULT_PASSWORD } from "../test-config.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

const NOW = new Date("2026-11-10T02:00:00Z");
const OPTIONS = { now: NOW, bcryptCost: 4 };

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;

async function counts() {
  return {
    teachers: await prisma.user.count({ where: { role: "TEACHER" } }),
    parents: await prisma.user.count({ where: { role: "PARENT" } }),
    students: await prisma.student.count(),
    menuDays: await prisma.menuDay.count(),
    assignments: await prisma.feedingAssignment.count(),
    purchaseRequests: await prisma.purchaseRequest.count(),
    items: await prisma.purchaseItem.count(),
    locked: await prisma.purchaseRequest.count({ where: { status: "LOCKED" } }),
  };
}

beforeAll(async () => {
  prisma = createTestPrisma();
  await resetDatabase(prisma);
  await seedBase(prisma, {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "Admin2026!",
    BCRYPT_COST: 4,
  });
  app = buildApp(prisma, { now: () => NOW });
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("seedDemo", () => {
  it("creates the demo state: accounts, 18 children, the menu, a locked day", async () => {
    await seedDemo(prisma, OPTIONS);
    const state = await counts();
    expect(state.teachers).toBe(1);
    expect(state.parents).toBe(4);
    expect(state.students).toBe(18);
    expect(state.menuDays).toBe(84);
    expect(state.assignments).toBeGreaterThan(0);
    expect(state.purchaseRequests).toBeGreaterThanOrEqual(3);
    expect(state.locked).toBe(1);

    const teacher = await loginAs(app, "teacher.sibujo", "Demo2026!");
    expect((await teacher.get("/api/students")).status).toBe(200);
    const parent = await loginAs(app, "parent1", "Demo2026!");
    const schedule = await parent.get(
      "/api/parent-schedule?from=2026-11-09&to=2026-11-15",
    );
    expect((schedule.body as { data: unknown[] }).data.length).toBeGreaterThan(
      0,
    );
  });

  it("each week has a team of 4, and each feeding day 2 of them (D4)", async () => {
    const teacher = await loginAs(app, "teacher.sibujo", "Demo2026!");
    const res = await teacher.get("/api/assignments/week?week=2026-11-09");
    const { team, days } = (
      res.body as {
        data: {
          team: { username: string }[];
          days: { menuName: string | null; parents: unknown[] }[];
        };
      }
    ).data;
    expect(team.map((row) => row.username).sort()).toEqual([
      "parent1",
      "parent2",
      "parent3",
      "parent4",
    ]);
    const feeding = days.filter((day) => day.menuName !== null);
    expect(feeding.length).toBeGreaterThan(0);
    for (const day of feeding) {
      expect(day.parents).toHaveLength(2);
    }
  });

  it("the partly filled day has rows by the Teacher and by a Parent (D3)", async () => {
    const rows = await prisma.purchaseItem.findMany({
      where: {
        purchaseRequest: { feedingDate: new Date("2026-11-10T00:00:00Z") },
      },
    });
    const teacher = await prisma.user.findUniqueOrThrow({
      where: { username: "teacher.sibujo" },
    });
    const parent2 = await prisma.user.findUniqueOrThrow({
      where: { username: "parent2" },
    });
    const creators = new Set(rows.map((row) => row.createdBy));
    expect(creators).toEqual(new Set([teacher.id, parent2.id]));
  });

  it("the partly filled day has rows with and without costs", async () => {
    const teacher = await loginAs(app, "teacher.sibujo", "Demo2026!");
    const day = await teacher.get("/api/purchase-requests/2026-11-10");
    const items = (
      day.body as {
        data: { status: string; items: { unitCost: string | null }[] };
      }
    ).data;
    expect(items.status).toBe("OPEN");
    expect(items.items.some((item) => item.unitCost !== null)).toBe(true);
    expect(items.items.some((item) => item.unitCost === null)).toBe(true);
  });

  it("re-running restores the state and unlocks the demo accounts", async () => {
    const before = await counts();

    // Things a rehearsal leaves behind.
    const teacher = await loginAs(app, "teacher.sibujo", "Demo2026!");
    await teacher.post("/api/students").send({
      lastName: "Rehearsal",
      firstName: "Child",
      gender: "M",
      birthdate: "2023-01-15",
      weightKg: "14.00",
      heightCm: "95.0",
      parentGuardianName: "Someone Else",
    });
    const sibujo = await prisma.center.findUniqueOrThrow({
      where: { name: "Sibujo" },
    });
    await request(app).post("/api/auth/parent-signup").send({
      fullName: "Rehearsal Parent",
      username: "rehearsal.parent",
      mobile: "09171234567",
      centerId: sibujo.id,
      password: "Parent2026pw",
      confirmPassword: "Parent2026pw",
    });
    for (let i = 0; i < 6; i += 1) {
      await request(app)
        .post("/api/auth/login")
        .send({ username: "parent2", password: "Wrong2026pw" });
    }
    await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "Wrong2026pw" });
    await teacher.post("/api/purchase-requests/2026-11-09/unlock");

    await seedDemo(prisma, OPTIONS);

    expect(await counts()).toEqual(before);
    await loginAs(app, "parent2", "Demo2026!");
    const admin = await prisma.user.findUniqueOrThrow({
      where: { username: "admin" },
    });
    expect(admin.failedLoginCount).toBe(0);
    expect(admin.lockedUntil).toBe(null);
    expect(
      await prisma.user.findUnique({ where: { username: "rehearsal.parent" } }),
    ).toBe(null);
  });

  it("re-seeding works after a whole rehearsal of the click path", async () => {
    const before = await counts();
    const teacher = await loginAs(app, "teacher.sibujo", "Demo2026!");
    const admin = await loginAs(app, "admin", "Admin2026!");
    const sibujo = await prisma.center.findUniqueOrThrow({
      where: { name: "Sibujo" },
    });
    const bahay = await prisma.center.findUniqueOrThrow({
      where: { name: "Bahay" },
    });

    // The Admin adds a teacher, who changes the default password.
    const added = await admin.post("/api/teachers").send({
      fullName: "Liza Ramos",
      username: "teacher.bahay",
      centerId: bahay.id,
    });
    expect(added.status).toBe(201);
    const bahayTeacher = await loginAs(
      app,
      "teacher.bahay",
      TEST_DEFAULT_PASSWORD,
    );
    expect(
      (
        await bahayTeacher.post("/api/auth/change-password").send({
          currentPassword: TEST_DEFAULT_PASSWORD,
          newPassword: "Bahay2026pw",
          confirmPassword: "Bahay2026pw",
        })
      ).status,
    ).toBe(200);

    // A new parent joins the week's team and adds a row.
    await request(app).post("/api/auth/parent-signup").send({
      fullName: "Rehearsal Parent",
      username: "rehearsal.parent",
      mobile: "09171234567",
      centerId: sibujo.id,
      password: "Parent2026pw",
      confirmPassword: "Parent2026pw",
    });
    const joined = await prisma.user.findUniqueOrThrow({
      where: { username: "rehearsal.parent" },
    });
    expect(
      (await teacher.post(`/api/parents/${String(joined.id)}/approve`)).status,
    ).toBe(200);
    expect(
      (
        await teacher.put("/api/assignments/week").send({
          week: "2026-11-09",
          teamParentIds: [joined.id],
          days: [{ date: "2026-11-10", parentIds: [joined.id] }],
        })
      ).status,
    ).toBe(200);
    const parent = await loginAs(app, "rehearsal.parent", "Parent2026pw");
    expect(
      (
        await parent
          .post("/api/purchase-requests/2026-11-10/items")
          .send({ description: "Calamansi" })
      ).status,
    ).toBe(201);

    // The whole report cycle: submit, send back, resubmit, approve.
    const range = { from: "2026-11-09", to: "2026-11-09" };
    const submitted = await teacher.post("/api/liquidation/submit").send(range);
    expect(submitted.status).toBe(201);
    const id = (submitted.body as { data: { id: number } }).data.id;
    expect(
      (
        await admin.post(`/api/reports/${String(id)}/review`).send({
          decision: "NEED_REVISION",
          feedback: "Please check the rice.",
        })
      ).status,
    ).toBe(200);
    expect(
      (await teacher.post("/api/purchase-requests/2026-11-09/lock")).status,
    ).toBe(200);
    expect(
      (await teacher.post("/api/liquidation/submit").send(range)).status,
    ).toBe(201);
    expect(
      (
        await admin
          .post(`/api/reports/${String(id)}/review`)
          .send({ decision: "APPROVED" })
      ).status,
    ).toBe(200);

    await seedDemo(prisma, OPTIONS);

    expect(await counts()).toEqual(before);
    expect(await prisma.report.count()).toBe(0);
    expect(await prisma.reportReview.count()).toBe(0);
    expect(await prisma.liquidationSnapshot.count()).toBe(0);
    for (const username of ["teacher.bahay", "rehearsal.parent"]) {
      expect(await prisma.user.findUnique({ where: { username } })).toBe(null);
    }
    // Every demo account works again, and the locked day is locked again.
    for (const username of ["teacher.sibujo", "parent1", "parent4"]) {
      await loginAs(app, username, "Demo2026!");
    }
    const fresh = await loginAs(app, "teacher.sibujo", "Demo2026!");
    const day = await fresh.get("/api/purchase-requests/2026-11-09");
    expect((day.body as { data: { status: string } }).data.status).toBe(
      "LOCKED",
    );
  });

  it("a submitted report from a rehearsal is cleared too", async () => {
    const teacher = await loginAs(app, "teacher.sibujo", "Demo2026!");
    const range = { from: "2026-11-09", to: "2026-11-09" };
    expect(
      (await teacher.post("/api/liquidation/submit").send(range)).status,
    ).toBe(201);
    expect(await prisma.report.count()).toBe(1);

    await seedDemo(prisma, OPTIONS);

    expect(await prisma.report.count()).toBe(0);
    expect(await prisma.liquidationSnapshot.count()).toBe(0);
  });
});
