import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

const FOCUS_RING = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-text",
];

describe("Checkbox", () => {
  it("is a native checkbox named by its label", () => {
    render(<Checkbox label="Has a birth certificate" />);
    const box = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Has a birth certificate",
    });
    expect(box.type).toBe("checkbox");
    expect(box.checked).toBe(false);
  });

  it("uses the Figma box (361:2911) and the approved checked look", () => {
    render(<Checkbox label="Has a birth certificate" />);
    const box = screen.getByRole("checkbox", {
      name: "Has a birth certificate",
    });
    for (const name of [
      "size-5.5",
      "appearance-none",
      "rounded-cell",
      "border",
      "border-border-subtle",
      "bg-surface",
      "hover:border-border",
      "checked:border-primary",
      "checked:bg-primary",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
      "aria-invalid:border-danger-text",
      ...FOCUS_RING,
    ]) {
      expect(box.classList).toContain(name);
    }
  });

  it("shows a 2px check mark in primary-contrast only when checked", () => {
    const { container } = render(<Checkbox label="Has a birth certificate" />);
    const mark = container.querySelector("svg");
    expect(mark?.getAttribute("aria-hidden")).toBe("true");
    expect(mark?.getAttribute("stroke-width")).toBe("2");
    expect(mark?.classList).toContain("text-primary-contrast");
    expect(mark?.classList).toContain("hidden");
    expect(mark?.classList).toContain("peer-checked:block");
  });

  it("the label row is at least 44 px high with 15 px text", () => {
    render(<Checkbox label="Has a birth certificate" />);
    const label = screen.getByText("Has a birth certificate").closest("label");
    expect(label?.classList).toContain("min-h-11");
    expect(label?.classList).toContain("gap-3");
    expect(label?.classList).toContain("text-15");
  });

  it("clicking the label toggles it", () => {
    const onChange = vi.fn();
    render(<Checkbox label="Has a birth certificate" onChange={onChange} />);
    fireEvent.click(screen.getByText("Has a birth certificate"));
    const box = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Has a birth certificate",
    });
    expect(box.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disabled: aria-disabled, cannot be toggled", () => {
    render(<Checkbox label="Has a birth certificate" disabled />);
    const box = screen.getByRole<HTMLInputElement>("checkbox", {
      name: "Has a birth certificate",
    });
    expect(box.disabled).toBe(true);
    expect(box.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(screen.getByText("Has a birth certificate"));
    expect(box.checked).toBe(false);
  });

  it("error: passes aria-invalid and aria-describedby through", () => {
    render(
      <>
        <Checkbox
          label="I confirm the details are correct"
          aria-invalid
          aria-describedby="confirm-error"
        />
        <p id="confirm-error">Please confirm the details.</p>
      </>,
    );
    const box = screen.getByRole("checkbox", {
      name: "I confirm the details are correct",
    });
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(box.getAttribute("aria-describedby")).toBe("confirm-error");
  });
});
