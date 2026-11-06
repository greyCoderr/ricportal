import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

const FIXTURE = readFileSync(
  fileURLToPath(
    new URL("../fixtures/SF_MENU_for_30_days.xlsx", import.meta.url),
  ),
);

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let clock: Date;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  clock = new Date("2026-11-06T02:00:00Z");
  app = buildApp(prisma, { now: () => clock });
  await seedWorld(prisma);
});

type Preview = {
  data: {
    token: string | null;
    batches: {
      sheetName: string;
      prNo: string;
      days: number;
      warnings: string[];
    }[];
    errors: string[];
    overlaps: string[];
  };
};

function upload(
  agent: Awaited<ReturnType<typeof loginAs>>,
  file: Buffer,
  filename = "SF_MENU_for_30_days.xlsx",
) {
  return agent
    .post("/api/menu/imports/preview")
    .attach("file", file, { filename });
}

async function importFixture() {
  const admin = await loginAs(app, "admin.t");
  const preview = await upload(admin, FIXTURE);
  expect(preview.status).toBe(200);
  const token = (preview.body as Preview).data.token;
  const confirm = await admin.post("/api/menu/imports/confirm").send({ token });
  expect(confirm.status).toBe(201);
  return admin;
}

describe("preview", () => {
  it("shows the 2 sheets of the real file and saves nothing", async () => {
    const admin = await loginAs(app, "admin.t");
    const res = await upload(admin, FIXTURE);
    expect(res.status).toBe(200);
    const data = (res.body as Preview).data;
    expect(data.errors).toEqual([]);
    expect(data.batches.map((batch) => [batch.prNo, batch.days])).toEqual([
      ["SF-2026-003", 42],
      ["SF-2026-004", 42],
    ]);
    expect(data.token).not.toBe(null);
    expect(await prisma.menuDay.count()).toBe(0);
  });

  it("refuses a wrong type, a fake .xlsx and a too large file in the standard shape", async () => {
    const admin = await loginAs(app, "admin.t");

    const wrongName = await upload(admin, FIXTURE, "menu.csv");
    expect(wrongName.status).toBe(400);

    const notZip = await upload(admin, Buffer.from("just text"), "menu.xlsx");
    expect(notZip.status).toBe(400);

    const big = Buffer.concat([FIXTURE, Buffer.alloc(6 * 1024 * 1024)]);
    const tooLarge = await upload(admin, big);
    expect(tooLarge.status).toBe(413);
    expect((tooLarge.body as { error: { code: string } }).error.code).toBe(
      "PAYLOAD_TOO_LARGE",
    );
    expect(JSON.stringify(tooLarge.body)).not.toContain("LIMIT_FILE_SIZE");
  });

  it("a zip that is not a workbook does not leak parser text", async () => {
    const admin = await loginAs(app, "admin.t");
    const zipHeaderOnly = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.alloc(200),
    ]);
    const res = await upload(admin, zipHeaderOnly);
    expect(res.status).toBe(422);
    expect((res.body as { error: { message: string } }).error.message).toBe(
      "This file could not be read as an Excel workbook.",
    );
  });

  it("no file is a field error", async () => {
    const admin = await loginAs(app, "admin.t");
    const res = await admin.post("/api/menu/imports/preview");
    expect(res.status).toBe(400);
  });

  it("Teacher and Parent cannot upload", async () => {
    const teacher = await loginAs(app, "teacher.a");
    expect((await upload(teacher, FIXTURE)).status).toBe(403);
    const parent = await loginAs(app, "parent.a");
    expect((await upload(parent, FIXTURE)).status).toBe(403);
  });
});

describe("confirm", () => {
  it("saves every batch and day; history lists them", async () => {
    const admin = await importFixture();
    expect(await prisma.menuBatch.count()).toBe(2);
    expect(await prisma.menuDay.count()).toBe(84);

    const history = await admin.get("/api/menu/batches");
    expect(history.status).toBe(200);
    const rows = (
      history.body as {
        data: { prNo: string; days: number; periodStart: string }[];
      }
    ).data;
    expect(rows.map((row) => row.prNo).sort()).toEqual([
      "SF-2026-003",
      "SF-2026-004",
    ]);
    expect(rows[0]?.days).toBe(42);
  });

  it("a used token cannot confirm again", async () => {
    const admin = await loginAs(app, "admin.t");
    const preview = await upload(admin, FIXTURE);
    const token = (preview.body as Preview).data.token;
    const first = await admin.post("/api/menu/imports/confirm").send({ token });
    expect(first.status).toBe(201);
    const second = await admin
      .post("/api/menu/imports/confirm")
      .send({ token });
    expect(second.status).toBe(409);
    expect(await prisma.menuDay.count()).toBe(84);
  });

  it("an expired or unknown token is refused", async () => {
    const admin = await loginAs(app, "admin.t");
    const preview = await upload(admin, FIXTURE);
    const token = (preview.body as Preview).data.token;
    clock = new Date(clock.getTime() + 31 * 60_000);
    const expired = await admin
      .post("/api/menu/imports/confirm")
      .send({ token });
    expect(expired.status).toBe(409);
    const unknown = await admin
      .post("/api/menu/imports/confirm")
      .send({ token: "nope" });
    expect(unknown.status).toBe(409);
    expect(await prisma.menuDay.count()).toBe(0);
  });

  it("the same file again shows the overlap and cannot be confirmed (S3 cut)", async () => {
    const admin = await importFixture();
    const again = await upload(admin, FIXTURE);
    const data = (again.body as Preview).data;
    expect(data.overlaps.length).toBe(84);
    expect(data.token).toBe(null);
    expect(await prisma.menuDay.count()).toBe(84);
  });

  it("an overlap that appears after the preview rolls everything back", async () => {
    const admin = await loginAs(app, "admin.t");
    const preview = await upload(admin, FIXTURE);
    const token = (preview.body as Preview).data.token;

    // Someone else imported one of those dates in the meantime.
    const user = await prisma.user.findUniqueOrThrow({
      where: { username: "admin.t" },
    });
    const batch = await prisma.menuBatch.create({
      data: {
        sheetName: "Other",
        fileName: "other.xlsx",
        prNo: "SF-2026-999",
        prDate: new Date("2026-09-01T00:00:00Z"),
        periodStart: new Date("2026-12-09T00:00:00Z"),
        periodEnd: new Date("2026-12-09T00:00:00Z"),
        uploadedBy: user.id,
      },
    });
    await prisma.menuDay.create({
      data: {
        batchId: batch.id,
        feedingDate: new Date("2026-12-09T00:00:00Z"),
        dayNo: 1,
        dayName: "WEDNESDAY",
        menuName: "OTHER",
      },
    });

    const res = await admin.post("/api/menu/imports/confirm").send({ token });
    expect(res.status).toBe(409);
    expect(await prisma.menuBatch.count()).toBe(1);
    expect(await prisma.menuDay.count()).toBe(1);
  });

  it("a body without a token is a field error", async () => {
    const admin = await loginAs(app, "admin.t");
    expect(
      (await admin.post("/api/menu/imports/confirm").send({})).status,
    ).toBe(400);
  });
});

describe("GET /api/calendar", () => {
  type CalendarDay = {
    date: string;
    dayNo: number;
    dayName: string;
    menuName: string;
    prNo: string;
    prDate: string;
  };

  it("Admin and Teacher see the same menus; a month boundary is exact", async () => {
    const admin = await importFixture();
    const teacher = await loginAs(app, "teacher.a");
    const url = "/api/calendar?from=2026-10-28&to=2026-10-29";
    const forAdmin = await admin.get(url);
    const forTeacher = await teacher.get(url);
    expect(forAdmin.status).toBe(200);
    expect(forTeacher.body).toEqual(forAdmin.body);
    const days = (forAdmin.body as { data: CalendarDay[] }).data;
    expect(days.map((item) => [item.date, item.prNo])).toEqual([
      ["2026-10-28", "SF-2026-003"],
      ["2026-10-29", "SF-2026-004"],
    ]);

    const boundary = await admin.get(
      "/api/calendar?from=2026-10-31&to=2026-11-01",
    );
    expect(
      (boundary.body as { data: CalendarDay[] }).data.map((item) => item.date),
    ).toEqual(["2026-10-31", "2026-11-01"]);
  });

  it("first and last day of the import", async () => {
    const admin = await importFixture();
    const first = await admin.get(
      "/api/calendar?from=2026-09-17&to=2026-09-17",
    );
    expect((first.body as { data: CalendarDay[] }).data[0]?.menuName).toBe(
      "EGG CALDERETA",
    );
    expect((first.body as { data: CalendarDay[] }).data[0]?.prDate).toBe(
      "2026-09-11",
    );
    const last = await admin.get("/api/calendar?from=2026-12-09&to=2026-12-31");
    expect(
      (last.body as { data: CalendarDay[] }).data.map((item) => item.menuName),
    ).toEqual(["SINIGANG NA BABOY"]);
  });

  it("validates the range: at most 62 days, from before to, real dates", async () => {
    const admin = await loginAs(app, "admin.t");
    expect(
      (await admin.get("/api/calendar?from=2026-01-01&to=2026-03-04")).status,
    ).toBe(200);
    expect(
      (await admin.get("/api/calendar?from=2026-01-01&to=2026-03-05")).status,
    ).toBe(400);
    expect(
      (await admin.get("/api/calendar?from=2026-02-01&to=2026-01-01")).status,
    ).toBe(400);
    expect(
      (await admin.get("/api/calendar?from=nope&to=2026-01-01")).status,
    ).toBe(400);
    expect((await admin.get("/api/calendar")).status).toBe(400);
  });

  it("a Parent gets 403 here (the Parent schedule is its own endpoint in S4)", async () => {
    const parent = await loginAs(app, "parent.a");
    expect(
      (await parent.get("/api/calendar?from=2026-11-01&to=2026-11-30")).status,
    ).toBe(403);
  });
});
