// @vitest-environment node
import { describe, expect, it } from "vitest";
import { clientSourceFiles } from "./source-files";

// Colors live only in src/styles/tokens.css (DEC-022). Everywhere else the
// client uses semantic token classes such as bg-primary or text-muted.
const TOKENS_FILE = "src/styles/tokens.css";

const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|oklch)\s*\(/gi;
// Tailwind's default palette is reset in tokens.css; these names must not appear.
const PALETTE =
  /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|placeholder|accent|caret|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

function findings(pattern: RegExp): string[] {
  const found: string[] = [];
  for (const file of clientSourceFiles()) {
    if (file.path === TOKENS_FILE) {
      continue;
    }
    file.text.split("\n").forEach((line, index) => {
      for (const match of line.matchAll(pattern)) {
        found.push(`${file.path}:${String(index + 1)} ${match[0]}`);
      }
    });
  }
  return found;
}

describe("client colors come only from tokens.css", () => {
  it("scans the client source files", () => {
    const paths = clientSourceFiles().map((file) => file.path);
    expect(paths).toContain(TOKENS_FILE);
    expect(paths).toContain("index.html");
    expect(paths.some((path) => path.endsWith(".test.ts"))).toBe(false);
  });

  it("has no hard-coded hex colors outside tokens.css", () => {
    expect(findings(HEX)).toEqual([]);
  });

  it("has no rgb(), rgba(), hsl(), hsla() or oklch() outside tokens.css", () => {
    expect(findings(COLOR_FUNCTION)).toEqual([]);
  });

  it("has no Tailwind default palette classes (only semantic tokens)", () => {
    expect(findings(PALETTE)).toEqual([]);
  });
});

// The warning hue #EDF902 is never used as text (DEC-023); text uses
// `text-warning-text`. `text-warning` followed by anything but "-" is banned.
const WARNING_AS_TEXT = /\btext-warning(?![-\w])/g;

describe("color scan self-checks", () => {
  it("the palette pattern catches default palette classes", () => {
    expect(
      'className="bg-green-500 text-red-600 border-gray-300"'.match(PALETTE),
    ).toEqual(["bg-green-500", "text-red-600", "border-gray-300"]);
    expect('className="bg-success-soft text-danger-text"'.match(PALETTE)).toBe(
      null,
    );
  });

  it("the warning pattern catches the hue used as text only", () => {
    expect(
      'className="text-warning hover:text-warning"'.match(WARNING_AS_TEXT),
    ).toEqual(["text-warning", "text-warning"]);
    expect(
      'className="text-warning-text bg-warning-soft fill-warning"'.match(
        WARNING_AS_TEXT,
      ),
    ).toBe(null);
  });
});

describe("warning hue", () => {
  it("is never used as a text color", () => {
    expect(findings(WARNING_AS_TEXT)).toEqual([]);
  });
});
