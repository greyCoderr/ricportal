import { Prisma } from "../generated/prisma/client.js";

// Money is Decimal on the server and a string in the API, never a Number
// (CLAUDE.md, BR-11). Rounding is half-up to 2 decimals.
const { Decimal } = Prisma;
type DecimalValue = Prisma.Decimal;
type DecimalInput = DecimalValue | string | number;

export function lineTotal(
  quantity: DecimalInput,
  unitCost: DecimalInput,
): DecimalValue {
  return new Decimal(quantity)
    .times(new Decimal(unitCost))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function subtotal(lines: DecimalValue[]): DecimalValue {
  return lines.reduce((sum, line) => sum.plus(line), new Decimal(0));
}

export function budgetFor(
  enrolledCount: number,
  ratePerChild: DecimalInput,
): DecimalValue {
  return new Decimal(ratePerChild)
    .times(enrolledCount)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function money(value: DecimalInput): string {
  return new Decimal(value).toFixed(2, Decimal.ROUND_HALF_UP);
}

export function isGreater(a: DecimalValue, b: DecimalInput): boolean {
  return a.greaterThan(new Decimal(b));
}
