// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, readColorTokens } from "./contrast";
import { CLIENT_DIR } from "./source-files";

// Plan 5, J2: the Login page against Figma 241:1732 (desktop, 1280 x 1020) and
// PARENT LOGIN 393:1102 (phones, 375 x 734). Checked in the real stylesheets.

const STYLES_DIR = join(CLIENT_DIR, "src/styles");
const TOKENS = readFileSync(join(STYLES_DIR, "tokens.css"), "utf8");
const INDEX = readFileSync(join(STYLES_DIR, "index.css"), "utf8");

// The text of one "@media (...) { ... }" block that holds the given marker.
function mediaBlock(css: string, query: string, marker: string): string {
  let from = 0;
  for (;;) {
    const start = css.indexOf(`@media ${query} {`, from);
    expect(start, `no ${query} block with ${marker}`).toBeGreaterThan(-1);
    let depth = 0;
    let end = start;
    for (let index = css.indexOf("{", start); index < css.length; index += 1) {
      if (css[index] === "{") {
        depth += 1;
      } else if (css[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index;
          break;
        }
      }
    }
    const block = css.slice(start, end + 1);
    if (block.includes(marker)) {
      return block;
    }
    from = end;
  }
}

describe("login on phones (393:1102)", () => {
  it("has the frame's dark red ground as a token", () => {
    expect(readColorTokens().get("login-ground")).toBe("#570707");
  });

  it("paints the ground and white text only under 1024 px", () => {
    const phone = mediaBlock(INDEX, "(max-width: 1023px)", ".ric-login");
    expect(phone).toContain("background-color: var(--color-login-ground)");
    expect(phone).toContain("color: var(--color-primary-contrast)");
  });

  it("keeps field errors and the focus ring readable on the dark ground", () => {
    const phone = mediaBlock(INDEX, "(max-width: 1023px)", ".ric-login");
    expect(phone).toMatch(
      /\.ric-login form > div:not\(\[role\]\) > p \{\s*color: var\(--color-nav-selected\)/,
    );
    expect(phone).toMatch(
      /\.ric-login :focus-visible \{\s*outline-color: var\(--color-primary-contrast\)/,
    );
    const tokens = readColorTokens();
    const ground = tokens.get("login-ground") ?? "";
    expect(
      contrastRatio(tokens.get("nav-selected") ?? "", ground),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(tokens.get("primary-contrast") ?? "", ground),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("uses the frame's sizes: brand 20, lines 14, title 24, labels 14", () => {
    expect(TOKENS).toMatch(/--login-brand:\s*20px;/);
    expect(TOKENS).toMatch(/--login-line:\s*14px;/);
    expect(TOKENS).toMatch(/--login-title:\s*24px;/);
    expect(TOKENS).toMatch(/--login-label:\s*14px;/);
  });
});

describe("login on a desktop (241:1732)", () => {
  it("one unit follows the frame: 1 px at 1280 x 800, from 0.75 to 1.12", () => {
    expect(TOKENS).toMatch(
      /--login-u:\s*clamp\(0\.75px,\s*min\(0\.078125vw,\s*0\.125vh\),\s*1\.12px\);/,
    );
  });

  it("the sizes are the frame's numbers times that unit", () => {
    const desktop = mediaBlock(TOKENS, "(min-width: 1024px)", "--login-title");
    for (const [name, size] of [
      ["emblem", 115],
      ["brand", 42],
      ["line", 24],
      ["title", 48],
      ["sub", 18],
      ["label", 20],
      ["action", 16],
      ["alt", 18],
    ] as const) {
      expect(desktop).toContain(
        `--login-${name}: calc(${String(size)} * var(--login-u));`,
      );
    }
  });

  it("labels are SemiBold, fields have the black border, buttons the field height", () => {
    expect(INDEX).toMatch(
      /\.ric-login label \{[^}]*font-size: var\(--login-label\);[^}]*font-weight: 600;/,
    );
    expect(INDEX).toMatch(
      /\.ric-login input:not\(\[aria-invalid\]\) \{\s*border-color: var\(--color-border\)/,
    );
    expect(INDEX).toMatch(
      /\.ric-login-action \{[^}]*height: var\(--login-field-h\);[^}]*font-size: var\(--login-action\);/,
    );
  });
});
