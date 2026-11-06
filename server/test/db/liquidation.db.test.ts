import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createLiquidationRepository } from "../../src/modules/liquidation/liquidation.repository.js";
import {
  buildApp,
  loginAs,
  seedMenuDays,
  seedStudents,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;
type Agent = Awaited<ReturnType<typeof loginAs>>;
let teacher: Agent;
let admin: Agent;

const FROM = "2026-11-09";
const TO = "2026-11-11";
const RANGE = { from: FROM, to: TO };

type Item = { id: number; version: number };
type Report = {
  id: number;
  status: string;
  currentVersion: number;
  periodStart: string;
};
type Snapshot = {
  versionNo: number;
  payload: {
    total: string;
    days: {
      date: string;
      subtotal: string;
      status: string;
      items: { description: string; total: string | null }[];
    }[];
  };
};

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma, { now: () => new Date("2026-11-12T02:00:00Z") });
  world = await seedWorld(prisma);
  await prisma.setting.createMany({
    data: [
      { key: "currentSchoolYear", value: "2026-2027" },
      { key: "perChildDailyRate", value: "25.00" },
    ],
  });
  await seedMenuDays(prisma, world.admin.id, [
    ["2026-11-09", "PORK PICADILLO"],
    ["2026-11-10", "CHICKEN TINOLA"],
    ["2026-11-11", "EGG CALDERETA"],
  ]);
  await seedStudents(prisma, world.centerA.id, 18);
  teacher = await loginAs(app, "teacher.a");
  admin = await loginAs(app, "admin.t");
});

// A day with one row: quantity x unit cost, then locked unless asked otherwise.
async function fillDay(
  date: string,
  quantity: string,
  unitCost: string,
  lock = true,
  agent: Agent = teacher,
) {
  const added = await agent
    .post(`/api/purchase-requests/${date}/items`)
    .send({ description: "Rice" });
  expect(added.status).toBe(201);
  const item = (added.body as { data: Item }).data;
  const patched = await agent
    .patch(`/api/purchase-items/${String(item.id)}`)
    .send({ version: item.version, unit: "kg", quantity, unitCost });
  expect(patched.status).toBe(200);
  if (lock) {
    expect(
      (await agent.post(`/api/purchase-requests/${date}/lock`)).status,
    ).toBe(200);
  }
  return (patched.body as { data: Item }).data;
}

async function readyMonth() {
  await fillDay("2026-11-09", "2", "38.00");
  await fillDay("2026-11-10", "0.5", "340.00");
  expect(
    (await teacher.post("/api/purchase-requests/2026-11-11/no-feeding")).status,
  ).toBe(200);
}

async function submit() {
  const res = await teacher.post("/api/liquidation/submit").send(RANGE);
  expect(res.status).toBe(201);
  return (res.body as { data: Report }).data;
}

function review(id: number, body: object) {
  return admin.post(`/api/reports/${String(id)}/review`).send(body);
}

function pdfBuffer(request: ReturnType<Agent["get"]>) {
  return request.buffer(true).parse((response, callback) => {
    const chunks: Buffer[] = [];
    response.on("data", (chunk: Buffer) => chunks.push(chunk));
    response.on("end", () => {
      callback(null, Buffer.concat(chunks));
    });
  });
}

describe("preview", () => {
  it("lists days and totals, flags blocking days, and leaves No feeding out", async () => {
    await fillDay("2026-11-09", "2", "38.00");
    await fillDay("2026-11-10", "0.5", "340.00", false);
    await teacher.post("/api/purchase-requests/2026-11-11/no-feeding");

    const res = await teacher.get(
      `/api/liquidation/preview?from=${FROM}&to=${TO}`,
    );
    expect(res.status).toBe(200);
    const data = (
      res.body as {
        data: {
          total: string;
          blockingDays: string[];
          days: { date: string; subtotal: string; status: string }[];
        };
      }
    ).data;
    expect(
      data.days.map((day) => [day.date, day.status, day.subtotal]),
    ).toEqual([
      ["2026-11-09", "LOCKED", "76.00"],
      ["2026-11-10", "OPEN", "170.00"],
      ["2026-11-11", "NO_FEEDING", "0.00"],
    ]);
    expect(data.total).toBe("246.00");
    expect(data.blockingDays).toEqual(["2026-11-10"]);
  });

  it("a day never opened blocks too; a range with no menus is 422 on submit", async () => {
    const res = await teacher.get(
      `/api/liquidation/preview?from=${FROM}&to=${TO}`,
    );
    const data = (res.body as { data: { blockingDays: string[] } }).data;
    expect(data.blockingDays).toEqual([FROM, "2026-11-10", TO]);

    const empty = await teacher
      .post("/api/liquidation/submit")
      .send({ from: "2026-01-01", to: "2026-01-31" });
    expect(empty.status).toBe(422);
  });
});

describe("submit (BR-16)", () => {
  it("is refused with the list of open days, and saves nothing", async () => {
    await fillDay("2026-11-09", "2", "38.00");
    await fillDay("2026-11-10", "1", "10.00", false);
    const res = await teacher.post("/api/liquidation/submit").send(RANGE);
    expect(res.status).toBe(422);
    const details = (res.body as { error: { details: { message: string }[] } })
      .error.details;
    const text = details.map((detail) => detail.message).join(" ");
    expect(text).toContain("2026-11-10");
    expect(text).toContain("2026-11-11");
    expect(text).not.toContain("2026-11-09");
    expect(await prisma.report.count()).toBe(0);
    expect(await prisma.liquidationSnapshot.count()).toBe(0);
  });

  it("creates the report and snapshot, and marks the days submitted", async () => {
    await readyMonth();
    const report = await submit();
    expect(report.status).toBe("SUBMITTED");
    expect(report.currentVersion).toBe(1);
    expect(report.periodStart).toBe(FROM);

    const days = await prisma.purchaseRequest.findMany();
    expect(days.every((day) => day.submittedReportId === report.id)).toBe(true);

    const snapshot = await teacher.get(
      `/api/reports/${String(report.id)}/snapshot`,
    );
    expect(snapshot.status).toBe(200);
    const data = (snapshot.body as { data: Snapshot }).data;
    expect(data.versionNo).toBe(1);
    expect(data.payload.total).toBe("246.00");
    expect(data.payload.days.map((day) => day.subtotal)).toEqual([
      "76.00",
      "170.00",
      "0.00",
    ]);
  });

  it("submitted days cannot be unlocked or changed", async () => {
    await readyMonth();
    await submit();
    expect(
      (await teacher.post(`/api/purchase-requests/${FROM}/unlock`)).status,
    ).toBe(409);
    expect(
      (await teacher.post(`/api/purchase-requests/${TO}/unlock`)).status,
    ).toBe(409);
  });

  it("an overlapping or repeated submission is 409", async () => {
    await readyMonth();
    await submit();
    expect(
      (await teacher.post("/api/liquidation/submit").send(RANGE)).status,
    ).toBe(409);
    const overlap = await teacher
      .post("/api/liquidation/submit")
      .send({ from: "2026-11-10", to: "2026-11-11" });
    expect(overlap.status).toBe(409);
    expect(await prisma.report.count()).toBe(1);
  });

  it("a failure in the transaction leaves no partial data", async () => {
    await readyMonth();
    const days = await prisma.purchaseRequest.findMany({
      orderBy: { id: "asc" },
    });
    // One day was taken by another report just before this submit.
    const other = await prisma.report.create({
      data: {
        centerId: world.centerA.id,
        teacherId: world.teacherA.id,
        type: "LIQUIDATION",
        periodStart: new Date("2026-10-01T00:00:00Z"),
        periodEnd: new Date("2026-10-31T00:00:00Z"),
        status: "SUBMITTED",
      },
    });
    await prisma.purchaseRequest.update({
      where: { id: days[0]?.id ?? 0 },
      data: { submittedReportId: other.id },
    });

    const repository = createLiquidationRepository(prisma);
    await expect(
      repository.submit({
        centerId: world.centerA.id,
        teacherId: world.teacherA.id,
        from: FROM,
        to: TO,
        prIds: days.map((day) => day.id),
        payload: { total: "0.00" },
        at: new Date(),
      }),
    ).rejects.toThrow();

    expect(await prisma.report.count()).toBe(1);
    expect(await prisma.liquidationSnapshot.count()).toBe(0);
    const after = await prisma.purchaseRequest.findMany({
      orderBy: { id: "asc" },
    });
    expect(after.slice(1).every((day) => day.submittedReportId === null)).toBe(
      true,
    );
  });
});

describe("review (BR-07, BR-16)", () => {
  it("Need Revision requires feedback", async () => {
    await readyMonth();
    const report = await submit();
    expect(
      (await review(report.id, { decision: "NEED_REVISION" })).status,
    ).toBe(400);
    expect(
      (await review(report.id, { decision: "NEED_REVISION", feedback: " " }))
        .status,
    ).toBe(400);
    expect((await review(report.id, { decision: "NOPE" })).status).toBe(400);
  });

  it("Need Revision unlocks the days; the Teacher fixes and resubmits as a new version", async () => {
    await readyMonth();
    const report = await submit();

    const back = await review(report.id, {
      decision: "NEED_REVISION",
      feedback: "Please check the rice price.",
    });
    expect(back.status).toBe(200);
    expect((back.body as { data: Report }).data.status).toBe("NEED_REVISION");

    const day = await prisma.purchaseRequest.findFirstOrThrow({
      where: {
        centerId: world.centerA.id,
        feedingDate: new Date(`${FROM}T00:00:00Z`),
      },
      include: { items: true },
    });
    expect(day.status).toBe("OPEN");
    expect(day.submittedReportId).toBe(null);
    expect(day.budget).toBe(null);

    const item = day.items[0];
    const edit = await teacher
      .patch(`/api/purchase-items/${String(item?.id)}`)
      .send({ version: item?.version, unitCost: "40.00" });
    expect(edit.status).toBe(200);

    // Open days block the resubmission until they are locked again.
    expect(
      (await teacher.post("/api/liquidation/submit").send(RANGE)).status,
    ).toBe(422);
    await teacher.post(`/api/purchase-requests/${FROM}/lock`);
    await teacher.post("/api/purchase-requests/2026-11-10/lock");

    const again = await teacher.post("/api/liquidation/submit").send(RANGE);
    expect(again.status).toBe(201);
    const second = (again.body as { data: Report }).data;
    expect(second.id).toBe(report.id);
    expect(second.status).toBe("SUBMITTED");
    expect(second.currentVersion).toBe(2);
    expect(await prisma.report.count()).toBe(1);

    const snapshot = await admin.get(
      `/api/reports/${String(report.id)}/snapshot`,
    );
    const data = (snapshot.body as { data: Snapshot }).data;
    expect(data.versionNo).toBe(2);
    expect(data.payload.total).toBe("250.00");

    // The first version is kept as it was submitted.
    const first = await prisma.liquidationSnapshot.findFirstOrThrow({
      where: { reportId: report.id, versionNo: 1 },
    });
    expect((first.payload as { total: string }).total).toBe("246.00");
  });

  it("the snapshot does not change when live data changes later", async () => {
    await readyMonth();
    const report = await submit();
    await prisma.purchaseItem.updateMany({ data: { unitCost: "999.00" } });
    const snapshot = await admin.get(
      `/api/reports/${String(report.id)}/snapshot`,
    );
    expect((snapshot.body as { data: Snapshot }).data.payload.total).toBe(
      "246.00",
    );
  });

  it("Approved is final, and the days stay locked", async () => {
    await readyMonth();
    const report = await submit();
    const approved = await review(report.id, { decision: "APPROVED" });
    expect((approved.body as { data: Report }).data.status).toBe("APPROVED");

    expect(
      (await review(report.id, { decision: "NEED_REVISION", feedback: "No" }))
        .status,
    ).toBe(409);
    expect((await review(report.id, { decision: "APPROVED" })).status).toBe(
      409,
    );
    expect(
      (await teacher.post(`/api/purchase-requests/${FROM}/unlock`)).status,
    ).toBe(409);
    expect(
      (await teacher.post("/api/liquidation/submit").send(RANGE)).status,
    ).toBe(409);
  });

  it("the Teacher sees the status and the feedback", async () => {
    await readyMonth();
    const report = await submit();
    await review(report.id, {
      decision: "NEED_REVISION",
      feedback: "Check the rice.",
    });
    const res = await teacher.get(`/api/reports/${String(report.id)}`);
    expect(res.status).toBe(200);
    const data = (
      res.body as {
        data: {
          status: string;
          reviews: { decision: string; feedback: string | null }[];
        };
      }
    ).data;
    expect(data.status).toBe("NEED_REVISION");
    expect(data.reviews[0]).toMatchObject({
      decision: "NEED_REVISION",
      feedback: "Check the rice.",
    });
  });
});

describe("scope", () => {
  it("lists: a Teacher sees the own reports, the Admin all", async () => {
    await readyMonth();
    const report = await submit();
    const other = await loginAs(app, "teacher.b");

    const own = await teacher.get("/api/reports");
    expect((own.body as { data: Report[] }).data.map((row) => row.id)).toEqual([
      report.id,
    ]);
    const none = await other.get("/api/reports");
    expect((none.body as { data: Report[] }).data).toEqual([]);
    const all = await admin.get("/api/reports");
    const rows = (
      all.body as { data: { id: number; centerName: string; total: string }[] }
    ).data;
    expect(rows[0]).toMatchObject({
      id: report.id,
      centerName: "Center A",
      total: "246.00",
    });
  });

  it("another center's Teacher gets 404 for a report, its snapshot and its PDFs", async () => {
    await readyMonth();
    const report = await submit();
    const other = await loginAs(app, "teacher.b");
    const base = `/api/reports/${String(report.id)}`;
    expect((await other.get(base)).status).toBe(404);
    expect((await other.get(`${base}/snapshot`)).status).toBe(404);
    expect((await other.get(`${base}/pdf/summary`)).status).toBe(404);
  });

  it("a Teacher cannot ask for another center's PDF; the Admin must name one", async () => {
    const query = `from=${FROM}&to=${TO}`;
    expect(
      (
        await teacher.get(
          `/api/liquidation/pdf/summary?${query}&centerId=${String(world.centerB.id)}`,
        )
      ).status,
    ).toBe(404);
    expect(
      (await admin.get(`/api/liquidation/pdf/summary?${query}`)).status,
    ).toBe(400);
    expect(
      (
        await admin.get(
          `/api/liquidation/pdf/summary?${query}&centerId=${String(world.centerA.id)}`,
        )
      ).status,
    ).toBe(200);
  });
});

describe("PDF endpoints", () => {
  it("live PDFs and PDFs from the snapshot all start with %PDF", async () => {
    await readyMonth();
    const query = `from=${FROM}&to=${TO}`;
    const report = await submit();
    const base = `/api/reports/${String(report.id)}/pdf`;
    for (const path of [
      `/api/liquidation/pdf/purchase-request?date=${FROM}`,
      `/api/liquidation/pdf/summary?${query}`,
      `/api/liquidation/pdf/transmittal?${query}`,
      `${base}/summary`,
      `${base}/transmittal`,
      `${base}/purchase-request?date=${FROM}`,
    ]) {
      const res = await pdfBuffer(teacher.get(path));
      expect(res.status, path).toBe(200);
      expect(res.headers["content-type"], path).toContain("application/pdf");
      expect((res.body as Buffer).subarray(0, 4).toString("latin1"), path).toBe(
        "%PDF",
      );
    }
  });

  it("a day with no Purchase Request has no PR PDF", async () => {
    const res = await teacher.get(
      `/api/liquidation/pdf/purchase-request?date=${FROM}`,
    );
    expect(res.status).toBe(404);
  });

  it("a date outside the report is 404 for its PR PDF", async () => {
    await readyMonth();
    const report = await submit();
    const res = await teacher.get(
      `/api/reports/${String(report.id)}/pdf/purchase-request?date=2026-12-01`,
    );
    expect(res.status).toBe(404);
  });
});
