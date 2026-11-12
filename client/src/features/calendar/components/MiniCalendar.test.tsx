import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MiniCalendar } from "./MiniCalendar";

const DAYS = [
  { date: "2026-11-04", menuName: "Pork Nilaga" },
  { date: "2026-11-11", menuName: "Sinigang na Baboy" },
];

function renderMini(
  overrides: Partial<Parameters<typeof MiniCalendar>[0]> = {},
) {
  const onDayClick = vi.fn();
  const onRangeChange = vi.fn();
  render(
    <MiniCalendar
      days={DAYS}
      today="2026-11-12"
      onDayClick={onDayClick}
      onRangeChange={onRangeChange}
      {...overrides}
    />,
  );
  return { onDayClick, onRangeChange };
}

describe("MiniCalendar (Plan 4 D2)", () => {
  it("shows day numbers only, never a dish name", () => {
    renderMini();
    const grid = screen.getByRole("grid");
    expect(within(grid).queryByText("Pork Nilaga")).toBe(null);
    expect(within(grid).queryByText(/Sinigang/)).toBe(null);
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
  });

  it("has the month heading, the year at the right and green weekdays", () => {
    renderMini();
    expect(screen.getByRole("heading", { name: "NOVEMBER" })).toBeDefined();
    expect(screen.getByText("2026")).toBeDefined();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((cell) => cell.textContent)).toEqual([
      "Sun",
      "Mon",
      "Tues",
      "Wed",
      "Thurs",
      "Fri",
      "Sat",
    ]);
    expect(headers[0]?.className).toContain("bg-calendar-bar");
  });

  it("marks the days that have a menu with a dot", () => {
    renderMini();
    const withMenu = screen
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("data-has-menu"))
      .map((button) => button.getAttribute("data-date"));
    expect(withMenu).toEqual(["2026-11-04", "2026-11-11"]);
    expect(
      screen.getByRole("button", { name: /11\/04\/2026, has a menu/ }),
    ).toBeDefined();
  });

  it("gives today a light green cell and greys the other months", () => {
    renderMini();
    const today = screen.getByRole("button", { name: /11\/12\/2026/ });
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(today.className).toContain("ric-mini-today");
    const outside = screen.getByRole("button", { name: /12\/01\/2026/ });
    expect(outside.className).toContain("text-text-muted");
  });

  it("moves between months and reports the range it shows", () => {
    const { onRangeChange } = renderMini();
    expect(onRangeChange).toHaveBeenLastCalledWith({
      from: "2026-11-01",
      to: "2026-12-12",
    });
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: "DECEMBER" })).toBeDefined();
    expect(onRangeChange).toHaveBeenLastCalledWith({
      from: "2026-11-29",
      to: "2027-01-09",
    });
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByRole("heading", { name: "OCTOBER" })).toBeDefined();
  });

  it("a click on a day hands its date to the page", () => {
    const { onDayClick } = renderMini();
    fireEvent.click(screen.getByRole("button", { name: /11\/18\/2026/ }));
    expect(onDayClick).toHaveBeenCalledWith("2026-11-18");
  });
});
