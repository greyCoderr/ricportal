import {
  formatNumericDate,
  maskNumericDate,
  parseNumericDate,
} from "@ricportal/shared";
import { describe, expect, it } from "vitest";
import { buildEnrollmentForm } from "../src/modules/pdf/enrollment-form.js";
import { formatFormDate } from "../src/modules/pdf/pdf.js";

// These work on strings, so the time zone must not matter (D7). The file also
// runs with TZ=UTC and TZ=Asia/Manila (docs/POLISH_LOG.md).
describe("parseNumericDate (D7)", () => {
  it.each([
    ["01/15/2023", "2023-01-15"],
    ["02/29/2024", "2024-02-29"],
    ["12/31/2026", "2026-12-31"],
    ["01/01/2027", "2027-01-01"],
    ["02/28/2023", "2023-02-28"],
  ])("%s is %s", (text, iso) => {
    expect(parseNumericDate(text)).toBe(iso);
  });

  it.each([
    ["02/30/2020", "no 30 February"],
    ["02/29/2023", "not a leap year"],
    ["02/29/1900", "1900 was not a leap year"],
    ["13/01/2026", "no month 13"],
    ["00/10/2026", "no month 0"],
    ["04/31/2026", "April has 30 days"],
    ["01/00/2026", "no day 0"],
    ["1/5/2026", "needs two digits"],
    ["2026-01-05", "not the API form"],
    ["01/05/26", "needs four digits"],
    ["", "blank"],
    ["abc", "letters"],
  ])("%s is refused: %s", (text) => {
    expect(parseNumericDate(text)).toBe(null);
  });
});

describe("formatNumericDate (D7)", () => {
  it.each([
    ["2024-02-29", "02/29/2024"],
    ["2026-12-31", "12/31/2026"],
    ["2027-01-01", "01/01/2027"],
    ["2026-01-05", "01/05/2026"],
  ])("%s is %s", (iso, text) => {
    expect(formatNumericDate(iso)).toBe(text);
  });

  it("does not shift a day at a year boundary", () => {
    expect(parseNumericDate(formatNumericDate("2026-12-31"))).toBe(
      "2026-12-31",
    );
    expect(parseNumericDate(formatNumericDate("2027-01-01"))).toBe(
      "2027-01-01",
    );
  });
});

describe("maskNumericDate", () => {
  it.each([
    ["", ""],
    ["1", "1"],
    ["12", "12"],
    ["123", "12/3"],
    ["1231", "12/31"],
    ["12312", "12/31/2"],
    ["12312026", "12/31/2026"],
    ["123120269999", "12/31/2026"],
    ["12/31/2026", "12/31/2026"],
    ["ab12cd", "12"],
  ])("%s becomes %s", (raw, masked) => {
    expect(maskNumericDate(raw)).toBe(masked);
  });
});

describe("the Enrollment Form PDF uses numeric dates", () => {
  const definition = buildEnrollmentForm({
    centerName: "Sibujo",
    barangay: "Sibujo",
    dateStarted: "2026-06-01",
    teacherName: "Ana Cruz",
    students: [
      {
        displayName: "Dela Cruz, Maria",
        gender: "F",
        birthdate: "2024-02-29",
        age: 2,
        weightKg: "14.50",
        heightCm: "96.5",
        parentGuardianName: "Rosa Dela Cruz",
      },
    ],
  });
  const text = JSON.stringify(definition.content);

  it("shows the birthdate and the date started as MM/DD/YYYY", () => {
    expect(text).toContain("02/29/2024");
    expect(text).toContain("06/01/2026");
    expect(text).not.toContain("2024-02-29");
    expect(text).not.toContain("2026-06-01");
  });

  it("the PDF helper is the one shared formatter", () => {
    expect(formatFormDate).toBe(formatNumericDate);
  });
});
