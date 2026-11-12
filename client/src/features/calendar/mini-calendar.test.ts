import { describe, expect, it } from "vitest";
import {
  monthGrid,
  monthHasMenu,
  monthTitle,
  shiftMonth,
  visibleMonth,
} from "./mini-calendar";

describe("monthGrid (Plan 4 playbook)", () => {
  it("always has six weeks of seven days, Sunday first", () => {
    const cells = monthGrid("2026-11");
    expect(cells).toHaveLength(42);
    expect(cells[0]?.date).toBe("2026-11-01");
    expect(cells[41]?.date).toBe("2026-12-12");
  });

  // One month starting on each weekday, Sunday (0) to Saturday (6).
  it.each([
    ["2026-11", 0, "2026-11-01"],
    ["2026-06", 1, "2026-05-31"],
    ["2026-09", 2, "2026-08-30"],
    ["2026-04", 3, "2026-03-29"],
    ["2026-10", 4, "2026-09-27"],
    ["2026-05", 5, "2026-04-26"],
    ["2026-08", 6, "2026-07-26"],
  ])("%s starts on weekday %i: the grid starts %s", (month, weekday, first) => {
    const cells = monthGrid(month);
    expect(cells[0]?.date).toBe(first);
    expect(cells[weekday]?.date).toBe(`${month}-01`);
    expect(cells[weekday]?.inMonth).toBe(true);
    expect(cells.slice(0, weekday).every((cell) => !cell.inMonth)).toBe(true);
  });

  it("February of a leap year has 29 days in the month", () => {
    const cells = monthGrid("2028-02");
    const inMonth = cells.filter((cell) => cell.inMonth);
    expect(inMonth).toHaveLength(29);
    expect(inMonth.at(-1)?.date).toBe("2028-02-29");
    expect(cells.find((cell) => cell.date === "2028-03-01")?.inMonth).toBe(
      false,
    );
  });

  it("February of a common year has 28", () => {
    expect(monthGrid("2026-02").filter((cell) => cell.inMonth)).toHaveLength(
      28,
    );
  });

  it("gives the day number for each cell", () => {
    const cells = monthGrid("2026-11");
    expect(cells.map((cell) => cell.day).slice(28, 32)).toEqual([29, 30, 1, 2]);
  });
});

describe("month helpers", () => {
  it("moves across years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("splits the title like Figma", () => {
    expect(monthTitle("2026-01")).toEqual({ month: "JANUARY", year: "2026" });
  });

  it("finds the month a six-week range shows", () => {
    expect(visibleMonth({ from: "2026-10-25", to: "2026-12-05" })).toBe(
      "2026-11",
    );
    expect(visibleMonth({ from: "2026-11-01", to: "2026-12-12" })).toBe(
      "2026-11",
    );
    expect(visibleMonth({ from: "2026-07-26", to: "2026-09-05" })).toBe(
      "2026-08",
    );
  });

  it("knows whether a month has a menu, ignoring the other months' days", () => {
    const days = [{ date: "2026-10-30" }, { date: "2026-12-01" }];
    expect(monthHasMenu(days, "2026-11")).toBe(false);
    expect(monthHasMenu([...days, { date: "2026-11-04" }], "2026-11")).toBe(
      true,
    );
  });
});
