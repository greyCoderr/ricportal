import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LedgerTable } from "./LedgerTable";

type Row = { id: number; name: string; total: string };
const ROWS: Row[] = [
  { id: 1, name: "Rice", total: "PHP 76.00" },
  { id: 2, name: "Chicken", total: "PHP 170.00" },
];

function setup() {
  return render(
    <LedgerTable
      caption="Purchase Request, 10 November 2026"
      rows={ROWS}
      rowKey={(row) => row.id}
      columns={[
        { key: "name", header: "Item Description", render: (row) => row.name },
        {
          key: "total",
          header: "Total Cost",
          numeric: true,
          render: (row) => row.total,
        },
      ]}
      total={{ label: "Sub-total", value: "PHP 246.00" }}
    />,
  );
}

describe("LedgerTable (docs/ui-specs/ui-kit.md)", () => {
  it("numbers are right-aligned with tabular figures; text stays left", () => {
    setup();
    const amount = screen.getByRole("cell", { name: "PHP 76.00" });
    expect(amount.classList).toContain("text-right");
    expect(amount.classList).toContain("tabular-nums");
    expect(screen.getByRole("cell", { name: "Rice" }).classList).not.toContain(
      "text-right",
    );
    expect(
      screen.getByRole("columnheader", { name: "Total Cost" }).classList,
    ).toContain("text-right");
  });

  it("the total row has a single rule above and a double rule below", () => {
    const { container } = setup();
    const row = container.querySelector("tfoot tr");
    for (const name of [
      "border-t",
      "border-t-border",
      "border-b-4",
      "border-double",
      "border-b-border",
    ]) {
      expect(row?.classList).toContain(name);
    }
    expect(
      screen
        .getByRole("rowheader", { name: "Sub-total" })
        .getAttribute("scope"),
    ).toBe("row");
  });

  it("is named by its caption and scrolls in a focusable region", () => {
    setup();
    expect(
      screen.getByRole("table", { name: "Purchase Request, 10 November 2026" }),
    ).toBeDefined();
    const region = screen.getByRole("region", {
      name: "Purchase Request, 10 November 2026",
    });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.classList).toContain("overflow-x-auto");
  });

  it("has no total row unless one is given", () => {
    const { container } = render(
      <LedgerTable
        caption="No total"
        rows={ROWS}
        rowKey={(row) => row.id}
        columns={[{ key: "n", header: "Name", render: (row) => row.name }]}
      />,
    );
    expect(container.querySelector("tfoot")).toBe(null);
  });
});
