import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
type Agent = Awaited<ReturnType<typeof loginAs>>;
let teacher: Agent;

const CHILD = {
  lastName: "Dela Cruz",
  firstName: "Maria",
  gender: "F",
  birthdate: "2024-02-29",
  weightKg: "14.50",
  heightCm: "96.5",
  parentGuardianName: "Rosa Dela Cruz",
};
const EXTRA = {
  nickname: "Nene",
  birthPlace: "Libmanan",
  familyMembers: [{ fullName: "Rosa Dela Cruz", relationship: "Mother" }],
};
type Body = {
  data: { id: number; profileExtra: Record<string, unknown> | null };
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
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
  teacher = await loginAs(app, "teacher.a");
});

async function add(extra: object = EXTRA) {
  const res = await teacher
    .post("/api/students")
    .send({ ...CHILD, profileExtra: extra });
  expect(res.status).toBe(201);
  return (res.body as Body).data;
}

describe("profile_extra through the API (D9)", () => {
  it("saves and reads back the extra fields", async () => {
    const created = await add();
    expect(created.profileExtra).toEqual(EXTRA);
    const read = await teacher.get(`/api/students/${String(created.id)}`);
    expect((read.body as Body).data.profileExtra).toEqual(EXTRA);
  });

  it("stores JSON text in the column", async () => {
    const created = await add();
    const row = await prisma.student.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(typeof row.profileExtra).toBe("string");
    expect(JSON.parse(row.profileExtra ?? "")).toEqual(EXTRA);
  });

  it("a student without it reads as null", async () => {
    const res = await teacher.post("/api/students").send(CHILD);
    expect(res.status).toBe(201);
    expect((res.body as Body).data.profileExtra).toBe(null);
  });

  it("a PATCH without it keeps it; with it replaces it", async () => {
    const created = await add();
    const keep = await teacher
      .patch(`/api/students/${String(created.id)}`)
      .send({ firstName: "Mariel" });
    expect(keep.status).toBe(200);
    expect((keep.body as Body).data.profileExtra).toEqual(EXTRA);

    const change = await teacher
      .patch(`/api/students/${String(created.id)}`)
      .send({ profileExtra: { nickname: "Bing" } });
    expect((change.body as Body).data.profileExtra).toEqual({
      nickname: "Bing",
    });
  });

  it("refuses bad data with 400 and stores nothing", async () => {
    for (const profileExtra of [
      { nickname: 5 },
      { surprise: "x" },
      { familyMembers: Array.from({ length: 6 }, () => ({})) },
      "text",
    ]) {
      const res = await teacher
        .post("/api/students")
        .send({ ...CHILD, profileExtra });
      expect(res.status, JSON.stringify(profileExtra)).toBe(400);
    }
    expect(await prisma.student.count()).toBe(0);
  });

  it("damaged text in the column reads as null, not an error", async () => {
    const created = await add();
    await prisma.student.update({
      where: { id: created.id },
      data: { profileExtra: "{not json" },
    });
    const read = await teacher.get(`/api/students/${String(created.id)}`);
    expect(read.status).toBe(200);
    expect((read.body as Body).data.profileExtra).toBe(null);
  });
});

describe("scoping is unchanged", () => {
  it("another center's Teacher gets 404 and cannot change it", async () => {
    const created = await add();
    const other = await loginAs(app, "teacher.b");
    const url = `/api/students/${String(created.id)}`;
    expect((await other.get(url)).status).toBe(404);
    expect(
      (await other.patch(url).send({ profileExtra: { nickname: "X" } })).status,
    ).toBe(404);
  });

  it("the Admin reads it for a center but cannot write", async () => {
    const created = await add();
    const admin = await loginAs(app, "admin.t");
    const url = `/api/students/${String(created.id)}`;
    const read = await admin.get(url);
    expect(read.status).toBe(200);
    expect((read.body as Body).data.profileExtra).toEqual(EXTRA);
    expect((await admin.patch(url).send({ profileExtra: {} })).status).toBe(
      403,
    );
  });

  it("a Parent cannot read it", async () => {
    const created = await add();
    const parent = await loginAs(app, "parent.a");
    expect(
      (await parent.get(`/api/students/${String(created.id)}`)).status,
    ).toBe(403);
    expect(world.centerA.id).toBeGreaterThan(0);
  });
});
