import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, IconButton } from "./Button";

const FOCUS_RING = [
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-text",
];

describe("Button", () => {
  it("defaults to the primary variant, size md (44 px) and type button", () => {
    render(<Button>Save Student</Button>);
    const button = screen.getByRole("button", { name: "Save Student" });
    expect(button.getAttribute("type")).toBe("button");
    for (const name of [
      "bg-primary",
      "text-primary-contrast",
      "hover:bg-primary-hover",
      "h-11",
      "rounded-control",
    ]) {
      expect(button.classList).toContain(name);
    }
  });

  it("size sm is 32 px high", () => {
    render(<Button size="sm">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.classList).toContain("h-8");
    expect(button.classList).not.toContain("h-11");
  });

  it("secondary is a bordered surface button", () => {
    render(<Button variant="secondary">View feedback</Button>);
    const button = screen.getByRole("button", { name: "View feedback" });
    for (const name of [
      "bg-surface",
      "border",
      "border-border-subtle",
      "text-text",
      "hover:border-border",
    ]) {
      expect(button.classList).toContain(name);
    }
    expect(button.classList).not.toContain("bg-primary");
  });

  it("has a visible focus ring", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    for (const name of FOCUS_RING) {
      expect(button.classList).toContain(name);
    }
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled: native disabled, aria-disabled, faded, no clicks", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole<HTMLButtonElement>("button", {
      name: "Save",
    });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.classList).toContain("disabled:opacity-50");
    expect(button.classList).toContain("disabled:cursor-not-allowed");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading: keeps its name, sets aria-busy, blocks clicks and stays focusable", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save Student
      </Button>,
    );
    const button = screen.getByRole<HTMLButtonElement>("button", {
      name: "Save Student",
    });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.disabled).toBe(false);
    expect(button.classList).not.toContain("hover:bg-primary-hover");
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("does not submit a form while loading", () => {
    const onSubmit = vi.fn((event: Event) => {
      event.preventDefault();
    });
    render(
      <form
        onSubmit={(event) => {
          onSubmit(event.nativeEvent);
        }}
      >
        <Button type="submit" loading>
          Create account
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("IconButton", () => {
  it("is 44 x 44 with an accessible name from its label", () => {
    render(<IconButton icon="eye" label="View profile" />);
    const button = screen.getByRole("button", { name: "View profile" });
    expect(button.getAttribute("aria-label")).toBe("View profile");
    expect(button.classList).toContain("size-11");
    for (const name of FOCUS_RING) {
      expect(button.classList).toContain(name);
    }
  });

  it("shows its label on hover and on keyboard focus", () => {
    render(<IconButton icon="eye" label="View profile" />);
    const button = screen.getByRole("button", { name: "View profile" });
    const visible = button.querySelector("[data-icon-label]");
    expect(visible?.textContent).toBe("View profile");
    expect(visible?.getAttribute("aria-hidden")).toBe("true");
    expect(visible?.classList).toContain("invisible");
    expect(visible?.classList).toContain("group-hover:visible");
    expect(visible?.classList).toContain("group-focus-visible:visible");
  });

  it("disabled: aria-disabled and no clicks", () => {
    const onClick = vi.fn();
    render(
      <IconButton icon="eye" label="View profile" disabled onClick={onClick} />,
    );
    const button = screen.getByRole("button", { name: "View profile" });
    expect(button.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
