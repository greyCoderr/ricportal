import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";
import { Table } from "./Table";

type Row = { id: number; name: string; age: string };
const ROWS: Row[] = [
  { id: 1, name: "Maria Santos", age: "3" },
  { id: 2, name: "Jose Reyes", age: "4" },
];

describe("Table", () => {
  function setup() {
    return render(
      <Table
        caption="Students of Sibujo"
        rowKey={(row) => row.id}
        rows={ROWS}
        columns={[
          { key: "name", header: "Name", render: (row) => row.name },
          {
            key: "age",
            header: "Age",
            align: "right",
            render: (row) => row.age,
          },
        ]}
      />,
    );
  }

  it("has a caption and scoped column headers", () => {
    setup();
    expect(
      screen.getByRole("table", { name: "Students of Sibujo" }),
    ).toBeDefined();
    for (const name of ["Name", "Age"]) {
      expect(
        screen.getByRole("columnheader", { name }).getAttribute("scope"),
      ).toBe("col");
    }
  });

  it("renders the cells, with right alignment and tabular numbers where asked", () => {
    setup();
    expect(screen.getByRole("cell", { name: "Maria Santos" })).toBeDefined();
    const age = screen.getByRole("cell", { name: "3" });
    expect(age.classList).toContain("text-right");
    expect(age.classList).toContain("tabular-nums");
  });

  it("scrolls inside a focusable named region on small screens", () => {
    setup();
    const region = screen.getByRole("region", { name: "Students of Sibujo" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.classList).toContain("overflow-x-auto");
  });
});

describe("Pagination", () => {
  it("shows the page and total, and moves with its buttons", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={2}
        pageSize={20}
        total={45}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Pages" })).toBeDefined();
    expect(screen.getByText("Page 2 of 3")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables Previous on the first page and Next on the last", () => {
    render(
      <>
        <Pagination
          page={1}
          pageSize={20}
          total={45}
          onPageChange={() => undefined}
        />
        <Pagination
          page={3}
          pageSize={20}
          total={45}
          onPageChange={() => undefined}
        />
      </>,
    );
    const previous = screen.getAllByRole<HTMLButtonElement>("button", {
      name: "Previous page",
    });
    const next = screen.getAllByRole<HTMLButtonElement>("button", {
      name: "Next page",
    });
    expect(previous[0]?.disabled).toBe(true);
    expect(next[1]?.disabled).toBe(true);
  });

  it("is hidden when everything fits on one page", () => {
    const { container } = render(
      <Pagination
        page={1}
        pageSize={20}
        total={5}
        onPageChange={() => undefined}
      />,
    );
    expect(container.firstChild).toBe(null);
  });
});
