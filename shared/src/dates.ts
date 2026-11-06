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
