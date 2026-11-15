import { Writable } from "node:stream";
import { pino } from "pino";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedMenuDays, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-005 and AUD-006 (docs/AUDIT_REPORT.md): two requests that write the same
// thing at the same moment. One succeeds; the other gets a 409, never a 500.

const WEEK = "2026-11-09";
const TUE = "2026-11-10";

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
  app = buildApp(prisma, { logger: pino({ level: "error" }, sink) });
  world = await seedWorld(prisma);
});

// The codes of the errors the server logged, to show what a 500 was.
function loggedCodes(): string[] {
  return logged
    .join("")
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => {
      const entry = JSON.parse(line) as {
        err?: { code?: string; name?: string; type?: string };
      };
      return `${entry.err?.type ?? entry.err?.name ?? "?"}:${entry.err?.code ?? "?"}`;
    });
}

describe("the same week saved twice at once (AUD-005)", () => {
  it("answers 200 or 409, never 500, and the week is saved once", async () => {
    await seedMenuDays(prisma, world.admin.id, [[TUE, "CHICKEN TINOLA"]]);
    const teacher = await loginAs(app, "teacher.a");
    const body = {
      week: WEEK,
      teamParentIds: [world.parentA.id],
      days: [{ date: TUE, parentIds: [world.parentA.id] }],
    };
    for (let round = 0; round < 5; round += 1) {
      const answers = await Promise.all(
        Array.from({ length: 4 }, () =>
          teacher.put("/api/assignments/week").send(body),
        ),
      );
      const statuses = answers.map((res) => res.status);
      expect(
        statuses.filter((status) => status !== 200 && status !== 409),
        `statuses ${statuses.join(",")} logged ${loggedCodes().join(" ")}`,
      ).toEqual([]);
      expect(statuses).toContain(200);
      expect(await prisma.feedingAssignment.count()).toBe(1);
      expect(await prisma.weekTeamMember.count()).toBe(1);
    }
  }, 120_000);
});

describe("the same new record sent twice at once (AUD-006)", () => {
  it("Parent sign-up with one username: 201 and 409", async () => {
    const signup = () =>
      loginlessPost("/api/auth/parent-signup", {
        fullName: "Rosa Test",
        username: "rosa.same",
        mobile: "09171234567",
        centerId: world.centerA.id,
        password: "Parent2026pw",
        confirmPassword: "Parent2026pw",
      });
    const statuses = (await Promise.all([signup(), signup(), signup()]))
      .map((res) => res.status)
      .sort();
    expect(statuses, loggedCodes().join(" ")).toEqual([201, 409, 409]);
    expect(await prisma.user.count({ where: { username: "rosa.same" } })).toBe(
      1,
    );
  });

  it("Add Student with the same child: 201 and 409", async () => {
    await prisma.setting.create({
      data: { key: "currentSchoolYear", value: "2026-2027" },
    });
    const teacher = await loginAs(app, "teacher.a");
    const add = () =>
      teacher.post("/api/students").send({
        lastName: "Dela Cruz",
        firstName: "Juan",
        gender: "M",
        birthdate: "2023-01-15",
        weightKg: "14.50",
        heightCm: "96.5",
        parentGuardianName: "Rosa Dela Cruz",
      });
    const statuses = (await Promise.all([add(), add(), add()]))
      .map((res) => res.status)
      .sort();
    expect(statuses, loggedCodes().join(" ")).toEqual([201, 409, 409]);
    expect(await prisma.student.count()).toBe(1);
  });
});

async function loginlessPost(path: string, body: object) {
  const { default: request } = await import("supertest");
  return request(app).post(path).send(body);
}
