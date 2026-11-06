import { describe, expect, it } from "vitest";
import { budgetFor, lineTotal, money, subtotal } from "./money.js";

describe("money (BR-11): Decimal in, string out, half-up to 2 decimals", () => {
  it.each([
    ["2", "38.00", "76.00"],
    ["0.5", "340.00", "170.00"],
    ["0.25", "80.00", "20.00"],
    ["0.333", "10.00", "3.33"],
    ["0.125", "1.00", "0.13"],
    ["1.005", "1.00", "1.01"],
    ["3", "0.10", "0.30"],
  ])("%s x %s = %s", (quantity, unitCost, expected) => {
    expect(money(lineTotal(quantity, unitCost))).toBe(expected);
  });

  it("the subtotal of the plan's vectors is 266.00", () => {
    const lines = [
      lineTotal("2", "38.00"),
      lineTotal("0.5", "340.00"),
      lineTotal("0.25", "80.00"),
    ];
    expect(money(subtotal(lines))).toBe("266.00");
  });

  it("floats would get this wrong; Decimal does not", () => {
    // 0.1 + 0.2 in floating point is 0.30000000000000004.
    expect(
      money(subtotal([lineTotal("1", "0.10"), lineTotal("1", "0.20")])),
    ).toBe("0.30");
    expect(money(lineTotal("1.1", "1.10"))).toBe("1.21");
  });

  it("an empty list is 0.00", () => {
    expect(money(subtotal([]))).toBe("0.00");
  });

  it("the budget is children x rate (BR-10)", () => {
    expect(money(budgetFor(18, "25.00"))).toBe("450.00");
    expect(money(budgetFor(0, "25.00"))).toBe("0.00");
    expect(money(budgetFor(3, "25.50"))).toBe("76.50");
  });
});
