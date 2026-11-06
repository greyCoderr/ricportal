import { describe, expect, it } from "vitest";
import { formatLongDay, formatMenuName, formatPeso } from "./format";

describe("formatMenuName", () => {
  it.each([
    ["PORK PICADILLO", "Pork Picadillo"],
    ["EGG CALDERETA", "Egg Caldereta"],
    ["SINIGANG NA BABOY", "Sinigang na Baboy"],
    ["NUTRI-BIZKIDS", "Nutri-Bizkids"],
    [
      "SAUTEED MUNGBEAN WITH MALUNGGAY LEAVES & CHICKEN",
      "Sauteed Mungbean with Malunggay Leaves & Chicken",
    ],
    ["  chicken   tinola ", "Chicken Tinola"],
    ["WITH RICE", "With Rice"],
  ])("%s", (input, expected) => {
    expect(formatMenuName(input)).toBe(expected);
  });
});

describe("formatLongDay", () => {
  it("writes the day without a time zone", () => {
    expect(formatLongDay("2026-03-10")).toBe("Tuesday, 10 March 2026");
    expect(formatLongDay("2026-09-17")).toBe("Thursday, 17 September 2026");
  });
});

describe("formatPeso", () => {
  it.each([
    ["1234.00", "PHP 1,234.00"],
    ["0.00", "PHP 0.00"],
    ["266.00", "PHP 266.00"],
    ["1234567.5", "PHP 1,234,567.50"],
    ["450", "PHP 450.00"],
    ["-20.00", "-PHP 20.00"],
  ])("%s", (input, expected) => {
    expect(formatPeso(input)).toBe(expected);
  });
});
