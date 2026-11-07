import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../components/toast/ToastProvider";
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
  canDelete: false,
};

type Call = { method: string; path: string; body: unknown };

function mockDay(data: object) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({
        method,
        path,
        body:
          typeof init?.body === "string"
            ? (JSON.parse(init.body) as unknown)
            : undefined,
      });
      const body =
        method === "GET"
          ? {
              date: "2026-11-10",
              dayName: "Tuesday",
              menuName: "CHICKEN TINOLA",
              prNo: "SF-2026-004",
              status: "OPEN",
              items: [ITEM],
              subtotal: "76.00",
              ...data,
            }
          : { ...ITEM, id: 2, description: "Oil", canDelete: true };
      return Promise.resolve(
        new Response(JSON.stringify({ data: body, meta: {} }), {
          status: method === "POST" ? 201 : 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
  return calls;
}

function renderDay() {
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <ToastProvider>
        <ParentDayScreen date="2026-11-10" />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ParentDayScreen (S-P5-04, D3)", () => {
  it("shows the Figma table: Item No., Unit, Item Description, Qty, Price, Total", async () => {
    mockDay({});
    renderDay();
    await screen.findByText("Rice");
    for (const name of [
      "Item No.",
      "Unit",
      "Item Description",
      "Qty",
      "Price",
    ]) {
      expect(screen.getByRole("columnheader", { name })).toBeDefined();
    }
    expect(screen.getByText("Total:")).toBeDefined();
    expect(screen.getAllByText("PHP 76.00").length).toBe(2);
    expect(screen.queryByRole("alert")).toBe(null);
  });

  it("the pencil opens the row, with cells named after the ingredient", async () => {
    mockDay({});
    renderDay();
    fireEvent.click(await screen.findByRole("button", { name: "Edit Rice" }));
    const qty = screen.getByLabelText<HTMLInputElement>("Qty for Rice");
    expect(qty.value).toBe("2");
    expect(screen.getByLabelText("Unit for Rice")).toBeDefined();
    expect(screen.getByLabelText("Unit cost for Rice")).toBeDefined();
    expect(
      screen.getByLabelText<HTMLInputElement>("Description of item 1").value,
    ).toBe("Rice");
  });

  it("offers Delete only on a row the server says can be deleted", async () => {
    mockDay({
      items: [
        ITEM,
        { ...ITEM, id: 2, itemNo: 2, description: "Oil", canDelete: true },
      ],
    });
    renderDay();
    fireEvent.click(await screen.findByRole("button", { name: "Edit Rice" }));
    expect(screen.queryByRole("button", { name: "Delete" })).toBe(null);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Oil" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("a Parent adds a row", async () => {
    const calls = mockDay({});
    renderDay();
    fireEvent.change(await screen.findByLabelText("New ingredient"), {
      target: { value: "Oil" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    await waitFor(() => {
      expect(calls.some((call) => call.method === "POST")).toBe(true);
    });
    expect(calls.find((call) => call.method === "POST")).toEqual({
      method: "POST",
      path: "/api/purchase-requests/2026-11-10/items",
      body: { description: "Oil" },
    });
  });

  it("an empty ingredient is refused on the screen", async () => {
    const calls = mockDay({});
    renderDay();
    await screen.findByLabelText("New ingredient");
    fireEvent.click(screen.getByRole("button", { name: "Add ingredient" }));
    expect(screen.getByText("Enter the ingredient.")).toBeDefined();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("locked: the banner shows and nothing can be changed", async () => {
    mockDay({ status: "LOCKED", items: [{ ...ITEM, canDelete: true }] });
    renderDay();
    await screen.findByText(
      "This day is locked by your teacher. You can view it but not change it.",
    );
    expect(screen.queryByRole("button", { name: "Edit Rice" })).toBe(null);
    expect(screen.queryByLabelText("New ingredient")).toBe(null);
    expect(screen.queryByRole("button", { name: "Delete" })).toBe(null);
  });

  it("no feeding: nothing can be changed", async () => {
    mockDay({ status: "NO_FEEDING", items: [], subtotal: "0.00" });
    renderDay();
    await screen.findByText("Your teacher marked this day as No feeding.");
    expect(screen.queryByLabelText("New ingredient")).toBe(null);
  });

  it("empty: says so and offers the form", async () => {
    mockDay({ status: "NOT_OPENED", items: [], subtotal: "0.00" });
    renderDay();
    await screen.findByText(
      "No ingredients are listed yet. You can add the first one.",
    );
    expect(screen.getByLabelText("New ingredient")).toBeDefined();
  });

  it("never shows the budget", async () => {
    mockDay({});
    renderDay();
    await screen.findByText("Rice");
    expect(screen.queryByText(/budget/i)).toBe(null);
  });
});
