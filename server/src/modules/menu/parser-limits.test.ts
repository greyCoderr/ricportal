import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseMenuWorkbook } from "./parser.js";

// AUD-007 (docs/AUDIT_REPORT.md): values that do not fit the database columns
// are reported in the preview, so confirm can no longer fail with a 500.

type Row = (string | number | Date | null)[];

async function workbook(rows: Row[]): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("NOV");
  for (const row of rows) {
    sheet.addRow(row);
  }
  return Buffer.from(await book.xlsx.writeBuffer());
}

const day = (date: string) => new Date(`${date}T00:00:00Z`);

function file(options: {
  prLine?: string;
  dayNo?: number;
  dayName?: string;
  menu?: string;
}): Promise<Buffer> {
  return workbook([
    [
      options.prLine ?? "PR # SF - 2026-009",
      null,
      null,
      "PR DATE : 10/30/2026",
    ],
    ["No. of Days", "DATE", "Days", "MENU"],
    [
      options.dayNo ?? 1,
      day("2026-11-02"),
      options.dayName ?? "Monday",
      options.menu ?? "EGG CALDERETA",
    ],
  ]);
}

describe("menu file values that do not fit (AUD-007)", () => {
  it("a normal file has no errors", async () => {
    const result = await parseMenuWorkbook(await file({}));
    expect(result.errors).toEqual([]);
    expect(result.batches[0]?.days).toHaveLength(1);
  });

  it("a menu of more than 200 characters is an error", async () => {
    const result = await parseMenuWorkbook(
      await file({ menu: "M".repeat(201) }),
    );
    expect(result.errors).toEqual([
      "Sheet NOV, row 3: the menu is longer than 200 characters.",
    ]);
  });

  it("a menu of exactly 200 characters is accepted", async () => {
    const result = await parseMenuWorkbook(
      await file({ menu: "M".repeat(200) }),
    );
    expect(result.errors).toEqual([]);
  });

  it("a day name of more than 20 characters is an error", async () => {
    const result = await parseMenuWorkbook(
      await file({ dayName: "Monday".repeat(4) }),
    );
    expect(result.errors).toEqual([
      "Sheet NOV, row 3: the day name is longer than 20 characters.",
    ]);
  });

  it.each([1.5, 0, -2, 1000])(
    "a day number of %d is an error",
    async (dayNo) => {
      const result = await parseMenuWorkbook(await file({ dayNo }));
      expect(result.errors).toEqual([
        "Sheet NOV, row 3: the day number must be a whole number from 1 to 999.",
      ]);
    },
  );

  it("a PR number of more than 30 characters is an error", async () => {
    const result = await parseMenuWorkbook(
      await file({ prLine: `PR # SF - 2026-${"9".repeat(30)}` }),
    );
    expect(result.errors).toEqual([
      "Sheet NOV: the PR number is longer than 30 characters.",
    ]);
  });
});
