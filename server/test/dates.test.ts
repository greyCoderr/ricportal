import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  mondayOf,
  monthRange,
  weekdayName,
  ageBucket,
  computeAge,
  isCalendarDate,
  manilaToday,
} from "@ricportal/shared";

describe("computeAge (BR-01)", () => {
  it.each([
    ["birthday today", "2022-11-06", "2026-11-06", 4],
    ["the day before the birthday", "2022-11-07", "2026-11-06", 3],
    ["the day after the birthday", "2022-11-05", "2026-11-06", 4],
    ["born today", "2026-11-06", "2026-11-06", 0],
    ["year end, birthday 31 December", "2022-12-31", "2026-12-31", 4],
    ["new year's day, birthday 31 December", "2022-12-31", "2027-01-01", 4],
    ["year end, birthday 1 January", "2023-01-01", "2026-12-31", 3],
    [
      "29 February, on 28 February of a common year",
      "2020-02-29",
      "2023-02-28",
      2,
    ],
    ["29 February, on 1 March of a common year", "2020-02-29", "2023-03-01", 3],
    ["29 February, in a leap year", "2020-02-29", "2024-02-29", 4],
  ])("%s", (_name, birthdate, today, expected) => {
    expect(computeAge(birthdate, today)).toBe(expected);
  });

  it("a future birthdate has no age", () => {
    expect(computeAge("2026-11-07", "2026-11-06")).toBe(null);
  });
});

describe("ageBucket (A-04)", () => {
  it.each([
    [1, "Other"],
    [2, "2"],
    [3, "3"],
    [4, "4"],
    [5, "Other"],
  ] as const)("%i is %s", (age, bucket) => {
    expect(ageBucket(age)).toBe(bucket);
  });
});

describe("calendar days", () => {
  it("accepts real days only", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDate("2023-02-29")).toBe(false);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("11/06/2026")).toBe(false);
  });

  it("today follows Asia/Manila, not the machine", () => {
    // 16:30 UTC is already 00:30 the next day in the Philippines.
    expect(manilaToday(new Date("2026-11-06T16:30:00Z"))).toBe("2026-11-07");
    expect(manilaToday(new Date("2026-11-06T15:59:00Z"))).toBe("2026-11-06");
  });
});

describe("day arithmetic", () => {
  it("adds days across a month, a year and a leap day", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("names the weekday from the written day", () => {
    expect(weekdayName("2026-09-17")).toBe("Thursday");
    expect(weekdayName("2026-12-09")).toBe("Wednesday");
  });

  it("finds the Monday of a week (weeks run Monday to Sunday)", () => {
    expect(mondayOf("2026-11-09")).toBe("2026-11-09");
    expect(mondayOf("2026-11-15")).toBe("2026-11-09");
    expect(mondayOf("2026-11-08")).toBe("2026-11-02");
  });

  it("counts the days between two days", () => {
    expect(daysBetween("2026-01-01", "2026-03-04")).toBe(62);
  });
});

describe("monthRange (A-11)", () => {
  it.each([
    ["2026-11-06", "2026-11-01", "2026-11-30"],
    ["2026-12-31", "2026-12-01", "2026-12-31"],
    ["2024-02-10", "2024-02-01", "2024-02-29"],
    ["2026-02-10", "2026-02-01", "2026-02-28"],
  ])("%s", (day, from, to) => {
    expect(monthRange(day)).toEqual({ from, to });
  });
});
