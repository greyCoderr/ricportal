import { isCalendarDate } from "./dates.js";

// D7: every date in tables, forms and PDFs is MM/DD/YYYY, and the API keeps
// YYYY-MM-DD. These work on the strings, so no time zone is involved.
export function formatNumericDate(day: string): string {
  const [year = "", month = "", date = ""] = day.split("-");
  return `${month}/${date}/${year}`;
}

// "02/29/2024" as "2024-02-29". Null unless it is a real date in that exact form.
export function parseNumericDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (match === null) {
    return null;
  }
  const iso = `${match[3] ?? ""}-${match[1] ?? ""}-${match[2] ?? ""}`;
  return isCalendarDate(iso) ? iso : null;
}

// What the masked input shows while typing: digits only, slashes added.
export function maskNumericDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter((part) => part !== "")
    .join("/");
}

// Money always arrives as a decimal string from the server (written PHP
// 1,234.00, DESIGN_LANGUAGE rule 1). This never does arithmetic on it.
export function formatPeso(amount: string): string {
  const negative = amount.startsWith("-");
  const [whole = "0", fraction = ""] = amount.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}PHP ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
