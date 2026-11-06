import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { afterAll, describe, expect, it } from "vitest";
import { parseMenuWorkbook } from "./parser.js";

const FIXTURE = fileURLToPath(
  new URL("../../../test/fixtures/SF_MENU_for_30_days.xlsx", import.meta.url),
);

type Row = (string | number | Date | null)[];

async function workbook(sheets: Record<string, Row[]>): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const sheet = book.addWorksheet(name);
    for (const row of rows) {
      sheet.addRow(row);
    }
  }
  return Buffer.from(await book.xlsx.writeBuffer());
}

const HEAD: Row[] = [
  [],
  ["SUPPLEMENTARY FEEDING PROGRAM"],
  ["HOTMEAL MENU for 30 days Consumption"],
  ["Date : NOVEMBER 2 to 4, 2026"],
  ["PR # SF - 2026-009", null, null, "PR DATE : 10/30/2026"],
  ["No. of Days", "DATE", "Days", "MENU"],
];
const day = (date: string) => new Date(`${date}T00:00:00Z`);

describe("the real DSWD file", () => {
  const originalTz = process.env.TZ;
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  describe.each(["UTC", "Asia/Manila"])("with TZ=%s", (tz) => {
    it("gives 2 batches of 42 days with the right dates and PR data", async () => {
      process.env.TZ = tz;
      const result = await parseMenuWorkbook(readFileSync(FIXTURE));

      expect(result.errors).toEqual([]);
      expect(result.batches.length).toBe(2);
      const [first, second] = result.batches;
      expect(first?.days.length).toBe(42);
      expect(second?.days.length).toBe(42);

      expect(first?.prNo).toBe("SF-2026-003");
      expect(first?.prDate).toBe("2026-09-11");
      expect(first?.periodStart).toBe("2026-09-17");
      expect(first?.periodEnd).toBe("2026-10-28");
      expect(first?.days[0]).toEqual({
        feedingDate: "2026-09-17",
        dayNo: 1,
        dayName: expect.any(String) as string,
        menuName: "EGG CALDERETA",
      });

      expect(second?.prNo).toBe("SF-2026-004");
      expect(second?.prDate).toBe("2026-10-23");
      expect(second?.periodStart).toBe("2026-10-29");
      expect(second?.days.at(-1)?.feedingDate).toBe("2026-12-09");
      expect(second?.days.at(-1)?.menuName).toBe("SINIGANG NA BABOY");
    });
  });

  it("ignores the duplicate right-hand block: all dates are unique", async () => {
    const result = await parseMenuWorkbook(readFileSync(FIXTURE));
    const dates = result.batches.flatMap((batch) =>
      batch.days.map((item) => item.feedingDate),
    );
    expect(new Set(dates).size).toBe(84);
  });
});

describe("parser rules", () => {
  it("reads date cells, serials and mm/dd/yyyy text, and normalizes menus", async () => {
    const buffer = await workbook({
      Sheet1: [
        ...HEAD,
        [1, day("2026-11-02"), "MONDAY", "  PORK   PICADILLO "],
        [2, 46329, "Tuesday", "CHICKEN TINOLA"],
        [
          3,
          "11/04/2026",
          "wednesday",
          "SAUTEED MUNGBEAN WITH MALUNGGAY LEAVES & CHICKEN",
        ],
      ],
    });
    const result = await parseMenuWorkbook(buffer);
    expect(result.errors).toEqual([]);
    const batch = result.batches[0];
    expect(batch?.prNo).toBe("SF-2026-009");
    expect(batch?.prDate).toBe("2026-10-30");
    expect(batch?.days.map((item) => item.feedingDate)).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
    ]);
    expect(batch?.days[0]?.menuName).toBe("PORK PICADILLO");
    expect(batch?.days[2]?.menuName).toContain("& CHICKEN");
    expect(batch?.warnings).toEqual([]);
  });

  it("stops at the first empty date", async () => {
    const buffer = await workbook({
      Sheet1: [
        ...HEAD,
        [1, day("2026-11-02"), "MONDAY", "PORK PICADILLO"],
        [2, null, null, null],
        [3, day("2026-11-04"), "WEDNESDAY", "CHICKEN TINOLA"],
      ],
    });
    const result = await parseMenuWorkbook(buffer);
    expect(result.batches[0]?.days.length).toBe(1);
  });

  it("uses only the left-most pair of columns", async () => {
    const buffer = await workbook({
      Sheet1: [
        [],
        ["PR # SF - 2026-009", null, null, "PR DATE : 10/30/2026"],
        [
          "No. of Days",
          "DATE",
          "Days",
          "MENU",
          null,
          "No. of Days",
          "DATE",
          "Days",
          "MENU",
        ],
        [
          1,
          day("2026-11-02"),
          "MONDAY",
          "LEFT MENU",
          null,
          1,
          day("2026-11-02"),
          "MONDAY",
          "RIGHT MENU",
        ],
      ],
    });
    const result = await parseMenuWorkbook(buffer);
    expect(result.batches[0]?.days[0]?.menuName).toBe("LEFT MENU");
  });

  it("a sheet without a header is skipped with a warning", async () => {
    const buffer = await workbook({
      Notes: [["Nothing useful here"]],
      Sheet1: [...HEAD, [1, day("2026-11-02"), "MONDAY", "PORK PICADILLO"]],
    });
    const result = await parseMenuWorkbook(buffer);
    expect(result.batches.length).toBe(1);
    expect(result.warnings.join(" ")).toContain("Notes");
  });

  it("no usable sheet at all is an error", async () => {
    const result = await parseMenuWorkbook(
      await workbook({ Notes: [["Nothing useful here"]] }),
    );
    expect(result.batches).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("validation", () => {
  it("text that is not a date is an error naming the sheet and row", async () => {
    const result = await parseMenuWorkbook(
      await workbook({
        Sheet1: [...HEAD, [1, "next Monday", "MONDAY", "PORK PICADILLO"]],
      }),
    );
    expect(result.errors.join(" ")).toContain("Sheet1");
    expect(result.errors.join(" ")).toContain("row 7");
  });

  it("duplicate dates are errors, inside a sheet and across sheets", async () => {
    const inside = await parseMenuWorkbook(
      await workbook({
        Sheet1: [
          ...HEAD,
          [1, day("2026-11-02"), "MONDAY", "PORK PICADILLO"],
          [2, day("2026-11-02"), "MONDAY", "CHICKEN TINOLA"],
        ],
      }),
    );
    expect(inside.errors.join(" ")).toContain("2026-11-02");

    const across = await parseMenuWorkbook(
      await workbook({
        Sheet1: [...HEAD, [1, day("2026-11-02"), "MONDAY", "PORK PICADILLO"]],
        Sheet2: [...HEAD, [1, day("2026-11-02"), "MONDAY", "CHICKEN TINOLA"]],
      }),
    );
    expect(across.errors.join(" ")).toContain("2026-11-02");
  });

  it("a missing PR number is an error; a missing menu is an error", async () => {
    const result = await parseMenuWorkbook(
      await workbook({
        Sheet1: [
          [],
          ["No. of Days", "DATE", "Days", "MENU"],
          [1, day("2026-11-02"), "MONDAY", null],
        ],
      }),
    );
    const text = result.errors.join(" ");
    expect(text).toContain("PR");
    expect(text).toContain("menu");
  });

  it("warns for a wrong weekday, broken day numbers and a gap in dates", async () => {
    const result = await parseMenuWorkbook(
      await workbook({
        Sheet1: [
          ...HEAD,
          [1, day("2026-11-02"), "TUESDAY", "PORK PICADILLO"],
          [3, day("2026-11-03"), "TUESDAY", "CHICKEN TINOLA"],
          [4, day("2026-11-06"), "FRIDAY", "EGG CALDERETA"],
        ],
      }),
    );
    expect(result.errors).toEqual([]);
    const warnings = result.batches[0]?.warnings.join(" ") ?? "";
    expect(warnings).toContain("TUESDAY");
    expect(warnings).toContain("day number");
    expect(warnings).toContain("gap");
  });

  it("more than 100 days in a sheet is an error", async () => {
    const rows: Row[] = [...HEAD];
    for (let i = 0; i < 101; i += 1) {
      rows.push([
        i + 1,
        new Date(Date.UTC(2026, 0, 1 + i)),
        "",
        "PORK PICADILLO",
      ]);
    }
    const result = await parseMenuWorkbook(await workbook({ Sheet1: rows }));
    expect(result.errors.join(" ")).toContain("100");
  });
});
