import { describe, expect, it } from "vitest";
import { reportDisplayCode, teacherDisplayCode } from "./display-codes.js";

describe("display codes (Plan 4 D9)", () => {
  it("Teacher ID is RIC-{year}-{id padded to 3}", () => {
    expect(teacherDisplayCode(7, new Date("2025-03-01T02:00:00Z"))).toBe(
      "RIC-2025-007",
    );
    expect(teacherDisplayCode(1234, new Date("2026-06-01T02:00:00Z"))).toBe(
      "RIC-2026-1234",
    );
  });

  it("Report ID is {year}-{id padded to 3}", () => {
    expect(reportDisplayCode(5, new Date("2025-06-02T00:30:00Z"))).toBe(
      "2025-005",
    );
  });

  it("uses the Manila year, not the UTC year", () => {
    // 01/01/2026 07:00 in Manila is still 2025 in UTC.
    const instant = new Date("2025-12-31T23:00:00Z");
    expect(teacherDisplayCode(3, instant)).toBe("RIC-2026-003");
    expect(reportDisplayCode(3, instant)).toBe("2026-003");
  });
});
