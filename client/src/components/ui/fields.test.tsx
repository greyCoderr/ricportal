import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

const FOCUS_RING = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-text",
];
const CONTROL = [
  "w-full",
  "rounded-control",
  "border",
  "border-border-subtle",
  "bg-surface",
  // 16 px on phones (no zoom on focus in iOS Safari), 15 px from md up.
  "text-16",
  "md:text-15",
  "text-text",
  "hover:border-border",
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
  "aria-invalid:border-danger-text",
];

describe("Input", () => {
  it("is 44 px high with the control tokens, focus ring and placeholder token", () => {
    render(<Input aria-label="Full name" placeholder="Juan dela Cruz" />);
    const input = screen.getByRole("textbox", { name: "Full name" });
    for (const name of [
      ...CONTROL,
      ...FOCUS_RING,
      "h-11",
      "placeholder:text-text-placeholder",
    ]) {
      expect(input.classList).toContain(name);
    }
  });

  it("passes value changes through", () => {
    const onChange = vi.fn();
    render(<Input aria-label="Full name" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "Maria Santos" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disabled sets aria-disabled", () => {
    render(<Input aria-label="Full name" disabled />);
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Full name",
    });
    expect(input.disabled).toBe(true);
    expect(input.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("Textarea", () => {
  it("uses the input radius and control tokens", () => {
    render(<Textarea aria-label="Narrative" />);
    const textarea = screen.getByRole("textbox", { name: "Narrative" });
    expect(textarea.tagName).toBe("TEXTAREA");
    for (const name of [...CONTROL, ...FOCUS_RING, "min-h-24", "resize-y"]) {
      expect(textarea.classList).toContain(name);
    }
  });
});

describe("Select", () => {
  it("is a native select with a decorative chevron", () => {
    const { container } = render(
      <Select aria-label="Relationship" placeholder="Select...">
        <option value="MOTHER">Mother</option>
        <option value="FATHER">Father</option>
      </Select>,
    );
    const select = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Relationship",
    });
    expect(select.tagName).toBe("SELECT");
    for (const name of [...CONTROL, ...FOCUS_RING, "h-11", "appearance-none"]) {
      expect(select.classList).toContain(name);
    }
    const chevron = container.querySelector("svg");
    expect(chevron?.getAttribute("aria-hidden")).toBe("true");
    expect(chevron?.classList).toContain("pointer-events-none");
  });

  it("placeholder: a disabled, hidden empty first option, selected by default", () => {
    render(
      <Select aria-label="Relationship" placeholder="Select...">
        <option value="MOTHER">Mother</option>
      </Select>,
    );
    const select = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Relationship",
    });
    const first = select.options[0];
    expect(first?.textContent).toBe("Select...");
    expect(first?.value).toBe("");
    expect(first?.disabled).toBe(true);
    expect(first?.hidden).toBe(true);
    expect(select.value).toBe("");
  });

  it("placeholder: a given defaultValue or value still wins", () => {
    render(
      <>
        <Select
          aria-label="Relationship"
          placeholder="Select..."
          defaultValue="FATHER"
        >
          <option value="MOTHER">Mother</option>
          <option value="FATHER">Father</option>
        </Select>
        <Select
          aria-label="Sex"
          placeholder="Select..."
          value="FEMALE"
          onChange={() => undefined}
        >
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </Select>
      </>,
    );
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Relationship" })
        .value,
    ).toBe("FATHER");
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Sex" }).value,
    ).toBe("FEMALE");
  });

  it("without a placeholder there is no empty option", () => {
    render(
      <Select aria-label="Relationship">
        <option value="MOTHER">Mother</option>
      </Select>,
    );
    const select = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Relationship",
    });
    expect(select.options.length).toBe(1);
    expect(select.value).toBe("MOTHER");
  });

  it("disabled sets aria-disabled", () => {
    render(
      <Select aria-label="Relationship" disabled>
        <option value="MOTHER">Mother</option>
      </Select>,
    );
    const select = screen.getByRole("combobox", { name: "Relationship" });
    expect(select.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("FormField", () => {
  it("links the label to the control", () => {
    render(
      <FormField label="Full name">
        {(field) => <Input {...field} />}
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: "Full name" });
    const label = screen.getByText("Full name");
    expect(label.tagName).toBe("LABEL");
    expect(label.classList).toContain("text-15");
    expect(label.classList).toContain("font-medium");
    expect(input.getAttribute("aria-invalid")).toBe(null);
    expect(input.getAttribute("aria-describedby")).toBe(null);
  });

  it("links the hint through aria-describedby", () => {
    render(
      <FormField
        label="Username"
        hint="4 to 30 characters: lowercase letters, digits, dot, underscore."
      >
        {(field) => <Input {...field} />}
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: "Username" });
    const hint = screen.getByText(
      "4 to 30 characters: lowercase letters, digits, dot, underscore.",
    );
    expect(hint.classList).toContain("text-text-muted");
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("an error sets aria-invalid and is described, after the hint", () => {
    render(
      <FormField
        label="Mobile number"
        hint="09XXXXXXXXX or +639XXXXXXXXX"
        error="Enter a mobile number like 09171234567."
      >
        {(field) => <Input {...field} />}
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: "Mobile number" });
    const hint = screen.getByText("09XXXXXXXXX or +639XXXXXXXXX");
    const error = screen.getByText("Enter a mobile number like 09171234567.");
    expect(error.classList).toContain("text-danger-text");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      `${hint.id} ${error.id}`,
    );
  });

  it("required: marks the label and sets required on the control", () => {
    render(
      <FormField label="Month" required>
        {(field) => <Input {...field} />}
      </FormField>,
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Month",
    });
    expect(input.required).toBe(true);
    const mark = screen.getByText("*");
    expect(mark.getAttribute("aria-hidden")).toBe("true");
    expect(mark.classList).toContain("text-primary");
  });

  it("works with Select and Textarea", () => {
    render(
      <>
        <FormField label="Relationship" error="Choose a relationship.">
          {(field) => (
            <Select {...field}>
              <option value="MOTHER">Mother</option>
            </Select>
          )}
        </FormField>
        <FormField label="Narrative">
          {(field) => <Textarea {...field} />}
        </FormField>
      </>,
    );
    expect(
      screen
        .getByRole("combobox", { name: "Relationship" })
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(screen.getByRole("textbox", { name: "Narrative" }).tagName).toBe(
      "TEXTAREA",
    );
  });
});
