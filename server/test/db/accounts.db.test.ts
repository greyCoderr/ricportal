import request from "supertest";
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
});

type Page<T> = { data: T[]; meta: { total: number } };

describe("centers (Admin)", () => {
  it("lists with search and pagination", async () => {
    const admin = await loginAs(app, "admin.t");
    const all = await admin.get("/api/centers?pageSize=1");
    expect(all.status).toBe(200);
    const body = all.body as Page<{ name: string }>;
    expect(body.data.length).toBe(1);
    expect(body.meta.total).toBe(2);

    const found = await admin.get("/api/centers?q=center b");
    expect(
      (found.body as Page<{ name: string }>).data.map((c) => c.name),
    ).toEqual(["Center B"]);
  });

  it("creates and renames; a duplicate name is 409", async () => {
    const admin = await loginAs(app, "admin.t");
    const created = await admin.post("/api/centers").send({ name: "Sibujo" });
    expect(created.status).toBe(201);
    const id = (created.body as { data: { id: number } }).data.id;

    const duplicate = await admin.post("/api/centers").send({ name: "Sibujo" });
    expect(duplicate.status).toBe(409);

    const renamed = await admin
      .patch(`/api/centers/${String(id)}`)
      .send({ name: "Sibujo 1" });
    expect(renamed.status).toBe(200);
    expect((renamed.body as { data: { name: string } }).data.name).toBe(
      "Sibujo 1",
    );

    const clash = await admin
      .patch(`/api/centers/${String(id)}`)
      .send({ name: "Center A" });
    expect(clash.status).toBe(409);
  });

  it("cannot deactivate while an active Teacher is assigned", async () => {
    const admin = await loginAs(app, "admin.t");
    const blocked = await admin
      .patch(`/api/centers/${String(world.centerA.id)}`)
      .send({ isActive: false });
    expect(blocked.status).toBe(422);

    await prisma.user.update({
      where: { id: world.teacherA.id },
      data: { status: "DISABLED" },
    });
    const allowed = await admin
      .patch(`/api/centers/${String(world.centerA.id)}`)
      .send({ isActive: false });
    expect(allowed.status).toBe(200);
  });
});

describe("teachers (Admin)", () => {
  async function freeCenter() {
    return createCenter(prisma, "Sibujo");
  }

  it("creates with a temporary password shown once; the Teacher must change it", async () => {
    const center = await freeCenter();
    const admin = await loginAs(app, "admin.t");
    const res = await admin.post("/api/teachers").send({
      fullName: "Ana Cruz",
      username: "Teacher.Sibujo",
      centerId: center.id,
    });
    expect(res.status).toBe(201);
    expectNoSecrets(res.body);
    const data = (
      res.body as {
        data: {
          username: string;
          centerName: string;
        };
      }
    ).data;
    expect(data.username).toBe("teacher.sibujo");
    expect(data.centerName).toBe("Sibujo");
    expect(JSON.stringify(res.body)).not.toContain(TEST_DEFAULT_PASSWORD);

    const list = await admin.get("/api/teachers");
    expect(JSON.stringify(list.body)).not.toContain(TEST_DEFAULT_PASSWORD);
    expectNoSecrets(list.body);

    const teacher = await loginAs(app, "teacher.sibujo", TEST_DEFAULT_PASSWORD);
    const me = await teacher.get("/api/auth/me");
    expect(
      (me.body as { data: { mustChangePassword: boolean } }).data
        .mustChangePassword,
    ).toBe(true);
  });

  it("BR-04: one active Teacher per center", async () => {
    const admin = await loginAs(app, "admin.t");
    const res = await admin.post("/api/teachers").send({
      fullName: "Second Teacher",
      username: "teacher.two",
      centerId: world.centerA.id,
    });
    expect(res.status).toBe(409);
  });

  it("rejects an inactive center and a duplicate username", async () => {
    const closed = await prisma.center.create({
      data: { name: "Closed", isActive: false },
    });
    const admin = await loginAs(app, "admin.t");
    const inactive = await admin.post("/api/teachers").send({
      fullName: "Ana Cruz",
      username: "teacher.c",
      centerId: closed.id,
    });
    expect(inactive.status).toBe(422);

    const center = await freeCenter();
    const duplicate = await admin.post("/api/teachers").send({
      fullName: "Ana Cruz",
      username: "teacher.a",
      centerId: center.id,
    });
    expect(duplicate.status).toBe(409);
  });

  it("edits, disables and re-enables; enabling respects BR-04", async () => {
    const admin = await loginAs(app, "admin.t");
    const path = `/api/teachers/${String(world.teacherA.id)}`;

    const edited = await admin.patch(path).send({ fullName: "New Name" });
    expect((edited.body as { data: { fullName: string } }).data.fullName).toBe(
      "New Name",
    );

    const disabled = await admin.patch(path).send({ status: "DISABLED" });
    expect((disabled.body as { data: { status: string } }).data.status).toBe(
      "DISABLED",
    );
    const blockedLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: "teacher.a", password: TEST_PASSWORD });
    expect(blockedLogin.status).toBe(403);

    await createUser(prisma, {
      username: "teacher.new",
      role: "TEACHER",
      centerId: world.centerA.id,
    });
    const clash = await admin.patch(path).send({ status: "ACTIVE" });
    expect(clash.status).toBe(409);

    const moveClash = await admin
      .patch(`/api/teachers/${String(world.teacherB.id)}`)
      .send({ centerId: world.centerA.id });
    expect(moveClash.status).toBe(409);
  });

  it("does not treat a Parent id as a Teacher", async () => {
    const admin = await loginAs(app, "admin.t");
    const res = await admin
      .patch(`/api/teachers/${String(world.parentA.id)}`)
      .send({ fullName: "Nope Name" });
    expect(res.status).toBe(404);
  });

  it("reset sets the default password and ends old sessions (D6)", async () => {
    const admin = await loginAs(app, "admin.t");
    const teacher = await loginAs(app, "teacher.a");
    const res = await admin.post(
      `/api/teachers/${String(world.teacherA.id)}/reset-password`,
    );
    expect(res.status).toBe(200);
    expectNoSecrets(res.body);

    expect((await teacher.get("/api/auth/me")).status).toBe(401);
    const again = await loginAs(app, "teacher.a", TEST_DEFAULT_PASSWORD);
    const me = await again.get("/api/auth/me");
    expect(
      (me.body as { data: { mustChangePassword: boolean } }).data
        .mustChangePassword,
    ).toBe(true);
  });
});

describe("parents (Teacher, own center)", () => {
  async function pendingInA(username = "parent.p") {
    return createUser(prisma, {
      username,
      role: "PARENT",
      centerId: world.centerA.id,
      status: "PENDING",
    });
  }

  it("lists by status, own center only", async () => {
    await pendingInA();
    const teacher = await loginAs(app, "teacher.a");
    const pending = await teacher.get("/api/parents?status=PENDING");
    const rows = (pending.body as Page<{ username: string }>).data;
    expect(rows.map((r) => r.username)).toEqual(["parent.p"]);
    expectNoSecrets(pending.body);

    const all = await teacher.get("/api/parents");
    const names = (all.body as Page<{ username: string }>).data.map(
      (r) => r.username,
    );
    expect(names).toContain("parent.a");
    expect(names).not.toContain("parent.b");
  });

  it("rejects an unknown status filter", async () => {
    const teacher = await loginAs(app, "teacher.a");
    expect((await teacher.get("/api/parents?status=NOPE")).status).toBe(400);
  });

  it("BR-03: approve lets the Parent log in; a repeat returns the current state", async () => {
    const parent = await pendingInA();
    const teacher = await loginAs(app, "teacher.a");
    const path = `/api/parents/${String(parent.id)}/approve`;

    const first = await teacher.post(path);
    expect(first.status).toBe(200);
    expect((first.body as { data: { status: string } }).data.status).toBe(
      "ACTIVE",
    );
    const second = await teacher.post(path);
    expect(second.status).toBe(200);

    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ username: "parent.p", password: TEST_PASSWORD })
      ).status,
    ).toBe(200);
  });

  it("status machine: decline, re-enable, disable, enable, and invalid moves", async () => {
    const parent = await pendingInA();
    const teacher = await loginAs(app, "teacher.a");
    const base = `/api/parents/${String(parent.id)}`;

    const declined = await teacher.post(`${base}/decline`);
    expect((declined.body as { data: { status: string } }).data.status).toBe(
      "DECLINED",
    );

    expect((await teacher.post(`${base}/disable`)).status).toBe(409);

    const enabled = await teacher.post(`${base}/enable`);
    expect((enabled.body as { data: { status: string } }).data.status).toBe(
      "ACTIVE",
    );

    expect((await teacher.post(`${base}/decline`)).status).toBe(409);

    const disabled = await teacher.post(`${base}/disable`);
    expect((disabled.body as { data: { status: string } }).data.status).toBe(
      "DISABLED",
    );
    expect((await teacher.post(`${base}/approve`)).status).toBe(409);
  });

  it("disabling ends the Parent's session", async () => {
    const parentAgent = await loginAs(app, "parent.a");
    const teacher = await loginAs(app, "teacher.a");
    await teacher.post(`/api/parents/${String(world.parentA.id)}/disable`);
    expect((await parentAgent.get("/api/auth/me")).status).toBe(401);
  });

  it("reset sets the default password (D6)", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.post(
      `/api/parents/${String(world.parentA.id)}/reset-password`,
    );
    expect(res.status).toBe(200);
    expectNoSecrets(res.body);
    await loginAs(app, "parent.a", TEST_DEFAULT_PASSWORD);
  });

  it("BR-02: a Teacher of center A gets 404 for a Parent of center B", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const id = String(world.parentB.id);
    for (const action of [
      "approve",
      "decline",
      "disable",
      "enable",
      "reset-password",
    ]) {
      const res = await teacher.post(`/api/parents/${id}/${action}`);
      expect(res.status, action).toBe(404);
    }
  });

  it("a Teacher moved to another center no longer sees old Parents", async () => {
    const admin = await loginAs(app, "admin.t");
    const free = await createCenter(prisma, "Sibujo");
    await admin
      .patch(`/api/teachers/${String(world.teacherA.id)}`)
      .send({ centerId: free.id });
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.post(
      `/api/parents/${String(world.parentA.id)}/disable`,
    );
    expect(res.status).toBe(404);
  });
});
