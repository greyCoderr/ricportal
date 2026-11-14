import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  expectNoSecrets,
  loginAs,
  seedStudents,
  seedWorld,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Round 4, I2 (D9): GET /api/auth/profile/teacher-summary.

const NOW = new Date("2026-11-15T04:00:00Z");

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

type Summary = {
  teacherCode: string;
  centerName: string | null;
  createdAt: string;
  counts: {
    enrolledStudents: number;
    submittedReports: number;
    pendingReports: number;
    returnedReports: number;
  };
  reports: {
    id: number;
    code: string;
    type: string;
    submittedAt: string;
    status: string;
  }[];
  activity: { at: string; reportCode: string; text: string }[];
};

type Meta = { page: number; pageSize: number; total: number };

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

async function addReport(input: {
  teacherId: number;
  centerId: number;
  type?: "LIQUIDATION" | "ENROLLMENT";
  status?: "SUBMITTED" | "NEED_REVISION" | "APPROVED";
  submittedAt?: string;
}) {
  return prisma.report.create({
    data: {
      centerId: input.centerId,
      teacherId: input.teacherId,
      type: input.type ?? "LIQUIDATION",
      status: input.status ?? "SUBMITTED",
      periodStart: new Date("2026-11-01T00:00:00Z"),
      periodEnd: new Date("2026-11-30T00:00:00Z"),
      submittedAt: new Date(input.submittedAt ?? "2026-11-03T01:30:00Z"),
    },
  });
}

async function summaryOf(username: string, query = "") {
  const agent = await loginAs(app, username);
  const res = await agent.get(`/api/auth/profile/teacher-summary${query}`);
  return {
    status: res.status,
    data: (res.body as { data: Summary }).data,
    meta: (res.body as { meta: Meta }).meta,
    body: res.body as unknown,
  };
}

function padded(id: number) {
  return String(id).padStart(3, "0");
}

describe("D9 data: no new migration is needed", () => {
  it("users.qualification exists from an additive migration and is nullable", () => {
    const dir = fileURLToPath(
      new URL("../../prisma/migrations", import.meta.url),
    );
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) =>
        readFileSync(`${dir}/${name}/migration.sql`, "utf8").includes(
          "`qualification`",
        ),
      );
    expect(folders).toHaveLength(1);
    const sql = readFileSync(
      `${dir}/${String(folders[0])}/migration.sql`,
      "utf8",
    );
    const users = sql.slice(sql.indexOf("ALTER TABLE `users`"));
    expect(users).toMatch(/ADD COLUMN `qualification` VARCHAR\(160\) NULL/);
    expect(users).not.toMatch(/\bDROP\b|\bRENAME\b|\bMODIFY\b|\bCHANGE\b/i);
    // Round 4 adds no migration (DEC-052).
    expect(readdirSync(dir).filter((name) => name.includes("polish4"))).toEqual(
      [],
    );
  });
});

describe("GET /api/auth/profile/teacher-summary (D9)", () => {
  it("is for Teachers only", async () => {
    for (const username of ["admin.t", "parent.a"]) {
      expect((await summaryOf(username)).status).toBe(403);
    }
  });

  it("gives the display codes, the barangay and the registration date", async () => {
    const report = await addReport({
      teacherId: world.teacherA.id,
      centerId: world.centerA.id,
    });
    const { status, data, body } = await summaryOf("teacher.a");
    expect(status).toBe(200);
    const year = String(
      (
        await prisma.user.findUniqueOrThrow({
          where: { id: world.teacherA.id },
        })
      ).createdAt.getUTCFullYear(),
    );
    expect(data.teacherCode).toBe(`RIC-${year}-${padded(world.teacherA.id)}`);
    expect(data.centerName).toBe("Center A");
    expect(data.reports[0]?.code).toBe(`2026-${padded(report.id)}`);
    expectNoSecrets(body);
  });

  it("counts match the database and only the teacher's own reports", async () => {
    await seedStudents(prisma, world.centerA.id, 3);
    await seedStudents(prisma, world.centerA.id, 1, {
      status: "ARCHIVED",
      prefix: "Old",
    });
    await seedStudents(prisma, world.centerB.id, 4, { prefix: "Other" });
    const a = { teacherId: world.teacherA.id, centerId: world.centerA.id };
    await addReport({ ...a, status: "SUBMITTED" });
    await addReport({ ...a, status: "SUBMITTED" });
    await addReport({ ...a, status: "NEED_REVISION" });
    await addReport({ ...a, status: "APPROVED" });
    await addReport({ ...a, type: "ENROLLMENT" });
    await addReport({
      teacherId: world.teacherB.id,
      centerId: world.centerB.id,
    });
    const { data, meta } = await summaryOf("teacher.a");
    expect(data.counts).toEqual({
      enrolledStudents: 3,
      submittedReports: 4,
      pendingReports: 2,
      returnedReports: 1,
    });
    expect(meta.total).toBe(4);
    expect(data.reports.every((row) => row.type === "LIQUIDATION")).toBe(true);
  });

  it("never shows another teacher's reports or activity", async () => {
    const other = await addReport({
      teacherId: world.teacherB.id,
      centerId: world.centerB.id,
    });
    const { data } = await summaryOf("teacher.a");
    expect(data.reports).toEqual([]);
    expect(data.activity).toEqual([]);
    const b = await summaryOf("teacher.b");
    expect(b.data.reports.map((row) => row.id)).toEqual([other.id]);
  });

  it("pages the reports on the server, newest first, 5 by default", async () => {
    const ids: number[] = [];
    for (let day = 1; day <= 7; day += 1) {
      const report = await addReport({
        teacherId: world.teacherA.id,
        centerId: world.centerA.id,
        submittedAt: `2026-11-0${String(day)}T01:00:00Z`,
      });
      ids.push(report.id);
    }
    const first = await summaryOf("teacher.a");
    expect(first.meta).toEqual({ page: 1, pageSize: 5, total: 7 });
    expect(first.data.reports.map((row) => row.id)).toEqual(
      [...ids].reverse().slice(0, 5),
    );
    const second = await summaryOf("teacher.a", "?page=2");
    expect(second.meta).toEqual({ page: 2, pageSize: 5, total: 7 });
    expect(second.data.reports.map((row) => row.id)).toEqual(
      [...ids].reverse().slice(5),
    );
  });

  it("refuses a bad page or page size", async () => {
    for (const query of ["?page=0", "?pageSize=51", "?page=x"]) {
      expect((await summaryOf("teacher.a", query)).status).toBe(400);
    }
  });

  it("builds the activity from versions and reviews, newest first, with the plan's texts", async () => {
    const report = await addReport({
      teacherId: world.teacherA.id,
      centerId: world.centerA.id,
      status: "APPROVED",
    });
    await prisma.liquidationSnapshot.createMany({
      data: [
        {
          reportId: report.id,
          versionNo: 1,
          payload: {},
          createdAt: new Date("2026-11-03T01:30:00Z"),
        },
        {
          reportId: report.id,
          versionNo: 2,
          payload: {},
          createdAt: new Date("2026-11-05T02:00:00Z"),
        },
      ],
    });
    await prisma.reportReview.createMany({
      data: [
        {
          reportId: report.id,
          versionNo: 1,
          reviewerId: world.admin.id,
          decision: "NEED_REVISION",
          feedback: "Fix the rice.",
          createdAt: new Date("2026-11-04T03:00:00Z"),
        },
        {
          reportId: report.id,
          versionNo: 2,
          reviewerId: world.admin.id,
          decision: "APPROVED",
          createdAt: new Date("2026-11-06T08:30:00Z"),
        },
      ],
    });
    const { data } = await summaryOf("teacher.a");
    const code = `2026-${padded(report.id)}`;
    expect(data.activity).toEqual([
      {
        at: "2026-11-06T08:30:00.000Z",
        reportCode: code,
        text: "Admin approved the report.",
      },
      {
        at: "2026-11-05T02:00:00.000Z",
        reportCode: code,
        text: "Report resubmitted.",
      },
      {
        at: "2026-11-04T03:00:00.000Z",
        reportCode: code,
        text: "Returned for revision.",
      },
      {
        at: "2026-11-03T01:30:00.000Z",
        reportCode: code,
        text: "Report submitted.",
      },
    ]);
  });

  it("a report without a saved version still shows its submission", async () => {
    const report = await addReport({
      teacherId: world.teacherA.id,
      centerId: world.centerA.id,
      submittedAt: "2026-11-02T00:15:00Z",
    });
    const { data } = await summaryOf("teacher.a");
    expect(data.activity).toEqual([
      {
        at: "2026-11-02T00:15:00.000Z",
        reportCode: `2026-${padded(report.id)}`,
        text: "Report submitted.",
      },
    ]);
  });

  it("keeps the latest 10 activity entries", async () => {
    for (let day = 1; day <= 12; day += 1) {
      await addReport({
        teacherId: world.teacherA.id,
        centerId: world.centerA.id,
        submittedAt: `2026-11-${String(day).padStart(2, "0")}T01:00:00Z`,
      });
    }
    const { data } = await summaryOf("teacher.a");
    expect(data.activity).toHaveLength(10);
    expect(data.activity[0]?.at).toBe("2026-11-12T01:00:00.000Z");
  });

  it("Qualification is edited through PATCH /api/auth/profile and validated", async () => {
    const agent = await loginAs(app, "teacher.a");
    const saved = await agent.patch("/api/auth/profile").send({
      fullName: "Ana Cruz",
      qualification: "  Bachelor of Elementary Education ",
    });
    expect(saved.status).toBe(200);
    expect(
      (saved.body as { data: { qualification: string } }).data.qualification,
    ).toBe("Bachelor of Elementary Education");
    const tooLong = await agent.patch("/api/auth/profile").send({
      fullName: "Ana Cruz",
      qualification: "x".repeat(161),
    });
    expect(tooLong.status).toBe(400);
  });
});
