import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Skeleton, SkeletonGroup } from "./Skeleton";
import { Spinner } from "./Spinner";
import { STATUS_BADGES, StatusBadge } from "./StatusBadge";

describe("Card", () => {
  it("panel: bordered, input radius, padding 16, no shadow", () => {
    render(<Card>Family member 1</Card>);
    const card = screen.getByText("Family member 1");
    for (const name of [
      "rounded-control",
      "border",
      "border-border-subtle",
      "bg-surface",
      "p-4",
    ]) {
      expect(card.classList).toContain(name);
    }
    expect(card.className).not.toMatch(/shadow-/);
  });

  it("stat: 4px accent bottom border, card radius and the card shadow", () => {
    render(<Card variant="stat">Enrolled students</Card>);
    const card = screen.getByText("Enrolled students");
    for (const name of [
      "rounded-card",
      "border-b-4",
      "border-accent",
      "bg-surface",
      "shadow-card",
    ]) {
      expect(card.classList).toContain(name);
    }
    expect(card.classList).not.toContain("border-border-subtle");
  });
});

describe("Badge", () => {
  it.each([
    ["success", "bg-success-soft", "text-success"],
    ["info", "bg-info-soft", "text-info-text"],
    ["warning", "bg-warning-soft", "text-warning-text"],
    ["danger", "bg-danger-soft", "text-danger-text"],
  ] as const)("%s uses its soft fill and AA text token", (tone, fill, text) => {
    render(<Badge tone={tone}>Label</Badge>);
    const badge = screen.getByText("Label");
    for (const name of [fill, text, "rounded-card", "text-12", "font-medium"]) {
      expect(badge.classList).toContain(name);
    }
  });
});

describe("StatusBadge", () => {
  it("maps BR-07 statuses and Declined to the confirmed tones (DEC-028)", () => {
    expect(STATUS_BADGES).toEqual({
      SUBMITTED: { label: "Submitted", tone: "info" },
      NEED_REVISION: { label: "Need Revision", tone: "warning" },
      APPROVED: { label: "Approved", tone: "success" },
      DECLINED: { label: "Declined", tone: "danger" },
    });
  });

  it.each([
    ["SUBMITTED", "Submitted", "text-info-text"],
    ["NEED_REVISION", "Need Revision", "text-warning-text"],
    ["APPROVED", "Approved", "text-success"],
    ["DECLINED", "Declined", "text-danger-text"],
  ] as const)("%s shows the word %s", (status, label, text) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge.classList).toContain(text);
  });
});

describe("Spinner", () => {
  it("announces itself with a label and stops spinning for reduced motion", () => {
    render(<Spinner label="Saving" />);
    const spinner = screen.getByRole("status", { name: "Saving" });
    const svg = spinner.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.classList).toContain("animate-spin");
    expect(svg?.classList).toContain("motion-reduce:animate-none");
  });

  it("is decorative without a label", () => {
    const { container } = render(<Spinner />);
    expect(screen.queryByRole("status")).toBe(null);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});

describe("Skeleton", () => {
  it("is hidden from screen readers and still (no animation)", () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const block = container.firstElementChild;
    expect(block?.getAttribute("aria-hidden")).toBe("true");
    expect(block?.className).not.toMatch(/animate-/);
    expect(block?.classList).toContain("bg-skeleton");
  });

  it("SkeletonGroup sets aria-busy and has visually hidden Loading... text", () => {
    render(
      <SkeletonGroup>
        <Skeleton className="h-4 w-32" />
      </SkeletonGroup>,
    );
    const text = screen.getByText("Loading...");
    expect(text.classList).toContain("sr-only");
    const group = text.parentElement;
    expect(group?.getAttribute("aria-busy")).toBe("true");
  });

  it("SkeletonGroup accepts a more specific loading text", () => {
    render(
      <SkeletonGroup label="Loading the students of Bahay Nipa RIC Center...">
        <Skeleton className="h-4 w-32" />
      </SkeletonGroup>,
    );
    expect(
      screen
        .getByText("Loading the students of Bahay Nipa RIC Center...")
        .parentElement?.getAttribute("aria-busy"),
    ).toBe("true");
  });
});
