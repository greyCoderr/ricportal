import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { seedBase } from "../../prisma/seed-base.js";
import { addDays } from "@ricportal/shared";
import { buildApp, loginAs } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// The whole demo path (docs/SPRINT_PLAN.md, section 7) through the real app and
// the test database, in one order, on the day of the demo.

const FIXTURE = readFileSync(
  fileURLToPath(
    new URL("../fixtures/SF_MENU_for_30_days.xlsx", import.meta.url),
  ),
);
const ADMIN_PASSWORD = "Admin2026!";
const TEACHER_PASSWORD = "Teacher2026pw";
const PARENT_PASSWORD = "Parent2026pw";
const MONTH = { from: "2026-11-01", to: "2026-11-30" };
const DAY = "2026-11-10";

type Agent = ReturnType<typeof request.agent>;
type Body<T> = { data: T };

function data<T>(res: { body: unknown }): T {
  return (res.body as Body<T>).data;
}

function pdf(call: ReturnType<Agent["get"]>) {
  return call.buffer(true).parse((response, callback) => {
    const chunks: Buffer[] = [];
    response.on("data", (chunk: Buffer) => chunks.push(chunk));
    response.on("end", () => {
      callback(null, Buffer.concat(chunks));
    });
  });
}

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  prisma = createTestPrisma();
  await resetDatabase(prisma);
  await seedBase(prisma, {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD,
    BCRYPT_COST: 4,
  });
  app = buildApp(prisma, { now: () => new Date("2026-11-10T02:00:00Z") });
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("demo path", () => {
  it("walks all 10 steps", async () => {
    // 1. The Admin logs in.
    const admin: Agent = await loginAs(app, "admin", ADMIN_PASSWORD);

    // 2. The Admin creates teacher.sibujo for Sibujo.
    const sibujo = await prisma.center.findUniqueOrThrow({
      where: { name: "Sibujo" },
    });
    const created = await admin.post("/api/teachers").send({
      fullName: "Ana Cruz",
      username: "teacher.sibujo",
      centerId: sibujo.id,
    });
    expect(created.status).toBe(201);
    const temporary = data<{ temporaryPassword: string }>(
      created,
    ).temporaryPassword;

    const teacher: Agent = await loginAs(app, "teacher.sibujo", temporary);
    expect((await teacher.get("/api/students")).status).toBe(403);
    const changed = await teacher.post("/api/auth/change-password").send({
      currentPassword: temporary,
      newPassword: TEACHER_PASSWORD,
      confirmPassword: TEACHER_PASSWORD,
    });
    expect(changed.status).toBe(200);

    // 3. A Parent signs up for Sibujo, the Teacher approves, the Parent logs in.
    const signup = await request(app).post("/api/auth/parent-signup").send({
      fullName: "Rosa Dela Cruz",
      username: "rosa.delacruz",
      mobile: "09171234567",
      centerId: sibujo.id,
      childName: "Niño",
      password: PARENT_PASSWORD,
      confirmPassword: PARENT_PASSWORD,
    });
    expect(signup.status).toBe(201);
    const tooSoon = await request(app)
      .post("/api/auth/login")
      .send({ username: "rosa.delacruz", password: PARENT_PASSWORD });
    expect(tooSoon.status).toBe(403);

    const requests = await teacher.get("/api/parents?status=PENDING");
    const pending = data<{ id: number; username: string }[]>(requests);
    expect(pending.map((row) => row.username)).toEqual(["rosa.delacruz"]);
    const parentId = pending[0]?.id ?? 0;
    expect(
      (await teacher.post(`/api/parents/${String(parentId)}/approve`)).status,
    ).toBe(200);
    const parent: Agent = await loginAs(app, "rosa.delacruz", PARENT_PASSWORD);

    // 4. The Teacher adds 5 students, a conference note, a home visit, and the
    // Enrollment Form PDF.
    const names = ["Maria", "Jose", "Ana", "Pedro", "Niño"];
    let firstStudent = 0;
    for (const [index, firstName] of names.entries()) {
      const res = await teacher.post("/api/students").send({
        lastName: "Dela Cruz",
        firstName,
        gender: index % 2 === 0 ? "F" : "M",
        birthdate: `202${String(2 + (index % 3))}-03-14`,
        weightKg: "14.50",
        heightCm: "96.5",
        parentGuardianName: "Rosa Dela Cruz",
      });
      expect(res.status, firstName).toBe(201);
      firstStudent ||= data<{ id: number }>(res).id;
    }
    const profile = await teacher.get(`/api/students/${String(firstStudent)}`);
    expect(data<{ age: number }>(profile).age).toBe(4);
    const base = `/api/students/${String(firstStudent)}`;
    expect(
      (
        await teacher
          .post(`${base}/conferences`)
          .send({ noteDate: DAY, notes: "Talked with the mother." })
      ).status,
    ).toBe(201);
    expect(
      (
        await teacher
          .post(`${base}/home-visits`)
          .send({ visitDate: DAY, observation: "A clean, safe home." })
      ).status,
    ).toBe(201);
    const enrollment = await pdf(teacher.get("/api/enrollment-form.pdf"));
    expect(enrollment.status).toBe(200);
    expect((enrollment.body as Buffer).subarray(0, 4).toString("latin1")).toBe(
      "%PDF",
    );

    // 5. The Admin uploads the DSWD file, previews and confirms; the calendar
    // shows menus from 17 Sep to 9 Dec 2026.
    const preview = await admin
      .post("/api/menu/imports/preview")
      .attach("file", FIXTURE, { filename: "SF_MENU_for_30_days.xlsx" });
    expect(preview.status).toBe(200);
    const token = data<{ token: string }>(preview).token;
    expect(
      (await admin.post("/api/menu/imports/confirm").send({ token })).status,
    ).toBe(201);
    const first = await teacher.get(
      "/api/calendar?from=2026-09-17&to=2026-09-17",
    );
    expect(data<{ menuName: string }[]>(first)[0]?.menuName).toBe(
      "EGG CALDERETA",
    );
    const last = await teacher.get(
      "/api/calendar?from=2026-12-09&to=2026-12-09",
    );
    expect(data<{ menuName: string }[]>(last)[0]?.menuName).toBe(
      "SINIGANG NA BABOY",
    );

    // 6. The Teacher assigns the Parent this week, opens a Purchase Request and
    // lists ingredients.
    const week = await teacher.get("/api/assignments?week=2026-11-09");
    expect(data<unknown[]>(week).length).toBe(7);
    expect(
      (
        await teacher
          .put(`/api/assignments/${DAY}`)
          .send({ parentIds: [parentId] })
      ).status,
    ).toBe(200);
    const pr = `/api/purchase-requests/${DAY}`;
    expect((await teacher.post(`${pr}/open`)).status).toBe(200);
    const items: { id: number; version: number }[] = [];
    for (const description of ["Rice", "Chicken", "Oil"]) {
      const res = await teacher.post(`${pr}/items`).send({ description });
      expect(res.status).toBe(201);
      items.push(data<{ id: number; version: number }>(res));
    }

    // 7. The Parent opens the assigned day and enters unit, quantity and cost;
    // totals and subtotal update; the Parent response has no budget.
    const schedule = await parent.get(
      "/api/parent-schedule?from=2026-11-01&to=2026-11-30",
    );
    expect(
      data<{ date: string; assigned: boolean }[]>(schedule)
        .filter((row) => row.assigned)
        .map((row) => row.date),
    ).toEqual([DAY]);
    const entries: [string, string, string, string][] = [
      ["kg", "2", "38.00", "76.00"],
      ["kg", "0.5", "340.00", "170.00"],
      ["bottle", "0.25", "80.00", "20.00"],
    ];
    for (const [
      index,
      [unit, quantity, unitCost, total],
    ] of entries.entries()) {
      const item = items[index];
      const res = await parent
        .patch(`/api/purchase-items/${String(item?.id)}`)
        .send({ version: item?.version, unit, quantity, unitCost });
      expect(res.status).toBe(200);
      expect(data<{ total: string }>(res).total).toBe(total);
    }
    const parentView = await parent.get(pr);
    expect(data<{ subtotal: string }>(parentView).subtotal).toBe("266.00");
    for (const field of ["budget", "enrolledCount", "ratePerChild"]) {
      expect(JSON.stringify(parentView.body)).not.toContain(field);
    }
    const teacherView = await teacher.get(pr);
    expect(data<{ budget: string }>(teacherView).budget).toBe("125.00");

    // 8. The Teacher locks the day; the Parent can no longer edit.
    expect((await teacher.post(`${pr}/lock`)).status).toBe(200);
    const latest = data<{ items: { id: number; version: number }[] }>(
      await parent.get(pr),
    ).items[0];
    const refused = await parent
      .patch(`/api/purchase-items/${String(latest?.id)}`)
      .send({ version: latest?.version, quantity: "9" });
    expect(refused.status).toBe(409);

    // 9. The Teacher downloads the PDFs and submits the month; the Admin sends
    // it back, the days unlock; the Teacher resubmits; the Admin approves.
    const query = `from=${MONTH.from}&to=${MONTH.to}`;
    for (const path of [
      `/api/liquidation/pdf/purchase-request?date=${DAY}`,
      `/api/liquidation/pdf/summary?${query}`,
      `/api/liquidation/pdf/transmittal?${query}`,
    ]) {
      const res = await pdf(teacher.get(path));
      expect(res.status, path).toBe(200);
      expect((res.body as Buffer).subarray(0, 4).toString("latin1")).toBe(
        "%PDF",
      );
    }

    const blocked = await teacher.post("/api/liquidation/submit").send(MONTH);
    expect(blocked.status).toBe(422);
    for (let day = MONTH.from; day <= MONTH.to; day = addDays(day, 1)) {
      if (day !== DAY) {
        const res = await teacher.post(
          `/api/purchase-requests/${day}/no-feeding`,
        );
        expect(res.status, day).toBe(200);
      }
    }

    const submitted = await teacher.post("/api/liquidation/submit").send(MONTH);
    expect(submitted.status).toBe(201);
    const reportId = data<{ id: number }>(submitted).id;
    const queue = await admin.get("/api/reports");
    expect(
      data<{ id: number; total: string; status: string }[]>(queue)[0],
    ).toMatchObject({ id: reportId, total: "266.00", status: "SUBMITTED" });

    const backPath = `/api/reports/${String(reportId)}/review`;
    expect(
      (
        await admin
          .post(backPath)
          .send({ decision: "NEED_REVISION", feedback: "Check the oil price." })
      ).status,
    ).toBe(200);
    const reopened = data<{
      status: string;
      items: { id: number; version: number }[];
    }>(await teacher.get(pr));
    expect(reopened.status).toBe("OPEN");
    const oil = reopened.items[2];
    expect(
      (
        await teacher
          .patch(`/api/purchase-items/${String(oil?.id)}`)
          .send({ version: oil?.version, unitCost: "84.00" })
      ).status,
    ).toBe(200);
    expect((await teacher.post(`${pr}/lock`)).status).toBe(200);
    const resubmitted = await teacher
      .post("/api/liquidation/submit")
      .send(MONTH);
    expect(resubmitted.status).toBe(201);
    expect(data<{ currentVersion: number }>(resubmitted).currentVersion).toBe(
      2,
    );
    expect(
      (await admin.post(backPath).send({ decision: "APPROVED" })).status,
    ).toBe(200);
    const final = await teacher.get(
      `/api/reports/${String(reportId)}/snapshot`,
    );
    expect(data<{ payload: { total: string } }>(final).payload.total).toBe(
      "267.00",
    );
    expect((await teacher.post(`${pr}/unlock`)).status).toBe(409);

    // 10. API-only: the Admin reads the students by center and a Child's Record
    // and cannot write.
    const byCenter = await admin.get(
      `/api/students?centerId=${String(sibujo.id)}`,
    );
    expect((byCenter.body as { meta: { total: number } }).meta.total).toBe(5);
    const notes = await admin.get(`${base}/conferences`);
    expect(data<unknown[]>(notes).length).toBe(1);
    expect(
      (
        await admin
          .post(`${base}/conferences`)
          .send({ noteDate: DAY, notes: "x" })
      ).status,
    ).toBe(403);
    expect((await admin.patch(base).send({ weightKg: "15.00" })).status).toBe(
      403,
    );
    expect((await admin.post(`${base}/archive`)).status).toBe(403);
  }, 120_000);
});
