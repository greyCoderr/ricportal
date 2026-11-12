import { addDays, weekdayIndex } from "@ricportal/shared";
import type { DayRange } from "./hooks";

// The small month of the dashboards (Plan 4 D2). Pure functions on written
// days ("YYYY-MM-DD"), never on local time, so no time zone can move a day.

// Figma's weekday bar (378:15585 to 378:15567).
export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tues",
  "Wed",
  "Thurs",
  "Fri",
  "Sat",
];

export type MiniCell = { date: string; day: number; inMonth: boolean };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Six weeks of seven days, Sunday first, so the card never changes height.
export function monthGrid(month: string): MiniCell[] {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayIndex(first));
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      day: Number(date.slice(8, 10)),
      inMonth: date.startsWith(month),
    };
  });
}

// "YYYY-MM" moved by a number of months.
export function shiftMonth(month: string, delta: number): string {
  const year = Number(month.slice(0, 4));
  const index = Number(month.slice(5, 7)) - 1 + delta;
  const shiftedYear = year + Math.floor(index / 12);
  const shiftedMonth = ((index % 12) + 12) % 12;
  return `${String(shiftedYear)}-${String(shiftedMonth + 1).padStart(2, "0")}`;
}

// "JANUARY" and "2026", which Figma sets apart.
export function monthTitle(month: string): { month: string; year: string } {
  const name = MONTHS[Number(month.slice(5, 7)) - 1] ?? "";
  return { month: name.toUpperCase(), year: month.slice(0, 4) };
}

// "November 2026".
export function monthName(month: string): string {
  return `${MONTHS[Number(month.slice(5, 7)) - 1] ?? ""} ${month.slice(0, 4)}`;
}

// A month grid starts at most six days before the 1st, so the 16th day of the
// range always falls inside the month it shows.
export function visibleMonth(range: DayRange): string {
  return addDays(range.from, 15).slice(0, 7);
}

export function monthHasMenu(days: { date: string }[], month: string): boolean {
  return days.some((day) => day.date.startsWith(`${month}-`));
}
