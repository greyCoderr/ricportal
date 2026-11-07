// Figma shows "RIC 25-001" and the blueprint has no such field. This is a display
// code built from the school year and the row id, not stored, flagged for the
// client (DEC-039). It is unique, but it does not count 1, 2, 3.
export function studentCode(student: {
  id: number;
  schoolYear: string;
}): string {
  const year = student.schoolYear.slice(2, 4);
  return `RIC ${year}-${String(student.id).padStart(3, "0")}`;
}

// "2026-2027" is shown as Figma's "Student List for 2026".
export function yearOf(schoolYear: string): string {
  return schoolYear.slice(0, 4);
}

// The four earlier years that Figma lists under the current one.
export function earlierSchoolYears(current: string, count = 4): string[] {
  const start = Number(yearOf(current));
  return Array.from({ length: count }, (_, index) => {
    const year = start - index - 1;
    return `${String(year)}-${String(year + 1)}`;
  });
}
