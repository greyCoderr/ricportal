import { formatPeso, type LiquidationData } from "@ricportal/shared";
import type {
  Content,
  TableCell,
  TDocumentDefinitions,
} from "pdfmake/interfaces.js";
import { formatFormDate, PDF_DEFAULT_STYLE, RULED_TABLE } from "./pdf.js";

// The official forms (phase 6). The built-in fonts have no peso sign, so money
// is written with the letters PHP (sprint plan).

const center = (text: string, extra: object = {}): Content => ({
  text,
  alignment: "center",
  ...extra,
});

const right = (text: string): TableCell => ({ text, alignment: "right" });

function money(value: string | null): string {
  return value === null ? "" : formatPeso(value);
}

const baseDocument = {
  pageSize: "A4" as const,
  pageMargins: [36, 28, 36, 28] as [number, number, number, number],
  defaultStyle: PDF_DEFAULT_STYLE,
};

export function buildPurchaseRequestForm(
  data: LiquidationData,
  date: string,
): TDocumentDefinitions {
  const day = data.days.find((row) => row.date === date);
  if (day === undefined) {
    throw new Error("The day is not in this liquidation.");
  }
  const header = [
    "ITEM NO.",
    "UNIT",
    "ITEM DESCRIPTION",
    "QTY",
    "UNIT COST",
    "TOTAL COST",
  ].map((text): TableCell => ({
    text,
    bold: true,
    alignment: "center",
    fontSize: 8,
  }));
  const rows: TableCell[][] = [
    header,
    ["", "", { text: day.menuName, bold: true }, "", "", ""],
    ...day.items.map((item): TableCell[] => [
      { text: String(item.itemNo), alignment: "center" },
      item.unit ?? "",
      item.description,
      right(item.quantity ?? ""),
      right(money(item.unitCost)),
      right(money(item.total)),
    ]),
    [
      {
        text: "Sub-total",
        colSpan: 5,
        alignment: "right",
        bold: true,
      },
      "",
      "",
      "",
      "",
      { text: formatPeso(day.subtotal), alignment: "right", bold: true },
    ],
  ];

  return {
    ...baseDocument,
    info: { title: `Purchase Request, ${data.centerName}, ${date}` },
    content: [
      {
        columns: [
          {
            fontSize: 8,
            stack: [
              "Local Government of LIBMANAN, CAMARINES SUR",
              "Standard Form Number SF-GOOD-59",
              "Revised on May 24, 2004",
            ],
          },
          {
            fontSize: 8,
            alignment: "right",
            stack: [
              "PRN: ____________",
              "SUPPLEMENTARY FEEDING (Name of Project)",
              "LIBMANAN CAMARINES SUR (Location of Project)",
            ],
          },
        ],
      },
      center("Standard Form No. PURCHASE REQUEST", {
        fontSize: 8,
        margin: [0, 6, 0, 0],
      }),
      center("PURCHASE REQUEST", { bold: true, fontSize: 13 }),
      center("LGU-Libmanan, Camarines Sur"),
      center("Agency / Procuring Entity", {
        fontSize: 8,
        margin: [0, 0, 0, 6],
      }),
      {
        columns: [
          { stack: ["Department: ____________", "Section: ____________"] },
          {
            stack: [
              `PR No.: ${day.prNo}`,
              `PR date: ${formatFormDate(day.prDate)}`,
            ],
          },
          { stack: ["SAI No.: ____________", `Date: ${formatFormDate(date)}`] },
        ],
        margin: [0, 0, 0, 6],
      },
      {
        layout: RULED_TABLE,
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [36, 40, "*", 45, 70, 70],
          body: rows,
        },
      },
      {
        text: `Purpose / Remarks: Supplementary Feeding Program CY: ${date.slice(0, 4)}`,
        margin: [0, 8, 0, 8],
      },
      {
        layout: RULED_TABLE,
        unbreakable: true,
        table: {
          widths: [70, "*", "*"],
          body: [
            [
              "",
              { text: "Requested by", bold: true },
              { text: "Approved by", bold: true },
            ],
            ["Signature", "", ""],
            ["Printed Name", data.teacherName, data.signatories.approvedByName],
            [
              "Designation",
              "Child Development Worker",
              data.signatories.approvedByTitle,
            ],
            ["Date", "", ""],
          ],
        },
      },
    ],
  };
}

function signatureBlock(title: string, name: string, role: string): Content {
  return {
    alignment: "center",
    stack: [
      { text: title, alignment: "left", margin: [0, 0, 0, 14] },
      { text: name === "" ? " " : name, bold: true },
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
        ],
      },
      { text: role === "" ? " " : role, margin: [0, 2, 0, 0] },
    ],
  };
}

export function buildSummaryForm(data: LiquidationData): TDocumentDefinitions {
  // BR-15: No feeding days are left out. BR-18: one row per day.
  const days = data.days.filter(
    (day) => day.status !== "NO_FEEDING" && day.status !== "NOT_OPENED",
  );
  const header = [
    "Date",
    "Particular",
    "Statement of Market Purchase No.",
    "Total Amount",
  ].map((text): TableCell => ({
    text,
    bold: true,
    alignment: "center",
    fontSize: 8,
  }));
  return {
    ...baseDocument,
    info: { title: `Summary of Disbursement, ${data.centerName}` },
    content: [
      center("MUNICIPAL SOCIAL WELFARE & DEVELOPMENT OFFICE", { bold: true }),
      center("PROVINCE OF CAMARINES SUR"),
      center("MUNICIPALITY OF LIBMANAN", { margin: [0, 0, 0, 8] }),
      `Name of Child Development Center: ${data.centerName}`,
      `Barangay: ${data.barangay}`,
      center("SUMMARY OF DISBURSEMENT", {
        bold: true,
        fontSize: 13,
        margin: [0, 8, 0, 0],
      }),
      center(
        `Date: ${formatFormDate(data.from)} to ${formatFormDate(data.to)}`,
        { margin: [0, 0, 0, 8] },
      ),
      {
        layout: RULED_TABLE,
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths: [60, "*", 100, 80],
          body: [
            header,
            ...days.map((day): TableCell[] => [
              { text: formatFormDate(day.date), alignment: "center" },
              day.menuName,
              { text: day.prNo, alignment: "center" },
              right(formatPeso(day.subtotal)),
            ]),
            [
              { text: "TOTAL", colSpan: 3, alignment: "right", bold: true },
              "",
              "",
              { text: formatPeso(data.total), alignment: "right", bold: true },
            ],
          ],
        },
      },
      {
        margin: [0, 18, 0, 0],
        unbreakable: true,
        columns: [
          signatureBlock(
            "Prepared by",
            data.teacherName,
            "Child Development Worker",
          ),
          signatureBlock(
            "Noted by",
            data.signatories.notedByName,
            data.signatories.notedByTitle,
          ),
        ],
      },
    ],
  };
}

// A-09: the clear copy of the form has not arrived, so this is a clean
// placeholder that says so (P6-T05).
export function buildTransmittalForm(
  data: LiquidationData,
): TDocumentDefinitions {
  return {
    ...baseDocument,
    info: { title: `Transmittal Checklist, ${data.centerName}` },
    content: [
      center("TRANSMITTAL CHECKLIST", {
        bold: true,
        fontSize: 13,
        margin: [0, 40, 0, 4],
      }),
      center("layout pending the official copy", {
        italics: true,
        margin: [0, 0, 0, 16],
      }),
      `Name of Child Development Center: ${data.centerName}`,
      `Barangay: ${data.barangay}`,
      `Period: ${formatFormDate(data.from)} to ${formatFormDate(data.to)}`,
      `Total: ${formatPeso(data.total)}`,
    ],
  };
}
