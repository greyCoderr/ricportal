import { ageBucket } from "@ricportal/shared";
import type {
  Content,
  TableCell,
  TDocumentDefinitions,
} from "pdfmake/interfaces.js";
import {
  FORM_LETTERHEAD,
  formatFormDate,
  PDF_DEFAULT_STYLE,
  RULED_TABLE,
} from "./pdf.js";

export type EnrollmentFormStudent = {
  displayName: string;
  gender: "M" | "F";
  birthdate: string;
  age: number;
  weightKg: string;
  heightCm: string;
  parentGuardianName: string;
};

export type EnrollmentFormData = {
  centerName: string;
  barangay: string;
  dateStarted: string | null;
  teacherName: string | null;
  students: EnrollmentFormStudent[];
};

export const ROWS_PER_PAGE = 30;

const HEADER: TableCell[] = [
  "NO.",
  "NAME (Last, First M.)",
  "GENDER M/F",
  "BIRTHDATE mm/dd/year",
  "AGE",
  "WEIGHT",
  "HEIGHT",
  "PARENT/GUARDIAN",
].map((text) => ({
  text,
  bold: true,
  alignment: "center" as const,
  fontSize: 7,
}));

function headerBlock(data: EnrollmentFormData): Content {
  return {
    stack: [
      ...FORM_LETTERHEAD,
      {
        text: "ENROLLMENT FORM",
        bold: true,
        fontSize: 12,
        alignment: "center",
        margin: [0, 4, 0, 6],
      },
      {
        columns: [
          {
            stack: [
              `Name of Center: ${data.centerName}`,
              `Barangay: ${data.barangay}`,
            ],
          },
          {
            stack: [
              `Date Started: ${data.dateStarted === null ? "" : formatFormDate(data.dateStarted)}`,
              `No. of Enrollees: ${String(data.students.length)}`,
            ],
          },
        ],
        margin: [0, 0, 0, 6],
      },
    ],
  };
}

function studentRow(
  number: number,
  student: EnrollmentFormStudent | undefined,
): TableCell[] {
  if (student === undefined) {
    return [
      { text: String(number), alignment: "center" },
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
  }
  return [
    { text: String(number), alignment: "center" },
    student.displayName,
    { text: student.gender, alignment: "center" },
    { text: formatFormDate(student.birthdate), alignment: "center" },
    { text: String(student.age), alignment: "center" },
    { text: student.weightKg, alignment: "right" },
    { text: student.heightCm, alignment: "right" },
    student.parentGuardianName,
  ];
}

// One page of the form: 30 numbered rows, blank when there are fewer children.
function pageTable(
  students: EnrollmentFormStudent[],
  startIndex: number,
  breakBefore: boolean,
): Content {
  const rows: TableCell[][] = [HEADER];
  for (let i = 0; i < ROWS_PER_PAGE; i += 1) {
    rows.push(studentRow(startIndex + i + 1, students[startIndex + i]));
  }
  return {
    ...(breakBefore ? { pageBreak: "before" as const } : {}),
    layout: RULED_TABLE,
    fontSize: 8,
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: [20, 130, 30, 55, 22, 35, 35, "*"],
      body: rows,
    },
  };
}

function centered(value: number): TableCell {
  return { text: String(value), alignment: "center" };
}

function summaryTable(students: EnrollmentFormStudent[]): Content {
  const count = (bucket: string, gender: "M" | "F") =>
    students.filter(
      (student) =>
        ageBucket(student.age) === bucket && student.gender === gender,
    ).length;
  const line = (label: string, bucket: string): TableCell[] => [
    label,
    centered(count(bucket, "M")),
    centered(count(bucket, "F")),
  ];
  const males = students.filter((student) => student.gender === "M").length;
  return {
    margin: [0, 8, 0, 0],
    columns: [
      {
        width: 220,
        layout: RULED_TABLE,
        fontSize: 8,
        table: {
          headerRows: 1,
          widths: ["*", 50, 50],
          body: [
            [
              "",
              { text: "Male", bold: true, alignment: "center" },
              { text: "Female", bold: true, alignment: "center" },
            ],
            line("2 yrs old", "2"),
            line("3 yrs old", "3"),
            line("4 yrs old", "4"),
            line("Other", "Other"),
            ["Total", centered(males), centered(students.length - males)],
          ],
        },
      },
      { width: "*", text: "" },
    ],
  };
}

function signatures(teacherName: string | null): Content {
  const block = (name: string, title: string): Content => ({
    alignment: "center",
    stack: [
      { text: name === "" ? " " : name, bold: true },
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 },
        ],
      },
      { text: title, margin: [0, 2, 0, 0] },
    ],
  });
  return {
    margin: [0, 14, 0, 0],
    columns: [
      block(teacherName ?? "", "Child Development Worker"),
      block("", "Punong Barangay"),
    ],
  };
}

export function buildEnrollmentForm(
  data: EnrollmentFormData,
): TDocumentDefinitions {
  const pages = Math.max(1, Math.ceil(data.students.length / ROWS_PER_PAGE));
  const content: Content[] = [];
  for (let page = 0; page < pages; page += 1) {
    if (page > 0) {
      content.push({ text: "", pageBreak: "before" });
    }
    content.push(
      headerBlock(data),
      pageTable(data.students, page * ROWS_PER_PAGE, false),
    );
  }
  content.push(summaryTable(data.students), signatures(data.teacherName));
  return {
    pageSize: "A4",
    pageMargins: [28, 24, 28, 24],
    defaultStyle: PDF_DEFAULT_STYLE,
    info: { title: `Enrollment Form, ${data.centerName}` },
    content,
  };
}
