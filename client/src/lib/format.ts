import { weekdayName } from "@ricportal/shared";

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "in",
  "na",
  "ng",
  "of",
  "on",
  "or",
  "sa",
  "the",
  "to",
  "with",
]);

function capitalize(word: string): string {
  // Keeps hyphenated names right: NUTRI-BIZKIDS becomes Nutri-Bizkids.
  return word
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

// The stored menu name stays as in the DSWD file; this is for display only
// (P4-T07). Small words stay in lower case except at the start.
export function formatMenuName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== "")
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word) ? word : capitalize(word),
    )
    .join(" ");
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-03-10" as "Tuesday, 10 March 2026", with no time zone involved.
export function formatLongDay(day: string): string {
  const [year, month, date] = day.split("-");
  return `${weekdayName(day)}, ${String(Number(date))} ${MONTHS[Number(month) - 1] ?? ""} ${year ?? ""}`;
}

// Money always arrives as a decimal string from the server (written PHP
// 1,234.00, DESIGN_LANGUAGE rule 1). This never does arithmetic on it.
export function formatPeso(amount: string): string {
  const negative = amount.startsWith("-");
  const [whole = "0", fraction = ""] = amount.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}PHP ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
