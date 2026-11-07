// D7: every date in tables, forms and PDFs is MM/DD/YYYY. Works on the string, so
// no time zone is involved.
export function formatNumericDate(day: string): string {
  const [year = "", month = "", date = ""] = day.split("-");
  return `${month}/${date}/${year}`;
}

// Money always arrives as a decimal string from the server (written PHP
// 1,234.00, DESIGN_LANGUAGE rule 1). This never does arithmetic on it.
export function formatPeso(amount: string): string {
  const negative = amount.startsWith("-");
  const [whole = "0", fraction = ""] = amount.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}PHP ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}
