import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import request from "supertest";
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

// Round 3, H2 (D7): profile data, login events, activity counts and login history.

const NOW = new Date("2026-11-15T04:00:00Z");

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

type Profile = {
  fullName: string;
  username: string;
  email: string | null;
  address: string | null;
  sex: string | null;
  birthDate: string | null;
  passwordChangedAt: string | null;
  passwordChangedDaysAgo: number | null;
};

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma, { now: () => NOW });
  world = await seedWorld(prisma);
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
});

function profileOf(body: unknown): Profile {
  return (body as { data: Profile }).data;
}

function events(userId: number) {
  return prisma.loginEvent.findMany({ where: { userId } });
}

async function addReport(
  type: "LIQUIDATION" | "ENROLLMENT",
  centerId: number,
  teacherId: number,
) {
  await prisma.report.create({
    data: {
      centerId,
      teacherId,
      type,
      periodStart: new Date("2026-11-01T00:00:00Z"),
      periodEnd: new Date("2026-11-30T00:00:00Z"),
    },
  });
}

describe("the migration (D7)", () => {
  it("is additive and every new user column is nullable", () => {
    const dir = fileURLToPath(
      new URL("../../prisma/migrations", import.meta.url),
    );
    const folder = readdirSync(dir).find((name) =>
      name.endsWith("_polish3_login_events"),
    );
    expect(folder).toBeDefined();
    const sql = readFileSync(`${dir}/${String(folder)}/migration.sql`, "utf8");
    expect(sql).not.toMatch(/\bDROP\b|\bRENAME\b|\bMODIFY\b|\bCHANGE\b/i);
    expect(sql).toMatch(/ADD COLUMN `password_changed_at` DATETIME\(3\) NULL/);
    expect(sql).toMatch(/CREATE TABLE `login_events`/);
    expect(sql).toMatch(/`user_id`, `created_at`/);
  });
});

describe("PATCH /api/auth/profile, the D7 fields", () => {
  it("saves Date of Birth, Email, Gender and Address", async () => {
    const agent = await loginAs(app, "teacher.a");
    const res = await agent.patch("/api/auth/profile").send({
      fullName: "Ana Cruz",
      email: "  ana@example.com ",
      sex: "Female",
      birthDate: "1990-01-01",
      address: "  Libmanan ",
    });
    expect(res.status).toBe(200);
    const data = profileOf(res.body);
    expect(data.email).toBe("ana@example.com");
    expect(data.sex).toBe("Female");
    expect(data.birthDate).toBe("1990-01-01");
    expect(data.address).toBe("Libmanan");
    expectNoSecrets(res.body);
  });

  it.each([
    ["email", "not-an-email"],
    ["sex", "Other"],
    ["birthDate", "2026-02-30"],
    ["birthDate", "2027-01-01"],
    ["address", "x".repeat(256)],
  ])("refuses %s = %s", async (field, value) => {
    const agent = await loginAs(app, "teacher.a");
    const res = await agent
      .patch("/api/auth/profile")
      .send({ fullName: "Ana Cruz", [field]: value });
    expect(res.status).toBe(400);
  });

  it("changes only the caller, whatever id the body names", async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherB.id },
    });
    const agent = await loginAs(app, "teacher.a");
    const res = await agent.patch("/api/auth/profile").send({
      id: world.teacherB.id,
      userId: world.teacherB.id,
      fullName: "Changed Name",
      passwordChangedAt: "2020-01-01T00:00:00Z",
    });
    expect(res.status).toBe(200);
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherB.id },
    });
    expect(after.fullName).toBe(before.fullName);
    const own = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherA.id },
    });
    expect(own.fullName).toBe("Changed Name");
    expect(own.passwordChangedAt).toBe(null);
  });

  it("the email is never accepted as a login", async () => {
    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: { email: "ana@example.com" },
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "ana@example.com", password: TEST_PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe("password_changed_at (D7)", () => {
  it("is empty until the password changes", async () => {
    const agent = await loginAs(app, "teacher.a");
    const data = profileOf((await agent.get("/api/auth/profile")).body);
    expect(data.passwordChangedAt).toBe(null);
    expect(data.passwordChangedDaysAgo).toBe(null);
  });

  it("is set by a password change", async () => {
    const agent = await loginAs(app, "teacher.a");
    const res = await agent.post("/api/auth/change-password").send({
      currentPassword: TEST_PASSWORD,
      newPassword: "Fresh2026pw",
      confirmPassword: "Fresh2026pw",
    });
    expect(res.status).toBe(200);
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherA.id },
    });
    expect(row.passwordChangedAt?.toISOString()).toBe(NOW.toISOString());
  });

  it("stays as it was after a wrong current password", async () => {
    const agent = await loginAs(app, "teacher.a");
    await agent.post("/api/auth/change-password").send({
      currentPassword: "Wrong2026pw",
      newPassword: "Fresh2026pw",
      confirmPassword: "Fresh2026pw",
    });
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherA.id },
    });
    expect(row.passwordChangedAt).toBe(null);
  });

  it("is set when the Admin resets a Teacher's password", async () => {
    const admin = await loginAs(app, "admin.t");
    const res = await admin.post(
      `/api/teachers/${String(world.teacherA.id)}/reset-password`,
    );
    expect(res.status).toBe(200);
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherA.id },
    });
    expect(row.passwordChangedAt?.toISOString()).toBe(NOW.toISOString());
  });

  it("counts whole Manila calendar days", async () => {
    await prisma.user.update({
      where: { id: world.teacherA.id },
      // 11:59 pm on 11/14 in Manila, the day before NOW.
      data: { passwordChangedAt: new Date("2026-11-14T15:59:00Z") },
    });
    const agent = await loginAs(app, "teacher.a");
    const data = profileOf((await agent.get("/api/auth/profile")).body);
    expect(data.passwordChangedDaysAgo).toBe(1);
  });
});

describe("login_events (D7)", () => {
  it("records a successful login with its time", async () => {
    await loginAs(app, "teacher.a");
    const rows = await events(world.teacherA.id);
    expect(rows.map((row) => row.createdAt.toISOString())).toEqual([
      NOW.toISOString(),
    ]);
  });

  it("records nothing for a wrong password", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ username: "teacher.a", password: "Wrong2026pw" });
    expect(await events(world.teacherA.id)).toEqual([]);
  });

  it("records nothing for a right password on a disabled account", async () => {
    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: { status: "DISABLED" },
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "teacher.a", password: TEST_PASSWORD });
    expect(res.status).toBe(403);
    expect(await events(world.teacherA.id)).toEqual([]);
  });

  it("records nothing while the account is locked", async () => {
    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: { lockedUntil: new Date(NOW.getTime() + 60_000) },
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "teacher.a", password: TEST_PASSWORD });
    expect(res.status).toBe(429);
    expect(await events(world.teacherA.id)).toEqual([]);
  });
});

describe("GET /api/auth/profile/activity (D7)", () => {
  async function activity(username: string) {
    const agent = await loginAs(app, username);
    const res = await agent.get("/api/auth/profile/activity");
    expect(res.status).toBe(200);
    return (res.body as { data: Record<string, number | string> }).data;
  }

  it("Admin: all Teachers, students of the year, liquidation reports", async () => {
    await createUser(prisma, {
      username: "teacher.off",
      role: "TEACHER",
      status: "DISABLED",
      centerId: world.centerB.id,
    });
    await seedStudents(prisma, world.centerA.id, 2);
    await seedStudents(prisma, world.centerB.id, 1, { prefix: "Bee" });
    await seedStudents(prisma, world.centerA.id, 4, {
      status: "ARCHIVED",
      prefix: "Arch",
    });
    await addReport("LIQUIDATION", world.centerA.id, world.teacherA.id);
    await addReport("LIQUIDATION", world.centerB.id, world.teacherB.id);
    await addReport("ENROLLMENT", world.centerA.id, world.teacherA.id);

    const data = await activity("admin.t");
    expect(data).toEqual({
      role: "ADMIN",
      teachersManaged: await prisma.user.count({ where: { role: "TEACHER" } }),
      enrolledStudents: 3,
      reportsGenerated: 2,
      loginsThisMonth: 1,
    });
    expect(data.teachersManaged).toBe(3);
  });

  it("Teacher: only their own center", async () => {
    await seedStudents(prisma, world.centerA.id, 2);
    await seedStudents(prisma, world.centerB.id, 5, { prefix: "Bee" });
    await createUser(prisma, {
      username: "parent.wait",
      role: "PARENT",
      status: "PENDING",
      centerId: world.centerA.id,
    });
    await createUser(prisma, {
      username: "parent.far",
      role: "PARENT",
      centerId: world.centerB.id,
    });
    await addReport("LIQUIDATION", world.centerA.id, world.teacherA.id);
    await addReport("LIQUIDATION", world.centerB.id, world.teacherB.id);

    expect(await activity("teacher.a")).toEqual({
      role: "TEACHER",
      childrenEnrolled: 2,
      parentsApproved: await prisma.user.count({
        where: {
          role: "PARENT",
          status: "ACTIVE",
          centerId: world.centerA.id,
        },
      }),
      reportsSubmitted: 1,
      loginsThisMonth: 1,
    });
  });

  it("Parent: only their logins", async () => {
    await seedStudents(prisma, world.centerA.id, 2);
    expect(await activity("parent.a")).toEqual({
      role: "PARENT",
      loginsThisMonth: 1,
    });
  });

  it("counts the caller's logins in the Manila month", async () => {
    await prisma.loginEvent.createMany({
      data: [
        // 11/01 00:00 in Manila: inside.
        {
          userId: world.teacherA.id,
          createdAt: new Date("2026-10-31T16:00:00Z"),
        },
        // 10/31 23:59 in Manila: outside.
        {
          userId: world.teacherA.id,
          createdAt: new Date("2026-10-31T15:59:00Z"),
        },
        // Another user's login: outside.
        { userId: world.teacherB.id, createdAt: NOW },
      ],
    });
    expect((await activity("teacher.a")).loginsThisMonth).toBe(2);
  });
});

describe("GET /api/auth/logins (D7)", () => {
  it("gives the caller's last 10, newest first", async () => {
    const base = new Date("2026-11-01T00:00:00Z").getTime();
    await prisma.loginEvent.createMany({
      data: Array.from({ length: 12 }, (_, index) => ({
        userId: world.teacherA.id,
        createdAt: new Date(base + index * 3_600_000),
      })),
    });
    await prisma.loginEvent.create({
      data: { userId: world.teacherB.id, createdAt: NOW },
    });
    const agent = await loginAs(app, "teacher.a");
    const res = await agent.get("/api/auth/logins");
    expect(res.status).toBe(200);
    const { data } = res.body as { data: { at: string }[] };
    expect(data).toHaveLength(10);
    // The login above is the newest, then the 9 latest inserted.
    expect(data[0]?.at).toBe(NOW.toISOString());
    expect(data[1]?.at).toBe(new Date(base + 11 * 3_600_000).toISOString());
    expect(data[9]?.at).toBe(new Date(base + 3 * 3_600_000).toISOString());
    expectNoSecrets(res.body);
  });
});

describe("a forced password change", () => {
  it.each(["/api/auth/profile/activity", "/api/auth/logins"])(
    "blocks %s",
    async (url) => {
      await createUser(prisma, {
        username: "teacher.new",
        role: "TEACHER",
        centerId: world.centerB.id,
        mustChangePassword: true,
      });
      const agent = await loginAs(app, "teacher.new");
      expect((await agent.get(url)).status).toBe(403);
    },
  );
});

describe("the Admin's View Profile (D7)", () => {
  it("includes Date Approved and Last Login", async () => {
    await loginAs(app, "teacher.a");
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: world.teacherA.id },
    });
    const admin = await loginAs(app, "admin.t");
    const res = await admin.get(`/api/teachers/${String(world.teacherA.id)}`);
    expect(res.status).toBe(200);
    const { data } = res.body as {
      data: { createdAt: string; lastLoginAt: string | null };
    };
    expect(data.createdAt).toBe(row.createdAt.toISOString());
    expect(data.lastLoginAt).toBe(NOW.toISOString());
  });
});
