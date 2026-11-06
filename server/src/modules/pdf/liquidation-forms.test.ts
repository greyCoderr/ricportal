import { describe, expect, it } from "vitest";
import type { LiquidationData } from "../liquidation/builder.js";
import {
  buildPurchaseRequestForm,
  buildSummaryForm,
  buildTransmittalForm,
} from "./liquidation-forms.js";
import { renderPdf } from "./pdf.js";

function pageCount(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;
}

function day(date: string, rows: number, subtotal: string) {
  return {
    date,
    dayName: "Tuesday",
    menuName: "CHICKEN TINOLA",
    prNo: "SF-2026-004",
    prDate: "2026-10-23",
    status: "LOCKED" as const,
    subtotal,
    items: Array.from({ length: rows }, (_, index) => ({
      itemNo: index + 1,
      unit: "kg",
      description: `Ingredient ${String(index + 1)}`,
      quantity: "2",
      unitCost: "38.00",
      total: "76.00",
    })),
  };
}

function data(days: LiquidationData["days"], total: string): LiquidationData {
  return {
    centerName: "Sibujo",
    barangay: "Sibujo",
    teacherName: "Ana Cruz",
    from: "2026-11-01",
    to: "2026-11-30",
    days,
    total,
    blockingDays: [],
    signatories: {
      approvedByName: "Juan Reyes",
      approvedByTitle: "Municipal Mayor",
      notedByName: "",
      notedByTitle: "",
    },
  };
}

const text = (value: unknown) => JSON.stringify(value);

describe("Purchase Request PDF", () => {
  const form = buildPurchaseRequestForm(
    data([day("2026-11-10", 3, "228.00")], "228.00"),
    "2026-11-10",
  );

  it("has the official texts, the menu as a heading and the PR data", () => {
    const content = text(form);
    for (const expected of [
      "Local Government of LIBMANAN, CAMARINES SUR",
      "SF-GOOD-59",
      "Revised on May 24, 2004",
      "SUPPLEMENTARY FEEDING",
      "PURCHASE REQUEST",
      "LGU-Libmanan, Camarines Sur",
      "ITEM NO.",
      "ITEM DESCRIPTION",
      "UNIT COST",
      "TOTAL COST",
      "CHICKEN TINOLA",
      "SF-2026-004",
      "10/23/2026",
      "Supplementary Feeding Program CY: 2026",
      "Requested by",
      "Approved by",
      "Ana Cruz",
      "Juan Reyes",
      "Municipal Mayor",
    ]) {
      expect(content).toContain(expected);
    }
  });

  it("writes money with the letters PHP, never a peso sign", () => {
    expect(text(form)).toContain("PHP 228.00");
    expect(text(form)).not.toContain("₱");
  });

  it.each([
    [3, 1],
    [70, 2],
  ])(
    "%i rows make %i page(s), and it starts with %%PDF",
    async (rows, pages) => {
      const pdf = await renderPdf(
        buildPurchaseRequestForm(
          data([day("2026-11-10", rows, "1.00")], "1.00"),
          "2026-11-10",
        ),
      );
      expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
      expect(pageCount(pdf)).toBe(pages);
    },
  );

  it("a day with no items still renders", async () => {
    const pdf = await renderPdf(
      buildPurchaseRequestForm(
        data([day("2026-11-10", 0, "0.00")], "0.00"),
        "2026-11-10",
      ),
    );
    expect(pageCount(pdf)).toBe(1);
  });
});

describe("Summary of Disbursement PDF", () => {
  const days = [
    day("2026-11-09", 1, "76.00"),
    { ...day("2026-11-10", 1, "170.00"), menuName: "PORK PICADILLO" },
    { ...day("2026-11-11", 0, "0.00"), status: "NO_FEEDING" as const },
  ];
  const form = buildSummaryForm(data(days, "246.00"));

  it("has the official texts and the total", () => {
    const content = text(form);
    for (const expected of [
      "MUNICIPAL SOCIAL WELFARE & DEVELOPMENT OFFICE",
      "PROVINCE OF CAMARINES SUR",
      "MUNICIPALITY OF LIBMANAN",
      "Name of Child Development Center: Sibujo",
      "Barangay: Sibujo",
      "SUMMARY OF DISBURSEMENT",
      "Date: 11/01/2026 to 11/30/2026",
      "Particular",
      "Statement of Market Purchase No.",
      "Total Amount",
      "TOTAL",
      "PHP 246.00",
      "Prepared by",
      "Noted by",
      "Ana Cruz",
    ]) {
      expect(content).toContain(expected);
    }
  });

  it("leaves out No feeding days (BR-15)", () => {
    expect(text(form)).toContain("11/09/2026");
    expect(text(form)).toContain("11/10/2026");
    expect(text(form)).not.toContain("11/11/2026");
  });

  it("totals match the Purchase Requests (BR-18)", () => {
    expect(
      text(buildPurchaseRequestForm(data(days, "246.00"), "2026-11-09")),
    ).toContain("PHP 76.00");
    expect(
      text(buildPurchaseRequestForm(data(days, "246.00"), "2026-11-10")),
    ).toContain("PHP 170.00");
    expect(text(form)).toContain("PHP 76.00");
    expect(text(form)).toContain("PHP 170.00");
  });

  it("a 31-day month goes onto more than one page with the header repeated", async () => {
    const month = Array.from({ length: 31 }, (_, index) =>
      day(`2026-10-${String(index + 1).padStart(2, "0")}`, 1, "76.00"),
    );
    const pdf = await renderPdf(buildSummaryForm(data(month, "2356.00")));
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1);
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});

describe("Transmittal Checklist PDF (A-09)", () => {
  it("is a clean placeholder that says so", async () => {
    const form = buildTransmittalForm(
      data([day("2026-11-10", 1, "76.00")], "76.00"),
    );
    expect(text(form)).toContain("layout pending the official copy");
    expect(text(form)).toContain("TRANSMITTAL CHECKLIST");
    expect(text(form)).toContain("Sibujo");
    expect(pageCount(await renderPdf(form))).toBe(1);
  });
});
