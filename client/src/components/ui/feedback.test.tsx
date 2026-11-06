import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorBoundary } from "./ErrorBoundary";
import { ErrorState } from "./ErrorState";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Banner", () => {
  it.each([
    ["info", "status", "bg-info-soft", "border-info", "text-info-text"],
    ["success", "status", "bg-success-soft", "border-success", "text-success"],
    [
      "warning",
      "alert",
      "bg-warning-soft",
      "border-warning",
      "text-warning-text",
    ],
    ["danger", "alert", "bg-danger-soft", "border-danger", "text-danger-text"],
  ] as const)(
    "%s: role %s, soft fill, 4px left border in the hue, AA text",
    (tone, role, fill, border, text) => {
      render(
        <Banner tone={tone}>
          This day is locked by your teacher. You can view it but not change it.
        </Banner>,
      );
      const banner = screen.getByRole(role);
      for (const name of [
        fill,
        border,
        text,
        "border-l-4",
        "rounded-control",
        "p-3",
        "text-15",
      ]) {
        expect(banner.classList).toContain(name);
      }
      expect(banner.textContent).toContain(
        "This day is locked by your teacher.",
      );
    },
  );

  it.each([
    ["info", "circle-alert"],
    ["success", "circle-check"],
    ["warning", "circle-alert"],
    ["danger", "circle-alert"],
  ] as const)(
    "%s shows the %s icon, hidden from screen readers",
    (tone, icon) => {
      const { container } = render(<Banner tone={tone}>Message</Banner>);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("data-icon")).toBe(icon);
    },
  );

  it("shows an optional title in SemiBold and an optional action", () => {
    render(
      <Banner
        tone="warning"
        title="Over budget"
        action={<Button size="sm">Review items</Button>}
      >
        The total is PHP 120.00 over the daily budget.
      </Banner>,
    );
    const title = screen.getByText("Over budget");
    expect(title.classList).toContain("font-semibold");
    expect(screen.getByRole("button", { name: "Review items" })).toBeDefined();
  });
});

describe("EmptyState", () => {
  it("shows the given heading and text, left-aligned, with no card", () => {
    const { container } = render(
      <EmptyState title="No students enrolled at Sta. Cruz RIC Center yet.">
        Add a student to start the Child&apos;s Record.
      </EmptyState>,
    );
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "No students enrolled at Sta. Cruz RIC Center yet.",
    });
    expect(heading.classList).toContain("text-16");
    expect(heading.classList).toContain("font-semibold");
    const body = screen.getByText("Add a student to start the Child's Record.");
    expect(body.classList).toContain("text-text-secondary");
    const root = container.firstElementChild;
    expect(root?.className).not.toMatch(/shadow-|border|text-center/);
  });

  it("has no default text", () => {
    const { container } = render(<EmptyState title="Nothing here for Rice." />);
    expect(container.textContent).toBe("Nothing here for Rice.");
  });

  it("takes a heading level, an icon and an action", () => {
    const { container } = render(
      <EmptyState
        title="No reports for October 2026."
        headingLevel={3}
        icon="circle-check"
        action={<Button>Submit a report</Button>}
      />,
    );
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "No reports for October 2026.",
      }),
    ).toBeDefined();
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.classList).toContain("text-text-muted");
    expect(
      screen.getByRole("button", { name: "Submit a report" }),
    ).toBeDefined();
  });
});

describe("ErrorState", () => {
  it("is an alert with a heading, the message and a danger icon", () => {
    const { container } = render(
      <ErrorState
        title="Could not load the students of Sta. Cruz RIC Center."
        message="Cannot reach the server. Please check your connection and try again."
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain(
      "Cannot reach the server. Please check your connection and try again.",
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Could not load the students of Sta. Cruz RIC Center.",
      }),
    ).toBeDefined();
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.classList).toContain("text-danger-text");
    expect(screen.queryByRole("button")).toBe(null);
  });

  it("shows Retry when onRetry is given and calls it", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Could not load the menu." onRetry={onRetry} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry.classList).toContain("bg-surface");
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("Retry shows the busy state while retrying", () => {
    render(
      <ErrorState
        title="Could not load the menu."
        onRetry={() => undefined}
        retrying
      />,
    );
    expect(
      screen.getByRole("button", { name: "Retry" }).getAttribute("aria-busy"),
    ).toBe("true");
  });
});

describe("ErrorBoundary default fallback", () => {
  it("shows the approved page error with a Reload button", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Broken(): never {
      throw new Error("Broken child");
    }
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeDefined();
    expect(
      screen.getByRole("heading", {
        name: "Something went wrong on this page.",
      }),
    ).toBeDefined();
    expect(screen.getByText("Reload the page to try again.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Reload" })).toBeDefined();
  });
});
