import ExcelJS from "exceljs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Stage J1d, docs/AUDIT_REPORT.md.

type ErrorBody = { error: { code: string; message: string } };

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  await seedWorld(prisma);
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
});

describe("menu file with a name that is too long (AUD-007)", () => {
  it("is refused at upload with 400, not at confirm with 500", async () => {
    const book = new ExcelJS.Workbook();
    book.addWorksheet("Sheet1").addRow(["x"]);
    const buffer = Buffer.from(await book.xlsx.writeBuffer());
    const admin = await loginAs(app, "admin.t");
    const res = await admin
      .post("/api/menu/imports/preview")
      .attach("file", buffer, `${"a".repeat(260)}.xlsx`);
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.code).toBe("VALIDATION_ERROR");
  });
});
