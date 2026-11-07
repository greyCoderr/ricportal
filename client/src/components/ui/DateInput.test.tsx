import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DateInput } from "./DateInput";

function Harness({
  initial = "",
  onValue,
}: {
  initial?: string;
  onValue?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateInput
      aria-label="Date"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

function input() {
  return screen.getByLabelText<HTMLInputElement>("Date");
}

function type(value: string) {
  fireEvent.change(input(), { target: { value } });
}

describe("DateInput (D7)", () => {
  it("shows a stored date as MM/DD/YYYY", () => {
    render(<Harness initial="2024-02-29" />);
    expect(input().value).toBe("02/29/2024");
    expect(input().type).toBe("text");
    expect(input().placeholder).toBe("MM/DD/YYYY");
  });

  it("adds the slashes while typing and hands over the API form when done", () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    type("0229");
    expect(input().value).toBe("02/29");
    expect(onValue).toHaveBeenLastCalledWith("02/29");
    type("02292024");
    expect(input().value).toBe("02/29/2024");
    expect(onValue).toHaveBeenLastCalledWith("2024-02-29");
  });

  it("keeps an impossible date as typed, so the schema refuses it", () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    type("02302020");
    expect(input().value).toBe("02/30/2020");
    expect(onValue).toHaveBeenLastCalledWith("02/30/2020");
  });

  it("ignores letters", () => {
    render(<Harness />);
    type("ab12");
    expect(input().value).toBe("12");
  });

  it("can be cleared", () => {
    const onValue = vi.fn();
    render(<Harness initial="2024-02-29" onValue={onValue} />);
    type("");
    expect(input().value).toBe("");
    expect(onValue).toHaveBeenLastCalledWith("");
  });
});
