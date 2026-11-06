import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stamp } from "./Stamp";

describe("Stamp (docs/ui-specs/ui-kit.md)", () => {
  it.each([
    ["SUBMITTED", "Submitted", "text-info-text", "border-info-text"],
    [
      "NEED_REVISION",
      "Need Revision",
      "text-warning-text",
      "border-warning-text",
    ],
    ["APPROVED", "Approved", "text-success", "border-success"],
  ] as const)(
    "%s shows the BR-07 word in its tone",
    (status, label, text, border) => {
      render(<Stamp status={status} />);
      const stamp = screen.getByText(label);
      expect(stamp.textContent).toBe(label);
      for (const name of [
        text,
        border,
        "border-2",
        "rounded-cell",
        "uppercase",
        "tracking-label",
        "-rotate-2",
      ]) {
        expect(stamp.classList).toContain(name);
      }
      expect(stamp.className).not.toMatch(/\bbg-/);
      expect(stamp.className).not.toMatch(/animate-/);
    },
  );
});
