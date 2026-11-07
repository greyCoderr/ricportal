import { formatNumericDate } from "@ricportal/shared";
import pdfmake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces.js";

// The standard PDF fonts need no font files. They cannot draw a peso sign, so
// money is written with the letters PHP (sprint plan).
pdfmake.addFonts({
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

export const PDF_DEFAULT_STYLE = { font: "Helvetica", fontSize: 9 };

// A burst of PDFs must not freeze the server (blueprint 4.4): 2 at a time.
const MAX_CONCURRENT = 2;
let running = 0;
const waiting: (() => void)[] = [];

async function acquire(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    waiting.push(resolve);
  });
}

function release(): void {
  const next = waiting.shift();
  if (next === undefined) {
    running -= 1;
  } else {
    next();
  }
}

export async function renderPdf(doc: TDocumentDefinitions): Promise<Buffer> {
  await acquire();
  try {
    return await pdfmake.createPdf(doc).getBuffer();
  } finally {
    release();
  }
}

// "2026-03-14" as "03/14/2026", the form's mm/dd/year.
export const formatFormDate = formatNumericDate;

// Ruled lines for official forms: thin and black.
export const RULED_TABLE = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  paddingTop: () => 1,
  paddingBottom: () => 1,
  paddingLeft: () => 3,
  paddingRight: () => 3,
};

export const FORM_LETTERHEAD = [
  { text: "Republic of the Philippines", alignment: "center" as const },
  { text: "Province of Camarines Sur", alignment: "center" as const },
  { text: "Municipality of Libmanan", alignment: "center" as const },
];
