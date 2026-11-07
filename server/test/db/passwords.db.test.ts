import { Writable } from "node:stream";
import { pino } from "pino";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createCenter,
  createUser,
  expectNoSecrets,
  loginAs,
  seedWorld,
  TEST_PASSWORD,
} from "./api-harness.js";
import { TEST_DEFAULT_PASSWORD } from "../test-config.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
let logged: string[];

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  logged = [];
  const sink = new Writable({
    write(chunk: Buffer, _encoding, done) {
      logged.push(chunk.toString());
      done();
    },
  });
  app = buildApp(prisma, { logger: pino({ level: "trace" }, sink) });
  world = await seedWorld(prisma);
});

type Me = { data: { mustChangePassword: boolean } };

function expectNoPasswordAnywhere(body: unknown) {
  const text = JSON.stringify(body);
  expect(text).not.toContain(TEST_DEFAULT_PASSWORD);
  expect(text).not.toContain("temporaryPassword");
  expectNoSecrets(body);
  expect(logged.join("")).not.toContain(TEST_DEFAULT_PASSWORD);
}

describe("reset to the default password (D6)", () => {
  it("Admin resets a Teacher: default works, old one does not, change is forced", async () => {
    const admin = await loginAs(app, "admin.t");
    const session = await loginAs(app, "teacher.a");
    const res = await admin.post(
      `/api/teachers/${String(world.teacherA.id)}/reset-password`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "data.message",
      "The password was reset to the default.",
    );
    expectNoPasswordAnywhere(res.body);

    expect((await session.get("/api/auth/me")).status).toBe(401);
    await expect(loginAs(app, "teacher.a", TEST_PASSWORD)).rejects.toThrow();
    const again = await loginAs(app, "teacher.a", TEST_DEFAULT_PASSWORD);
    const me = (await again.get("/api/auth/me")).body as Me;
    expect(me.data.mustChangePassword).toBe(true);
    expect((await again.get("/api/students")).status).toBe(403);
  });

  it("Teacher resets a Parent of the center: same rules", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.post(
      `/api/parents/${String(world.parentA.id)}/reset-password`,
    );
    expect(res.status).toBe(200);
    expectNoPasswordAnywhere(res.body);
    const again = await loginAs(app, "parent.a", TEST_DEFAULT_PASSWORD);
    const me = (await again.get("/api/auth/me")).body as Me;
    expect(me.data.mustChangePassword).toBe(true);
  });

  it("after the forced change the default no longer works", async () => {
    const admin = await loginAs(app, "admin.t");
    await admin.post(
      `/api/teachers/${String(world.teacherA.id)}/reset-password`,
    );
    const again = await loginAs(app, "teacher.a", TEST_DEFAULT_PASSWORD);
    const changed = await again.post("/api/auth/change-password").send({
      currentPassword: TEST_DEFAULT_PASSWORD,
      newPassword: "Fresh2026pw",
      confirmPassword: "Fresh2026pw",
    });
    expect(changed.status).toBe(200);
    await expect(
      loginAs(app, "teacher.a", TEST_DEFAULT_PASSWORD),
    ).rejects.toThrow();
    await loginAs(app, "teacher.a", "Fresh2026pw");
  });

  it("a reset clears a lockout", async () => {
    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: {
        failedLoginCount: 5,
        lockedUntil: new Date(Date.now() + 60_000),
      },
    });
    const admin = await loginAs(app, "admin.t");
    await admin.post(
      `/api/teachers/${String(world.teacherA.id)}/reset-password`,
    );
    await loginAs(app, "teacher.a", TEST_DEFAULT_PASSWORD);
  });
});

describe("who may reset whom (D6)", () => {
  it("the Admin resets only Teachers", async () => {
    const admin = await loginAs(app, "admin.t");
    expect(
      (
        await admin.post(
          `/api/teachers/${String(world.parentA.id)}/reset-password`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await admin.post(
          `/api/teachers/${String(world.admin.id)}/reset-password`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await admin.post(
          `/api/parents/${String(world.parentA.id)}/reset-password`,
        )
      ).status,
    ).toBe(403);
    await loginAs(app, "parent.a");
  });

  it("a Teacher resets only Parents of their own center", async () => {
    const teacher = await loginAs(app, "teacher.a");
    expect(
      (
        await teacher.post(
          `/api/parents/${String(world.parentB.id)}/reset-password`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await teacher.post(
          `/api/parents/${String(world.teacherB.id)}/reset-password`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await teacher.post(
          `/api/teachers/${String(world.teacherB.id)}/reset-password`,
        )
      ).status,
    ).toBe(403);
    await loginAs(app, "parent.b");
    await loginAs(app, "teacher.b");
  });

  it("a Parent resets nobody", async () => {
    const parent = await loginAs(app, "parent.a");
    expect(
      (
        await parent.post(
          `/api/parents/${String(world.parentA.id)}/reset-password`,
        )
      ).status,
    ).toBe(403);
  });
});

describe("creating an account (D6)", () => {
  async function create(extra: object) {
    const center = await createCenter(prisma, "Sibujo");
    const admin = await loginAs(app, "admin.t");
    return admin.post("/api/teachers").send({
      fullName: "Ana Cruz",
      username: "teacher.sibujo",
      centerId: center.id,
      ...extra,
    });
  }

  it("no password means the default, and a change is forced", async () => {
    const res = await create({});
    expect(res.status).toBe(201);
    expectNoPasswordAnywhere(res.body);
    const teacher = await loginAs(app, "teacher.sibujo", TEST_DEFAULT_PASSWORD);
    const me = (await teacher.get("/api/auth/me")).body as Me;
    expect(me.data.mustChangePassword).toBe(true);
  });

  it("a blank password means the default", async () => {
    const res = await create({ password: "" });
    expect(res.status).toBe(201);
    await loginAs(app, "teacher.sibujo", TEST_DEFAULT_PASSWORD);
  });

  it("a password that is given is used, is never returned, and must be changed", async () => {
    const res = await create({ password: "Chosen2026pw" });
    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain("Chosen2026pw");
    expect(logged.join("")).not.toContain("Chosen2026pw");
    await expect(
      loginAs(app, "teacher.sibujo", TEST_DEFAULT_PASSWORD),
    ).rejects.toThrow();
    const teacher = await loginAs(app, "teacher.sibujo", "Chosen2026pw");
    const me = (await teacher.get("/api/auth/me")).body as Me;
    expect(me.data.mustChangePassword).toBe(true);
  });

  it("a weak password is refused", async () => {
    const res = await create({ password: "short" });
    expect(res.status).toBe(400);
    expect(
      await prisma.user.count({ where: { username: "teacher.sibujo" } }),
    ).toBe(0);
  });

  it("the password never shows in a later list", async () => {
    await create({});
    const admin = await loginAs(app, "admin.t");
    expectNoPasswordAnywhere((await admin.get("/api/teachers")).body);
  });
});

describe("GET /api/teachers filters", () => {
  type Row = { username: string; status: string; centerId: number };
  async function list(query: string) {
    const admin = await loginAs(app, "admin.t");
    const res = await admin.get(`/api/teachers?${query}`);
    expect(res.status).toBe(200);
    return res.body as { data: Row[]; meta: { total: number } };
  }

  it("searches by name or username", async () => {
    const byUsername = await list("q=teacher.a");
    expect(byUsername.data.map((row) => row.username)).toEqual(["teacher.a"]);
    expect(byUsername.meta.total).toBe(1);
    const byName = await list("q=TEACHER.B%20Test");
    expect(byName.data.map((row) => row.username)).toEqual(["teacher.b"]);
  });

  it("filters by status and center", async () => {
    await prisma.user.update({
      where: { id: world.teacherB.id },
      data: { status: "DISABLED" },
    });
    expect((await list("status=DISABLED")).data.map((r) => r.username)).toEqual(
      ["teacher.b"],
    );
    expect(
      (await list(`centerId=${String(world.centerA.id)}`)).data.map(
        (r) => r.username,
      ),
    ).toEqual(["teacher.a"]);
  });

  it("refuses a bad filter", async () => {
    const admin = await loginAs(app, "admin.t");
    expect((await admin.get("/api/teachers?status=NOPE")).status).toBe(400);
  });

  it("never lists anyone but Teachers", async () => {
    await createUser(prisma, {
      username: "teacher.like.parent",
      role: "PARENT",
      centerId: world.centerA.id,
    });
    expect((await list("q=teacher.like")).data).toEqual([]);
  });
});
