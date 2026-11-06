import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "../../../lib/query-client";
import { ParentDayScreen } from "./ParentDayScreen";

const ITEM = {
  id: 1,
  itemNo: 1,
  description: "Rice",
  unit: "kg",
  quantity: "2",
  unitCost: "38.00",
  total: "76.00",
  version: 2,
};

function mockDay(data: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              date: "2026-11-10",
              dayName: "Tuesday",
              menuName: "CHICKEN TINOLA",
              prNo: "SF-2026-004",
              status: "OPEN",
              items: [ITEM],
              subtotal: "76.00",
              ...data,
            },
            meta: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    ),
  );
}

function renderDay() {
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <ParentDayScreen date="2026-11-10" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ParentDayScreen (S-P5-04)", () => {
  it("open: cells named after the ingredient, editable, with totals", async () => {
    mockDay({});
    renderDay();
    const qty = await screen.findByLabelText<HTMLInputElement>("Qty for Rice");
    expect(qty.disabled).toBe(false);
    expect(qty.value).toBe("2");
    expect(screen.getByLabelText("Unit for Rice")).toBeDefined();
    expect(screen.getByLabelText("Unit cost for Rice")).toBeDefined();
    expect(screen.getAllByText("PHP 76.00").length).toBe(2);
    expect(screen.queryByRole("alert")).toBe(null);
  });

  it("has no place to add or delete rows or rename an ingredient (BR-12)", async () => {
    mockDay({});
    renderDay();
    await screen.findByLabelText("Qty for Rice");
    expect(screen.queryByRole("button", { name: /add/i })).toBe(null);
    expect(screen.queryByRole("button", { name: /delete/i })).toBe(null);
    expect(screen.queryByLabelText(/description/i)).toBe(null);
  });

  it("locked: the banner shows and every cell is read-only", async () => {
    mockDay({ status: "LOCKED" });
    renderDay();
    await screen.findByText(
      "This day is locked by your teacher. You can view it but not change it.",
    );
    for (const label of [
      "Unit for Rice",
      "Qty for Rice",
      "Unit cost for Rice",
    ]) {
      expect(screen.getByLabelText<HTMLInputElement>(label).disabled).toBe(
        true,
      );
    }
  });

  it("empty: the spec's words", async () => {
    mockDay({ status: "NOT_OPENED", items: [], subtotal: "0.00" });
    renderDay();
    await screen.findByText(
      "Your teacher has not listed the ingredients yet. Check back later.",
    );
  });
});
