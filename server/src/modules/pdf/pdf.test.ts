import { describe, expect, it } from "vitest";
import {
  buildEnrollmentForm,
  type EnrollmentFormData,
} from "./enrollment-form.js";
import { renderPdf } from "./pdf.js";

// pdfkit writes each page as its own uncompressed object.
export function pageCount(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;
}

function data(students: number): EnrollmentFormData {
  return {
    centerName: "Sibujo",
    barangay: "Sibujo",
    dateStarted: "2026-06-08",
    teacherName: "Ana Cruz",
    students: Array.from({ length: students }, (_, index) => ({
      displayName: `Dela Cruz-Peña, Niño ${String(index + 1)} M.`,
      gender: index % 2 === 0 ? ("M" as const) : ("F" as const),
      birthdate: "2022-03-14",
      age: 2 + (index % 4),
      weightKg: "14.50",
      heightCm: "96.5",
      parentGuardianName: "Rosa Dela Cruz",
    })),
  };
}

async function render(students: number): Promise<Buffer> {
  return renderPdf(buildEnrollmentForm(data(students)));
}

describe("Enrollment Form PDF", () => {
  it("starts with %PDF", async () => {
    const pdf = await render(18);
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it.each([
    [0, 1],
    [18, 1],
    [30, 1],
    [31, 2],
    [45, 2],
    [60, 2],
    [61, 3],
  ])("%i students make %i page(s)", async (students, pages) => {
    expect(pageCount(await render(students))).toBe(pages);
  });
});

describe("buildEnrollmentForm", () => {
  function flatten(value: unknown): string {
    return JSON.stringify(value);
  }

  it("has the official texts", () => {
    const text = flatten(buildEnrollmentForm(data(1)));
    for (const expected of [
      "Republic of the Philippines",
      "Province of Camarines Sur",
      "Municipality of Libmanan",
      "ENROLLMENT FORM",
      "Name of Center",
      "Barangay",
      "Date Started",
      "No. of Enrollees",
      "PARENT/GUARDIAN",
      "2 yrs old",
      "3 yrs old",
      "4 yrs old",
      "Other",
      "Total",
      "Child Development Worker",
      "Punong Barangay",
      "Ana Cruz",
    ]) {
      expect(text).toContain(expected);
    }
  });

  it("counts the summary by age and gender, with Other", () => {
    const form = data(0);
    const child = (age: number, gender: "M" | "F") => ({
      ...data(1).students[0]!,
      age,
      gender,
    });
    form.students = [
      child(2, "M"),
      child(2, "F"),
      child(3, "M"),
      child(4, "F"),
      child(5, "M"),
    ];
    const summary = buildEnrollmentForm(form).content;
    const text = flatten(summary);
    expect(text).toContain(
      '["2 yrs old",{"text":"1","alignment":"center"},{"text":"1","alignment":"center"}]',
    );
    expect(text).toContain(
      '["Other",{"text":"1","alignment":"center"},{"text":"0","alignment":"center"}]',
    );
    expect(text).toContain(
      '["Total",{"text":"3","alignment":"center"},{"text":"2","alignment":"center"}]',
    );
  });
});
