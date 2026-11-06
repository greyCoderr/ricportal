import { addDays, isCalendarDate, weekdayName } from "@ricportal/shared";
import ExcelJS from "exceljs";

// The pure parser for the DSWD food rotation file (phase 4). It reads only the
// left-most DATE and MENU columns; columns F to I repeat them for printing.

export type ParsedDay = {
  feedingDate: string;
  dayNo: number;
  dayName: string;
  menuName: string;
};

export type ParsedBatch = {
  sheetName: string;
  prNo: string;
  prDate: string;
  periodStart: string;
  periodEnd: string;
  days: ParsedDay[];
  warnings: string[];
};

export type ParseResult = {
  batches: ParsedBatch[];
  // File-level notes, for example a sheet without a header.
  warnings: string[];
  // Anything here blocks the import.
  errors: string[];
};

const MAX_DAYS_PER_SHEET = 100;
const MS_PER_DAY = 86_400_000;
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

const PR_NO = /PR\s*#?\s*(?:NO\.?)?\s*(SF)\s*-\s*(\d{4})\s*-\s*(\d+)/i;
const PR_DATE = /PR\s*DATE\s*:?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i;
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dayFromParts(
  year: number,
  month: number,
  date: number,
): string | null {
  const day = `${String(year)}-${pad(month)}-${pad(date)}`;
  return isCalendarDate(day) ? day : null;
}

// Rich text and formula cells hold their text in different places.
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if ("richText" in value) {
    return value.richText.map((part) => part.text).join("");
  }
  if ("text" in value && typeof value.text === "string") {
    return value.text;
  }
  if ("result" in value) {
    return cellText(value.result);
  }
  return "";
}

// exceljs gives a real date cell as a Date at midnight UTC, so only the UTC
// getters give the day that is written in the file (BR-09).
function cellDay(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date) {
    return dayFromParts(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    );
  }
  if (typeof value === "number") {
    const date = new Date(EXCEL_EPOCH_UTC + Math.floor(value) * MS_PER_DAY);
    return dayFromParts(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
  }
  if (typeof value === "object" && value !== null && "result" in value) {
    return cellDay(value.result);
  }
  const text = cellText(value).trim();
  const slash = SLASH_DATE.exec(text);
  if (slash !== null) {
    return dayFromParts(Number(slash[3]), Number(slash[1]), Number(slash[2]));
  }
  return isCalendarDate(text) ? text : null;
}

function isEmpty(value: ExcelJS.CellValue): boolean {
  return cellText(value).trim() === "";
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

type Header = {
  row: number;
  noCol: number;
  dateCol: number;
  dayCol: number;
  menuCol: number;
};

// The header row holds DATE and MENU. The first pair from the left is used.
function findHeader(sheet: ExcelJS.Worksheet): Header | null {
  let found: Header | null = null;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (found !== null) {
      return;
    }
    let dateCol = 0;
    let menuCol = 0;
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const text = cellText(cell.value).trim().toUpperCase();
      if (text === "DATE" && dateCol === 0) {
        dateCol = col;
      } else if (text === "MENU" && dateCol !== 0 && menuCol === 0) {
        menuCol = col;
      }
    });
    if (dateCol !== 0 && menuCol !== 0) {
      found = {
        row: rowNumber,
        noCol: dateCol - 1,
        dateCol,
        dayCol: dateCol + 1,
        menuCol,
      };
    }
  });
  return found;
}

function findPrData(
  sheet: ExcelJS.Worksheet,
  headerRow: number,
): { prNo: string | null; prDate: string | null } {
  let prNo: string | null = null;
  let prDate: string | null = null;
  for (let rowNumber = 1; rowNumber < headerRow; rowNumber += 1) {
    sheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
      const text = cellText(cell.value);
      const dateMatch = PR_DATE.exec(text);
      if (dateMatch !== null && prDate === null) {
        prDate = dayFromParts(
          Number(dateMatch[3]),
          Number(dateMatch[1]),
          Number(dateMatch[2]),
        );
      }
      const noMatch = PR_NO.exec(text);
      if (noMatch !== null && prNo === null) {
        prNo = `${(noMatch[1] ?? "").toUpperCase()}-${noMatch[2] ?? ""}-${noMatch[3] ?? ""}`;
      }
    });
  }
  return { prNo, prDate };
}

function parseSheet(
  sheet: ExcelJS.Worksheet,
  header: Header,
  errors: string[],
): ParsedBatch | null {
  const where = `Sheet ${sheet.name}`;
  const { prNo, prDate } = findPrData(sheet, header.row);
  if (prNo === null) {
    errors.push(`${where}: the PR number was not found.`);
  }
  if (prDate === null) {
    errors.push(`${where}: the PR date was not found.`);
  }

  const days: ParsedDay[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  let rowNumber = header.row + 1;
  for (; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const dateValue = row.getCell(header.dateCol).value;
    // The list ends at the first empty date.
    if (isEmpty(dateValue)) {
      break;
    }
    const feedingDate = cellDay(dateValue);
    if (feedingDate === null) {
      errors.push(
        `${where}, row ${String(rowNumber)}: the date cannot be read.`,
      );
      continue;
    }
    if (seen.has(feedingDate)) {
      errors.push(
        `${where}, row ${String(rowNumber)}: the date ${feedingDate} appears twice.`,
      );
      continue;
    }
    seen.add(feedingDate);

    const menuName = normalize(cellText(row.getCell(header.menuCol).value));
    if (menuName === "") {
      errors.push(`${where}, row ${String(rowNumber)}: the menu is empty.`);
      continue;
    }
    const dayNoValue =
      header.noCol >= 1 ? row.getCell(header.noCol).value : null;
    const dayNo = typeof dayNoValue === "number" ? dayNoValue : days.length + 1;
    const dayName = normalize(cellText(row.getCell(header.dayCol).value));

    const expected = weekdayName(feedingDate);
    if (dayName !== "" && dayName.toUpperCase() !== expected.toUpperCase()) {
      warnings.push(
        `Row ${String(rowNumber)}: the file says ${dayName}, but ${feedingDate} is a ${expected}.`,
      );
    }
    const previous = days.at(-1);
    if (previous !== undefined) {
      if (dayNo !== previous.dayNo + 1) {
        warnings.push(
          `Row ${String(rowNumber)}: the day number ${String(dayNo)} does not follow ${String(previous.dayNo)}.`,
        );
      }
      if (feedingDate !== addDays(previous.feedingDate, 1)) {
        warnings.push(
          `Row ${String(rowNumber)}: there is a gap in the dates after ${previous.feedingDate}.`,
        );
      }
    }
    days.push({
      feedingDate,
      dayNo,
      dayName: dayName === "" ? expected : dayName,
      menuName,
    });
  }

  if (days.length > MAX_DAYS_PER_SHEET) {
    errors.push(
      `${where}: it has ${String(days.length)} days; at most ${String(MAX_DAYS_PER_SHEET)} are allowed.`,
    );
  }
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) {
    errors.push(`${where}: no dates were found under the header.`);
    return null;
  }
  return {
    sheetName: sheet.name,
    prNo: prNo ?? "",
    prDate: prDate ?? "",
    periodStart: first.feedingDate,
    periodEnd: last.feedingDate,
    days,
    warnings,
  };
}

export async function parseMenuWorkbook(buffer: Buffer): Promise<ParseResult> {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(
    buffer as unknown as Parameters<typeof book.xlsx.load>[0],
  );

  const result: ParseResult = { batches: [], warnings: [], errors: [] };
  book.eachSheet((sheet) => {
    const header = findHeader(sheet);
    if (header === null) {
      result.warnings.push(
        `Sheet ${sheet.name} has no DATE and MENU header, so it was skipped.`,
      );
      return;
    }
    const batch = parseSheet(sheet, header, result.errors);
    if (batch !== null) {
      result.batches.push(batch);
    }
  });

  if (result.batches.length === 0 && result.errors.length === 0) {
    result.errors.push("No sheet with a DATE and MENU header was found.");
  }

  // One feeding date can only be in one batch (BR-08).
  const owner = new Map<string, string>();
  for (const batch of result.batches) {
    for (const day of batch.days) {
      const other = owner.get(day.feedingDate);
      if (other !== undefined) {
        result.errors.push(
          `The date ${day.feedingDate} is in both ${other} and ${batch.sheetName}.`,
        );
      }
      owner.set(day.feedingDate, batch.sheetName);
    }
  }
  return result;
}
