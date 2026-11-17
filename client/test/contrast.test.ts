// @vitest-environment node
import { describe, expect, it } from "vitest";
import { contrastRatio, readColorTokens } from "./contrast";

// Every foreground/background pair the tokens are meant for. Text needs 4.5:1
// (WCAG AA, normal text); a control border needs 3:1 (non-text contrast).
// There are no known failures: every pair must pass (DEC-023). A new pair
// added here that fails makes this test fail.
const PAIRS = [
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "text-secondary", bg: "surface", min: 4.5 },
  { fg: "text-muted", bg: "surface", min: 4.5 },
  { fg: "text-placeholder", bg: "surface", min: 4.5 },
  { fg: "primary", bg: "surface", min: 4.5 },
  { fg: "primary-contrast", bg: "primary", min: 4.5 },
  { fg: "primary-contrast", bg: "primary-hover", min: 4.5 },
  { fg: "accent", bg: "surface", min: 4.5 },
  { fg: "danger-text", bg: "surface", min: 4.5 },
  { fg: "info-text", bg: "surface", min: 4.5 },
  { fg: "warning-text", bg: "surface", min: 4.5 },
  { fg: "nav-text", bg: "nav", min: 4.5 },
  { fg: "nav-selected-text", bg: "nav-selected", min: 4.5 },
  { fg: "success", bg: "success-soft", min: 4.5 },
  { fg: "warning-text", bg: "warning-soft", min: 4.5 },
  { fg: "info-text", bg: "info-soft", min: 4.5 },
  { fg: "danger-text", bg: "danger-soft", min: 4.5 },
  { fg: "text", bg: "accent-soft", min: 4.5 },
  { fg: "border", bg: "surface", min: 3 },
  { fg: "border-subtle", bg: "surface", min: 3 },
  { fg: "text", bg: "calendar-bar", min: 4.5 },
  { fg: "text", bg: "nav-selected", min: 4.5 },
  { fg: "primary-contrast", bg: "tag", min: 4.5 },
  { fg: "text", bg: "tag-tint", min: 4.5 },
  { fg: "primary-contrast", bg: "login-ground", min: 4.5 },
  { fg: "nav-selected", bg: "login-ground", min: 4.5 },
] as const;

describe("token contrast (WCAG AA)", () => {
  const tokens = readColorTokens();

  it.each(PAIRS)("$fg on $bg", ({ fg, bg, min }) => {
    const foreground = tokens.get(fg);
    const background = tokens.get(bg);
    const surface = tokens.get("surface");
    expect(foreground, `--color-${fg} missing`).toBeDefined();
    expect(background, `--color-${bg} missing`).toBeDefined();
    expect(surface, "--color-surface missing").toBeDefined();

    const ratio = contrastRatio(foreground ?? "", background ?? "", surface);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });

  it("computes the WCAG ratio correctly", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("mixes a translucent background over the page first", () => {
    // #ff0000 at 0x3d (23.9%) over white is about #ffc3c3.
    expect(contrastRatio("#ff0000", "#ff00003d")).toBeCloseTo(2.6, 1);
  });

  it("would catch the client's original failing colors", () => {
    // The Figma originals that DEC-023 replaced must stay below AA, so the
    // check above is known to bite.
    expect(contrastRatio("#edf902", "#edf9023d")).toBeLessThan(4.5);
    expect(contrastRatio("#bfbfbf", "#ffffff")).toBeLessThan(4.5);
    expect(contrastRatio("#ffffff", "#ff8282")).toBeLessThan(4.5);
  });
});
