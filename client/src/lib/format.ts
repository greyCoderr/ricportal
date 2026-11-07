import { formatNumericDate, manilaToday, weekdayName } from "@ricportal/shared";

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

export { formatNumericDate as formatDate, formatPeso } from "@ricportal/shared";

// An instant from the API (an ISO time, not a calendar day) as its Manila date.
export function formatInstantDate(instant: string): string {
  return formatNumericDate(manilaToday(new Date(instant)));
}
