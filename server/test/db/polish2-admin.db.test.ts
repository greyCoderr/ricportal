import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createUser,
  expectNoSecrets,
  loginAs,
  seedStudents,
  seedWorld,
  TEST_PASSWORD,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";
import { TEST_DEFAULT_PASSWORD } from "../test-config.js";

// Round 2, G2: the six dashboard cards (D6), the teacher status toggle and View
// Profile (D8), and the new profile columns (D9).

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

type Summary = {
  activeTeachers: number;
  enrolledStudents: number;
  reports: { submitted: number; needRevision: number; approved: number };
  submittedByType: { enrollment: number; accomplishment: number };
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

async function addReport(
  type: "LIQUIDATION" | "ENROLLMENT" | "ACCOMPLISHMENT",
  status: "SUBMITTED" | "NEED_REVISION" | "APPROVED",
) {
  await prisma.report.create({
    data: {
      centerId: world.centerA.id,
      teacherId: world.teacherA.id,
      type,
      status,
      periodStart: new Date("2026-11-01T00:00:00Z"),
      periodEnd: new Date("2026-11-30T00:00:00Z"),
    },
  });
}

async function summary(): Promise<Summary> {
  const admin = await loginAs(app, "admin.t");
  const res = await admin.get("/api/dashboard/summary");
  expect(res.status).toBe(200);
  return (res.body as { data: Summary }).data;
}

describe("the six dashboard cards (D6)", () => {
  it("counts submitted reports in all, and again by their type", async () => {
    await addReport("LIQUIDATION", "SUBMITTED");
    await addReport("ENROLLMENT", "SUBMITTED");
    await addReport("ENROLLMENT", "SUBMITTED");
    await addReport("ACCOMPLISHMENT", "SUBMITTED");
    const data = await summary();
    expect(data.reports.submitted).toBe(4);
    expect(data.submittedByType).toEqual({ enrollment: 2, accomplishment: 1 });
  });

  it("a report for revision counts only in REPORT FOR REVISION", async () => {
    await addReport("ENROLLMENT", "NEED_REVISION");
    await addReport("ACCOMPLISHMENT", "NEED_REVISION");
    const data = await summary();
    expect(data.reports.needRevision).toBe(2);
    expect(data.reports.submitted).toBe(0);
    expect(data.submittedByType).toEqual({ enrollment: 0, accomplishment: 0 });
  });

  it("an approved report counts on none of the report cards", async () => {
    await addReport("LIQUIDATION", "APPROVED");
    await addReport("ENROLLMENT", "APPROVED");
    await addReport("ACCOMPLISHMENT", "APPROVED");
    const data = await summary();
    expect(data.reports.submitted).toBe(0);
    expect(data.reports.needRevision).toBe(0);
    expect(data.submittedByType).toEqual({ enrollment: 0, accomplishment: 0 });
  });

  it("disabled Teachers and archived students stay out, checked against the database", async () => {
    await createUser(prisma, {
      username: "teacher.off",
      role: "TEACHER",
      status: "DISABLED",
      centerId: world.centerB.id,
    });
    await seedStudents(prisma, world.centerA.id, 3);
    await seedStudents(prisma, world.centerA.id, 2, {
      status: "ARCHIVED",
      prefix: "Arch",
    });
    const data = await summary();
    expect(data.activeTeachers).toBe(
      await prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    );
    expect(data.activeTeachers).toBe(2);
    expect(data.enrolledStudents).toBe(3);
  });
});

describe("GET /api/teachers/:id (D8, View Profile)", () => {
  const url = () => `/api/teachers/${String(world.teacherA.id)}`;

  it("gives the Admin the whole profile with no secrets", async () => {
    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: {
        address: "Purok 2, Sibujo",
        email: "ana@example.com",
        position: "RIC Teacher II",
        sex: "Female",
        birthDate: new Date("1990-03-14T00:00:00Z"),
        qualification: "BEEd",
      },
    });
    const admin = await loginAs(app, "admin.t");
    const res = await admin.get(url());
    expect(res.status).toBe(200);
    const { data } = res.body as { data: Record<string, unknown> };
    expect(data).toMatchObject({
      id: world.teacherA.id,
      address: "Purok 2, Sibujo",
      email: "ana@example.com",
      position: "RIC Teacher II",
      sex: "Female",
      birthDate: "1990-03-14",
      qualification: "BEEd",
    });
    expect(typeof data.createdAt).toBe("string");
    expectNoSecrets(res.body);
  });

  it("is for the Admin only", async () => {
    for (const username of ["teacher.a", "teacher.b", "parent.a"]) {
      const agent = await loginAs(app, username);
      expect((await agent.get(url())).status).toBe(403);
    }
  });

  it("needs a login", async () => {
    const { default: request } = await import("supertest");
    expect((await request(app).get(url())).status).toBe(401);
  });

  it("answers 404 for an unknown id and for someone who is not a Teacher", async () => {
    const admin = await loginAs(app, "admin.t");
    expect((await admin.get("/api/teachers/999999")).status).toBe(404);
    const parent = await prisma.user.findFirstOrThrow({
      where: { role: "PARENT" },
    });
    expect((await admin.get(`/api/teachers/${String(parent.id)}`)).status).toBe(
      404,
    );
  });

  it("answers 400 for a bad id", async () => {
    const admin = await loginAs(app, "admin.t");
    expect((await admin.get("/api/teachers/abc")).status).toBe(400);
  });
});

describe("the status toggle and the reset go only through the Admin (D8)", () => {
  const url = () => `/api/teachers/${String(world.teacherA.id)}`;

  it("disable stops the login, and enable brings it back", async () => {
    const admin = await loginAs(app, "admin.t");
    const off = await admin.patch(url()).send({ status: "DISABLED" });
    expect(off.status).toBe(200);
    expect((off.body as { data: { status: string } }).data.status).toBe(
      "DISABLED",
    );
    await expect(loginAs(app, "teacher.a")).rejects.toThrow();

    const on = await admin.patch(url()).send({ status: "ACTIVE" });
    expect((on.body as { data: { status: string } }).data.status).toBe(
      "ACTIVE",
    );
    await expect(loginAs(app, "teacher.a")).resolves.toBeDefined();
  });

  it("enabling is refused while the center has another active Teacher", async () => {
    const admin = await loginAs(app, "admin.t");
    await admin.patch(url()).send({ status: "DISABLED" });
    await createUser(prisma, {
      username: "teacher.new",
      role: "TEACHER",
      centerId: world.centerA.id,
    });
    expect((await admin.patch(url()).send({ status: "ACTIVE" })).status).toBe(
      409,
    );
  });

  it("no Teacher or Parent can toggle or reset, and nothing changes", async () => {
    for (const username of ["teacher.b", "parent.a"]) {
      const agent = await loginAs(app, username);
      expect(
        (await agent.patch(url()).send({ status: "DISABLED" })).status,
      ).toBe(403);
      expect((await agent.post(`${url()}/reset-password`)).status).toBe(403);
    }
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherA.id },
    });
    expect(row.status).toBe("ACTIVE");
    expect(row.mustChangePassword).toBe(false);
  });

  it("the Admin's reset sets the default and forces a change", async () => {
    const admin = await loginAs(app, "admin.t");
    expect((await admin.post(`${url()}/reset-password`)).status).toBe(200);
    await expect(loginAs(app, "teacher.a", TEST_PASSWORD)).rejects.toThrow();
    const again = await loginAs(app, "teacher.a", TEST_DEFAULT_PASSWORD);
    const me = (await again.get("/api/auth/me")).body as {
      data: { mustChangePassword: boolean };
    };
    expect(me.data.mustChangePassword).toBe(true);
  });
});

describe("the profile columns (D9)", () => {
  const PROFILE = "/api/auth/profile";
  const base = { fullName: "Ana Cruz", mobile: "09171234567" };

  it("a user saves their own contact and profile data", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.patch(PROFILE).send({
      ...base,
      email: "ana@example.com",
      address: "Purok 2, Sibujo",
      position: "RIC Teacher II",
      sex: "Female",
      birthDate: "1990-03-14",
      qualification: "BEEd",
    });
    expect(res.status).toBe(200);
    expect((res.body as { data: unknown }).data).toMatchObject({
      email: "ana@example.com",
      address: "Purok 2, Sibujo",
      position: "RIC Teacher II",
      sex: "Female",
      birthDate: "1990-03-14",
      qualification: "BEEd",
    });
    expectNoSecrets(res.body);
  });

  it("gives the dates and the display fields of the frame", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.get(PROFILE);
    const { data } = res.body as {
      data: { createdAt: string; lastLoginAt: string | null };
    };
    expect(typeof data.createdAt).toBe("string");
    expect(typeof data.lastLoginAt).toBe("string");
  });

  it("leaving a field out keeps it, and a blank clears it", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await teacher.patch(PROFILE).send({ ...base, address: "Purok 2" });
    const kept = await teacher.patch(PROFILE).send(base);
    expect((kept.body as { data: { address: string } }).data.address).toBe(
      "Purok 2",
    );
    const cleared = await teacher.patch(PROFILE).send({ ...base, address: "" });
    expect(
      (cleared.body as { data: { address: string | null } }).data.address,
    ).toBe(null);
  });

  it.each([
    ["email", "not-an-email"],
    ["address", "x".repeat(256)],
    ["position", "x".repeat(121)],
    ["qualification", "x".repeat(161)],
    ["sex", "Other value"],
    ["birthDate", "03/14/1990"],
    ["birthDate", "2026-02-30"],
  ])("refuses a bad %s", async (field, value) => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.patch(PROFILE).send({ ...base, [field]: value });
    expect(res.status).toBe(400);
  });

  it("a birth date in the future is refused", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher
      .patch(PROFILE)
      .send({ ...base, birthDate: "2027-01-01" });
    expect(res.status).toBe(400);
  });

  it("changes only the user's own row", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await teacher.patch(PROFILE).send({ ...base, address: "Purok 2" });
    const other = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherB.id },
    });
    expect(other.address).toBe(null);
  });
});
