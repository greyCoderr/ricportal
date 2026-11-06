// Calendar days are "YYYY-MM-DD" strings everywhere (BR-09). These helpers do
// plain string arithmetic, so no time zone can move a day.

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isCalendarDate(value: string): boolean {
  const match = DAY.exec(value);
  if (match === null) {
    return false;
  }
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Today in the Philippines, whatever the machine's time zone is.
export function manilaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// BR-01: full years as of today. Null when the birthdate is in the future. A
// child born on 29 February turns a year older on 1 March in common years.
export function computeAge(birthdate: string, today: string): number | null {
  if (birthdate > today) {
    return null;
  }
  const birthYear = Number(birthdate.slice(0, 4));
  const thisYear = Number(today.slice(0, 4));
  const birthdayPassed = today.slice(5) >= birthdate.slice(5);
  return thisYear - birthYear - (birthdayPassed ? 0 : 1);
}

export type AgeBucket = "2" | "3" | "4" | "Other";

// A-04: other ages are accepted and counted in an "Other" row.
export function ageBucket(age: number): AgeBucket {
  if (age === 2) return "2";
  if (age === 3) return "3";
  if (age === 4) return "4";
  return "Other";
}

export function isUsualAge(age: number): boolean {
  return ageBucket(age) !== "Other";
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function toUtc(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

// Sunday is 0. Works on the written day, never on local time.
export function weekdayIndex(day: string): number {
  return toUtc(day).getUTCDay();
}

export function weekdayName(day: string): string {
  return WEEKDAYS[weekdayIndex(day)] ?? "";
}

export function addDays(day: string, count: number): string {
  const date = toUtc(day);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000);
}

// The Monday of the week a day is in; weeks run Monday to Sunday (BR-13).
export function mondayOf(day: string): string {
  return addDays(day, -((weekdayIndex(day) + 6) % 7));
}

// The first and last day of the month a day is in (A-11).
export function monthRange(day: string): { from: string; to: string } {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = day.slice(0, 8);
  return {
    from: `${prefix}01`,
    to: `${prefix}${String(last).padStart(2, "0")}`,
  };
}
