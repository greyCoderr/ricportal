import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
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

describe("Child's Record entries of an earlier school year are read-only (AUD-014)", () => {
  async function oldStudentWithEntries() {
    const student = await prisma.student.create({
      data: {
        centerId: world.centerA.id,
        schoolYear: "2025-2026",
        lastName: "Test",
        firstName: "Older",
        gender: "F",
        birthdate: new Date("2021-03-10T00:00:00.000Z"),
        weightKg: "15.00",
        heightCm: "100.0",
        parentGuardianName: "Rosa Test",
        enrolledOn: new Date("2025-06-09T00:00:00.000Z"),
      },
    });
    const day = new Date("2025-09-01T00:00:00.000Z");
    const by = world.teacherA.id;
    const conference = await prisma.conferenceNote.create({
      data: {
        studentId: student.id,
        noteDate: day,
        notes: "Old",
        createdBy: by,
      },
    });
    const visit = await prisma.homeVisit.create({
      data: {
        studentId: student.id,
        visitDate: day,
        observation: "Old",
        createdBy: by,
      },
    });
    const progress = await prisma.childProgress.create({
      data: {
        studentId: student.id,
        noteDate: day,
        progressNotes: "Old",
        createdBy: by,
      },
    });
    return { student, conference, visit, progress };
  }

  it("no entry can be added to a child of an earlier year", async () => {
    const { student } = await oldStudentWithEntries();
    const teacher = await loginAs(app, "teacher.a");
    const base = `/api/students/${String(student.id)}`;
    const answers = await Promise.all([
      teacher
        .post(`${base}/conferences`)
        .send({ noteDate: "2026-11-02", notes: "New" }),
      teacher
        .post(`${base}/home-visits`)
        .send({ visitDate: "2026-11-02", observation: "New" }),
      teacher
        .post(`${base}/progress`)
        .send({ noteDate: "2026-11-02", progressNotes: "New" }),
    ]);
    expect(answers.map((res) => res.status)).toEqual([422, 422, 422]);
    expect(await prisma.conferenceNote.count()).toBe(1);
    expect(await prisma.homeVisit.count()).toBe(1);
    expect(await prisma.childProgress.count()).toBe(1);
  });

  it("its entries cannot be edited or deleted, and can still be read", async () => {
    const { student, conference, visit, progress } =
      await oldStudentWithEntries();
    const teacher = await loginAs(app, "teacher.a");
    const paths = [
      `/api/conferences/${String(conference.id)}`,
      `/api/home-visits/${String(visit.id)}`,
      `/api/progress/${String(progress.id)}`,
    ];
    const bodies = [
      { notes: "Changed" },
      { observation: "Changed" },
      { progressNotes: "Changed" },
    ];
    for (const [index, path] of paths.entries()) {
      expect((await teacher.patch(path).send(bodies[index])).status).toBe(422);
      expect((await teacher.delete(path)).status).toBe(422);
    }
    const kept = await prisma.conferenceNote.findUniqueOrThrow({
      where: { id: conference.id },
    });
    expect(kept.notes).toBe("Old");
    expect(kept.deletedAt).toBe(null);
    expect(await prisma.homeVisit.count({ where: { deletedAt: null } })).toBe(
      1,
    );
    expect(
      await prisma.childProgress.count({ where: { deletedAt: null } }),
    ).toBe(1);
    const list = await teacher.get(
      `/api/students/${String(student.id)}/conferences`,
    );
    expect(list.status).toBe(200);
  });
});
