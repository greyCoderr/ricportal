import { manilaToday } from "./dates.js";

// Display codes on the Teacher Profile (Plan 4 D9). They are built from the row
// id and a date, never stored. The year is the Manila calendar year.

function manilaYear(at: Date): string {
  return manilaToday(at).slice(0, 4);
}

function padded(id: number): string {
  return String(id).padStart(3, "0");
}

// "RIC-2025-001": the year the account was created.
export function teacherDisplayCode(id: number, createdAt: Date): string {
  return `RIC-${manilaYear(createdAt)}-${padded(id)}`;
}

// "2025-007": the year the report was submitted.
export function reportDisplayCode(id: number, submittedAt: Date): string {
  return `${manilaYear(submittedAt)}-${padded(id)}`;
}
