import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedMenuDays, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
type Agent = Awaited<ReturnType<typeof loginAs>>;
let teacherA: Agent;
let teacherB: Agent;
let admin: Agent;

const DAY_A = "2026-11-09";
const DAY_B = "2026-11-10";
const URL = "/api/reports/feedback";

type Row = {
  reportId: number;
  periodStart: string;
  periodEnd: string;
  versionNo: number;
  feedback: string;
  reviewedAt: string;
  reportStatus: string;
};
type ListBody = { data: Row[]; meta: { total: number } };

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma, { now: () => new Date("2026-11-20T02:00:00Z") });
  world = await seedWorld(prisma);
  await prisma.setting.createMany({
    data: [
      { key: "currentSchoolYear", value: "2026-2027" },
      { key: "perChildDailyRate", value: "25.00" },
    ],
  });
  await seedMenuDays(prisma, world.admin.id, [
    [DAY_A, "PORK PICADILLO"],
    [DAY_B, "CHICKEN TINOLA"],
  ]);
  teacherA = await loginAs(app, "teacher.a");
  teacherB = await loginAs(app, "teacher.b");
  admin = await loginAs(app, "admin.t");
});

async function submit(agent: Agent, day: string): Promise<number> {
  const pr = `/api/purchase-requests/${day}`;
  await agent.post(`${pr}/open`);
  await agent.post(`${pr}/lock`);
  const res = await agent
    .post("/api/liquidation/submit")
    .send({ from: day, to: day });
  expect(res.status).toBe(201);
  return (res.body as { data: { id: number } }).data.id;
}

function sendBack(id: number, feedback: string) {
  return admin
    .post(`/api/reports/${String(id)}/review`)
    .send({ decision: "NEED_REVISION", feedback });
}

describe("Report Status shows only own submissions", () => {
  it("each Teacher lists their own center's reports", async () => {
    const own = await submit(teacherA, DAY_A);
    const others = await submit(teacherB, DAY_B);

    const res = await teacherA.get("/api/reports");
    const ids = (res.body as { data: { id: number }[] }).data.map(
      (row) => row.id,
    );
    expect(ids).toEqual([own]);
    expect(ids).not.toContain(others);

    expect((await teacherA.get(`/api/reports/${String(others)}`)).status).toBe(
      404,
    );
  });

  it("the Admin still sees every center", async () => {
    await submit(teacherA, DAY_A);
    await submit(teacherB, DAY_B);
    const res = await admin.get("/api/reports");
    expect((res.body as ListBody).meta.total).toBe(2);
  });
});

describe("GET /api/reports/feedback (Admin Feedback)", () => {
  it("lists only the own center's feedback", async () => {
    const own = await submit(teacherA, DAY_A);
    const others = await submit(teacherB, DAY_B);
    await sendBack(own, "Fix the rice.");
    await sendBack(others, "Secret note for center B.");

    const res = await teacherA.get(URL);
    expect(res.status).toBe(200);
    const body = res.body as ListBody;
    expect(body.meta.total).toBe(1);
    expect(body.data.map((row) => row.feedback)).toEqual(["Fix the rice."]);
    expect(JSON.stringify(res.body)).not.toContain("Secret note");
    expect(body.data[0]).toMatchObject({
      reportId: own,
      periodStart: DAY_A,
      periodEnd: DAY_A,
      versionNo: 1,
      reportStatus: "NEED_REVISION",
    });
  });

  it("leaves out approvals and reports with no review", async () => {
    await submit(teacherA, DAY_B);
    const approved = await submit(teacherA, DAY_A);
    await admin
      .post(`/api/reports/${String(approved)}/review`)
      .send({ decision: "APPROVED" });
    expect(((await teacherA.get(URL)).body as ListBody).data).toEqual([]);
  });

  it("keeps old feedback after a resubmission, and shows the report moved on", async () => {
    const id = await submit(teacherA, DAY_A);
    await sendBack(id, "First note.");
    await teacherA.post(`/api/purchase-requests/${DAY_A}/lock`);
    const again = await teacherA
      .post("/api/liquidation/submit")
      .send({ from: DAY_A, to: DAY_A });
    expect(again.status).toBe(201);
    const reportId = (again.body as { data: { id: number } }).data.id;
    await sendBack(reportId, "Second note.");

    const rows = ((await teacherA.get(URL)).body as ListBody).data;
    expect(rows.map((row) => row.feedback)).toEqual([
      "Second note.",
      "First note.",
    ]);
    expect(rows.map((row) => row.versionNo)).toEqual([2, 1]);
  });

  it("pages the list", async () => {
    const one = await submit(teacherA, DAY_A);
    const two = await submit(teacherA, DAY_B);
    await sendBack(one, "One.");
    await sendBack(two, "Two.");
    const res = await teacherA.get(`${URL}?page=2&pageSize=1`);
    const body = res.body as ListBody;
    expect(body.meta.total).toBe(2);
    expect(body.data).toHaveLength(1);
  });

  it("is for Teachers only", async () => {
    expect((await admin.get(URL)).status).toBe(403);
    const parent = await loginAs(app, "parent.a");
    expect((await parent.get(URL)).status).toBe(403);
  });
});
