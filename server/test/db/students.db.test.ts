import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
// 10:00 on 6 November 2026 in Manila.
const NOW = new Date("2026-11-06T02:00:00Z");

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

const CHILD = {
  lastName: "Dela Cruz",
  firstName: "Niño",
  middleName: "M",
  gender: "M",
  birthdate: "2022-11-06",
  weightKg: "14.50",
  heightCm: "96.5",
  parentGuardianName: "Rosa Dela Cruz",
};

type Student = {
  id: number;
  age: number;
  ageWarning: boolean;
  displayName: string;
  schoolYear: string;
  enrolledOn: string;
  weightKg: string;
  status: string;
  isEditable: boolean;
};

async function addStudent(
  agent: Awaited<ReturnType<typeof loginAs>>,
  extra = {},
) {
  const res = await agent.post("/api/students").send({ ...CHILD, ...extra });
  expect(res.status).toBe(201);
  return (res.body as { data: Student }).data;
}

describe("students: create and read", () => {
  it("creates in the current school year with a computed age", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const student = await addStudent(teacher);
    expect(student.schoolYear).toBe("2026-2027");
    expect(student.enrolledOn).toBe("2026-11-06");
    expect(student.age).toBe(4);
    expect(student.ageWarning).toBe(false);
    expect(student.displayName).toBe("Dela Cruz, Niño M.");
    expect(student.weightKg).toBe("14.50");
    expect(student.isEditable).toBe(true);
  });

  it("the day before the birthday the child is a year younger", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const student = await addStudent(teacher, { birthdate: "2022-11-07" });
    expect(student.age).toBe(3);
  });

  it("A-04: other ages are accepted with a warning; over 10 and future are refused", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const older = await addStudent(teacher, {
      firstName: "Older",
      birthdate: "2020-01-01",
    });
    expect(older.ageWarning).toBe(true);

    const tooOld = await teacher
      .post("/api/students")
      .send({ ...CHILD, firstName: "Late", birthdate: "2010-01-01" });
    expect(tooOld.status).toBe(400);

    const future = await teacher
      .post("/api/students")
      .send({ ...CHILD, firstName: "Soon", birthdate: "2026-12-01" });
    expect(future.status).toBe(400);
  });

  it("rejects bad fields with field details", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const res = await teacher.post("/api/students").send({
      lastName: "",
      firstName: "X1",
      gender: "Z",
      birthdate: "2023-02-30",
      weightKg: "2",
      heightCm: "96.55",
      parentGuardianName: "R",
    });
    expect(res.status).toBe(400);
    const fields = (
      res.body as { error: { details: { field: string }[] } }
    ).error.details.map((detail) => detail.field);
    for (const field of [
      "lastName",
      "firstName",
      "gender",
      "birthdate",
      "weightKg",
      "heightCm",
      "parentGuardianName",
    ]) {
      expect(fields).toContain(field);
    }
  });

  it("duplicate rule: same name and birthdate in the center and year is 409", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await addStudent(teacher);
    const duplicate = await teacher.post("/api/students").send(CHILD);
    expect(duplicate.status).toBe(409);

    const otherCenter = await loginAs(app, "teacher.b");
    await addStudent(otherCenter);
  });

  it("the same child in two school years is allowed", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await addStudent(teacher);
    await prisma.setting.update({
      where: { key: "currentSchoolYear" },
      data: { value: "2027-2028" },
    });
    await addStudent(teacher);
  });

  it("searches, filters and paginates", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await addStudent(teacher);
    await addStudent(teacher, {
      lastName: "Santos",
      firstName: "Maria",
      gender: "F",
    });

    const found = await teacher.get("/api/students?q=santos");
    expect(
      (found.body as { data: Student[] }).data.map((s) => s.displayName),
    ).toEqual(["Santos, Maria M."]);
    const girls = await teacher.get("/api/students?gender=F");
    expect((girls.body as { meta: { total: number } }).meta.total).toBe(1);
    const page = await teacher.get("/api/students?pageSize=1");
    const body = page.body as { data: Student[]; meta: { total: number } };
    expect(body.data.length).toBe(1);
    expect(body.meta.total).toBe(2);
  });
});

describe("students: edit and status", () => {
  it("edits; a duplicate through edit is 409", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const student = await addStudent(teacher);
    const other = await addStudent(teacher, { firstName: "Maria" });
    const ok = await teacher
      .patch(`/api/students/${String(student.id)}`)
      .send({ weightKg: "15.25" });
    expect(ok.status).toBe(200);
    expect((ok.body as { data: Student }).data.weightKg).toBe("15.25");

    const clash = await teacher
      .patch(`/api/students/${String(other.id)}`)
      .send({ firstName: "Niño" });
    expect(clash.status).toBe(409);
  });

  it("archives and restores; archived children leave the default list", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const student = await addStudent(teacher);
    const path = `/api/students/${String(student.id)}`;

    const archived = await teacher.post(`${path}/archive`);
    expect((archived.body as { data: Student }).data.status).toBe("ARCHIVED");
    const active = await teacher.get("/api/students?status=ACTIVE");
    expect((active.body as { meta: { total: number } }).meta.total).toBe(0);

    const restored = await teacher.post(`${path}/restore`);
    expect((restored.body as { data: Student }).data.status).toBe("ACTIVE");
  });

  it("previous school year rows are read-only (422)", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const student = await addStudent(teacher);
    await prisma.setting.update({
      where: { key: "currentSchoolYear" },
      data: { value: "2027-2028" },
    });
    const path = `/api/students/${String(student.id)}`;
    expect((await teacher.patch(path).send({ weightKg: "15.25" })).status).toBe(
      422,
    );
    expect((await teacher.post(`${path}/archive`)).status).toBe(422);
    const read = await teacher.get(path);
    expect(read.status).toBe(200);
    expect((read.body as { data: Student }).data.isEditable).toBe(false);
  });
});

describe("students: scope (BR-02, A-16)", () => {
  it("a Teacher sees only the own center, and 404 for another", async () => {
    const teacherA = await loginAs(app, "teacher.a");
    const teacherB = await loginAs(app, "teacher.b");
    const student = await addStudent(teacherA);
    const path = `/api/students/${String(student.id)}`;

    expect((await teacherB.get(path)).status).toBe(404);
    expect((await teacherB.patch(path).send({ weightKg: "15" })).status).toBe(
      404,
    );
    expect((await teacherB.post(`${path}/archive`)).status).toBe(404);
    const list = await teacherB.get("/api/students");
    expect((list.body as { meta: { total: number } }).meta.total).toBe(0);
    // A Teacher cannot read another center by asking for it.
    const asked = await teacherB.get(
      `/api/students?centerId=${String(world.centerA.id)}`,
    );
    expect(asked.status).toBe(404);
  });

  it("the Admin reads any center and cannot write", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const admin = await loginAs(app, "admin.t");
    const student = await addStudent(teacher);
    const path = `/api/students/${String(student.id)}`;

    expect((await admin.get(path)).status).toBe(200);
    const list = await admin.get(
      `/api/students?centerId=${String(world.centerA.id)}`,
    );
    expect((list.body as { meta: { total: number } }).meta.total).toBe(1);
    const empty = await admin.get(
      `/api/students?centerId=${String(world.centerB.id)}`,
    );
    expect((empty.body as { meta: { total: number } }).meta.total).toBe(0);

    expect((await admin.post("/api/students").send(CHILD)).status).toBe(403);
    expect((await admin.patch(path).send({ weightKg: "15" })).status).toBe(403);
    expect((await admin.post(`${path}/archive`)).status).toBe(403);
    expect(
      (
        await admin
          .post(`${path}/conferences`)
          .send({ noteDate: "2026-11-06", notes: "x" })
      ).status,
    ).toBe(403);
  });

  it("a Parent can read nothing here", async () => {
    const parent = await loginAs(app, "parent.a");
    expect((await parent.get("/api/students")).status).toBe(403);
  });
});

describe("summary", () => {
  it("counts an 18-child fixture by age and gender, leaving out archived", async () => {
    const teacher = await loginAs(app, "teacher.a");
    // Hand count. Age 2: 3 M, 2 F. Age 3: 4 M, 3 F. Age 4: 2 M, 2 F. Other: 1 M, 1 F.
    const plan: [string, "M" | "F", number][] = [
      ["2024-01-15", "M", 3],
      ["2024-01-15", "F", 2],
      ["2023-01-15", "M", 4],
      ["2023-01-15", "F", 3],
      ["2022-01-15", "M", 2],
      ["2022-01-15", "F", 2],
      ["2021-01-15", "M", 1],
      ["2021-01-15", "F", 1],
    ];
    let serial = 0;
    for (const [birthdate, gender, count] of plan) {
      for (let i = 0; i < count; i += 1) {
        serial += 1;
        await addStudent(teacher, {
          firstName: `Child${"abcdefghijklmnopqrst".charAt(serial)}`,
          birthdate,
          gender,
        });
      }
    }
    const archived = await addStudent(teacher, {
      firstName: "Gone",
      birthdate: "2024-01-15",
    });
    await teacher.post(`/api/students/${String(archived.id)}/archive`);

    const res = await teacher.get("/api/students/summary");
    expect(res.status).toBe(200);
    expect((res.body as { data: unknown }).data).toEqual({
      schoolYear: "2026-2027",
      rows: [
        { bucket: "2", male: 3, female: 2 },
        { bucket: "3", male: 4, female: 3 },
        { bucket: "4", male: 2, female: 2 },
        { bucket: "Other", male: 1, female: 1 },
      ],
      totalMale: 10,
      totalFemale: 8,
      total: 18,
    });
  });

  it("a center with no children counts zero; the Admin can ask per center", async () => {
    const admin = await loginAs(app, "admin.t");
    const res = await admin.get(
      `/api/students/summary?centerId=${String(world.centerB.id)}`,
    );
    expect((res.body as { data: { total: number } }).data.total).toBe(0);
  });
});

describe("Child's Record (BR-22)", () => {
  async function setup() {
    const teacher = await loginAs(app, "teacher.a");
    const student = await addStudent(teacher);
    return { teacher, base: `/api/students/${String(student.id)}` };
  }

  it("conference notes: create, list newest first, edit, soft delete", async () => {
    const { teacher, base } = await setup();
    const first = await teacher
      .post(`${base}/conferences`)
      .send({ noteDate: "2026-10-01", noteTime: "14:30", notes: "First talk" });
    expect(first.status).toBe(201);
    await teacher
      .post(`${base}/conferences`)
      .send({ noteDate: "2026-11-01", notes: "Second talk" });

    const list = await teacher.get(`${base}/conferences`);
    const rows = (
      list.body as {
        data: { id: number; notes: string; noteTime: string | null }[];
      }
    ).data;
    expect(rows.map((row) => row.notes)).toEqual(["Second talk", "First talk"]);
    expect(rows[1]?.noteTime).toBe("14:30");

    const id = (first.body as { data: { id: number } }).data.id;
    const edited = await teacher
      .patch(`/api/conferences/${String(id)}`)
      .send({ notes: "Edited" });
    expect((edited.body as { data: { notes: string } }).data.notes).toBe(
      "Edited",
    );

    expect(
      (await teacher.delete(`/api/conferences/${String(id)}`)).status,
    ).toBe(200);
    const after = await teacher.get(`${base}/conferences`);
    expect((after.body as { data: unknown[] }).data.length).toBe(1);
    const row = await prisma.conferenceNote.findUniqueOrThrow({
      where: { id },
    });
    expect(row.deletedAt).not.toBe(null);
    expect(
      (
        await teacher
          .patch(`/api/conferences/${String(id)}`)
          .send({ notes: "x" })
      ).status,
    ).toBe(404);
  });

  it("home visits and progress work the same way", async () => {
    const { teacher, base } = await setup();
    const visit = await teacher.post(`${base}/home-visits`).send({
      visitDate: "2026-11-02",
      observation: "Clean home",
      parentInfo: "Mother works at the market",
      remarks: "Follow up",
    });
    expect(visit.status).toBe(201);
    const visitId = (visit.body as { data: { id: number } }).data.id;
    expect(
      (
        await teacher
          .patch(`/api/home-visits/${String(visitId)}`)
          .send({ remarks: "Done" })
      ).status,
    ).toBe(200);
    expect(
      (await teacher.delete(`/api/home-visits/${String(visitId)}`)).status,
    ).toBe(200);
    expect(
      ((await teacher.get(`${base}/home-visits`)).body as { data: unknown[] })
        .data.length,
    ).toBe(0);

    const progress = await teacher
      .post(`${base}/progress`)
      .send({ noteDate: "2026-11-03", progressNotes: "Can count to ten" });
    expect(progress.status).toBe(201);
    const progressId = (progress.body as { data: { id: number } }).data.id;
    expect(
      (
        await teacher
          .patch(`/api/progress/${String(progressId)}`)
          .send({ progressNotes: "To twenty" })
      ).status,
    ).toBe(200);
    expect(
      (await teacher.delete(`/api/progress/${String(progressId)}`)).status,
    ).toBe(200);
  });

  it("validates entries", async () => {
    const { teacher, base } = await setup();
    const res = await teacher
      .post(`${base}/conferences`)
      .send({ noteDate: "nope", notes: "" });
    expect(res.status).toBe(400);
  });

  it("another center's Teacher gets 404; the Admin reads but cannot write; a Parent is 403", async () => {
    const { teacher, base } = await setup();
    const created = await teacher
      .post(`${base}/conferences`)
      .send({ noteDate: "2026-10-01", notes: "Private" });
    const id = String((created.body as { data: { id: number } }).data.id);

    const other = await loginAs(app, "teacher.b");
    expect((await other.get(`${base}/conferences`)).status).toBe(404);
    expect(
      (
        await other
          .post(`${base}/conferences`)
          .send({ noteDate: "2026-10-01", notes: "x" })
      ).status,
    ).toBe(404);
    expect(
      (await other.patch(`/api/conferences/${id}`).send({ notes: "x" })).status,
    ).toBe(404);
    expect((await other.delete(`/api/conferences/${id}`)).status).toBe(404);

    const admin = await loginAs(app, "admin.t");
    expect((await admin.get(`${base}/conferences`)).status).toBe(200);
    expect(
      (await admin.patch(`/api/conferences/${id}`).send({ notes: "x" })).status,
    ).toBe(403);
    expect((await admin.delete(`/api/conferences/${id}`)).status).toBe(403);

    const parent = await loginAs(app, "parent.a");
    expect((await parent.get(`${base}/conferences`)).status).toBe(403);
  });
});

describe("GET /api/enrollment-form.pdf", () => {
  it("a Teacher gets the own center's PDF", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await addStudent(teacher);
    const res = await teacher
      .get("/api/enrollment-form.pdf?dateStarted=2026-06-08")
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          callback(null, Buffer.concat(chunks));
        });
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect((res.body as Buffer).subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("the Admin must name a center; a Teacher cannot ask for another; a Parent is 403", async () => {
    const admin = await loginAs(app, "admin.t");
    expect((await admin.get("/api/enrollment-form.pdf")).status).toBe(400);
    expect(
      (
        await admin.get(
          `/api/enrollment-form.pdf?centerId=${String(world.centerA.id)}`,
        )
      ).status,
    ).toBe(200);
    const teacher = await loginAs(app, "teacher.a");
    expect(
      (
        await teacher.get(
          `/api/enrollment-form.pdf?centerId=${String(world.centerB.id)}`,
        )
      ).status,
    ).toBe(404);
    const parent = await loginAs(app, "parent.a");
    expect((await parent.get("/api/enrollment-form.pdf")).status).toBe(403);
  });
});
