import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "./api";
import { useZodForm } from "./use-zod-form";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the name."),
  age: z.coerce.number().int().min(1, "Enter the age."),
});

function Harness({
  onValid,
  serverError,
}: {
  onValid: (data: z.output<typeof schema>) => void;
  serverError?: unknown;
}) {
  const form = useZodForm(schema, { name: "", age: "" });
  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        onValid(data);
        if (serverError !== undefined) {
          form.applyError(serverError);
        }
      })}
    >
      <input
        aria-label="Name"
        name="name"
        value={form.values.name}
        onChange={(event) => {
          form.setValue("name", event.target.value);
        }}
        onBlur={() => {
          form.validateField("name");
        }}
      />
      <input
        aria-label="Age"
        name="age"
        value={form.values.age}
        onChange={(event) => {
          form.setValue("age", event.target.value);
        }}
      />
      <p>name error: {form.errors.name ?? "none"}</p>
      <p>age error: {form.errors.age ?? "none"}</p>
      <p>form error: {form.formError ?? "none"}</p>
      <button type="submit">Save</button>
    </form>
  );
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("useZodForm", () => {
  it("validates one field on blur, and clears its message on change", () => {
    render(<Harness onValid={vi.fn()} />);
    fireEvent.blur(screen.getByLabelText("Name"));
    expect(screen.getByText("name error: Enter the name.")).toBeDefined();
    expect(screen.getByText("age error: none")).toBeDefined();
    type("Name", "Ana");
    expect(screen.getByText("name error: none")).toBeDefined();
  });

  it("on submit shows every message, focuses the first, and does not call onValid", () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByText("name error: Enter the name.")).toBeDefined();
    expect(screen.getByText("age error: Enter the age.")).toBeDefined();
    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
  });

  it("passes parsed values on a valid submit", () => {
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    type("Name", " Ana ");
    type("Age", "3");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onValid).toHaveBeenCalledWith({ name: "Ana", age: 3 });
  });

  it("puts server field details under the field", () => {
    render(
      <Harness
        onValid={vi.fn()}
        serverError={
          new ApiError(409, "CONFLICT", "Taken.", [
            { field: "name", message: "This name is taken." },
          ])
        }
      />,
    );
    type("Name", "Ana");
    type("Age", "3");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("name error: This name is taken.")).toBeDefined();
    expect(screen.getByText("form error: none")).toBeDefined();
  });

  it("shows other server failures as the form error", () => {
    render(
      <Harness
        onValid={vi.fn()}
        serverError={new ApiError(422, "RULE_VIOLATION", "Not allowed now.")}
      />,
    );
    type("Name", "Ana");
    type("Age", "3");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("form error: Not allowed now.")).toBeDefined();
  });
});
