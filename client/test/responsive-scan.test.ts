// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { clientSourceFiles } from "./source-files";

// Source-level guards from the responsive pass (polish F6). jsdom has no layout,
// so these catch the patterns that broke the rules. They do not replace looking at
// the pages in a browser (docs/POLISH_LOG.md lists what to check by hand).

function filesWith(pattern: RegExp, exempt: string[] = []): string[] {
  return clientSourceFiles()
    .filter((file) => !exempt.includes(file.path))
    .filter((file) => pattern.test(file.text))
    .map((file) => file.path);
}

const STYLES = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/styles",
);
const COMPACT_QUERY = "@media (min-width: 1024px) and (pointer: fine)";

// Splits tokens.css at the desktop-fine block: what is inside applies only to a
// mouse on a wide screen, and everything else is the comfortable mode (D1).
function tokensByMode(): { compact: string; comfortable: string } {
  const css = readFileSync(resolve(STYLES, "tokens.css"), "utf8");
  // The last match: the @custom-variant line above it repeats the same query.
  const start = css.lastIndexOf(COMPACT_QUERY);
  expect(start).toBeGreaterThan(-1);
  const end = css.indexOf("\n}\n", start);
  return {
    compact: css.slice(start, end),
    comfortable: css.slice(0, start) + css.slice(end),
  };
}

describe("density modes (D1, D2 of docs/POLISH_PLAN_2.md)", () => {
  it("the root font size changes only inside the desktop-fine block", () => {
    const { compact, comfortable } = tokensByMode();
    expect(compact).toMatch(/html\s*\{\s*font-size: clamp\(12px,/);
    expect(comfortable).not.toMatch(/html\s*\{/);
    expect(comfortable).not.toMatch(/(^|\s)font-size:/);
  });

  it("the root font size is set in tokens.css and nowhere else", () => {
    const index = readFileSync(resolve(STYLES, "index.css"), "utf8");
    expect(index).not.toMatch(/html\s*\{/);
  });

  it("outside that block controls are 44 px and inputs 16 px", () => {
    const { comfortable } = tokensByMode();
    expect(comfortable).toContain("--control-h: 44px");
    expect(comfortable).toContain("--text-16: 16px");
    expect(comfortable).toContain("--spacing-11: var(--control-h)");
  });

  it("compact controls stay between 32 and 40 px", () => {
    const { compact } = tokensByMode();
    expect(compact).toMatch(/--control-h: clamp\(32px, [^,]+, 40px\)/);
  });

  it("compact text never goes below 12 px, or 11 px for captions", () => {
    const { compact } = tokensByMode();
    const floors = [...compact.matchAll(/--text-(\d+): clamp\((\d+)px,/g)];
    expect(floors.length).toBeGreaterThan(5);
    for (const [, name, floor] of floors) {
      expect(Number(floor), `--text-${name}`).toBeGreaterThanOrEqual(
        Number(name) <= 11 ? 11 : 12,
      );
    }
  });

  it("no screen sizes anything in fixed px except the phone drawer", () => {
    const fixed: string[] = [];
    for (const file of clientSourceFiles()) {
      for (const match of file.text.matchAll(
        /(?<![\w-])(?:[a-z]+:)*(?:size|h|min-h|max-h|max-w)-\[\d+px\]/g,
      )) {
        fixed.push(`${file.path}: ${match[0]}`);
      }
    }
    expect(fixed).toEqual([]);
  });
});

describe("dialogs in the content area (D4)", () => {
  const index = readFileSync(resolve(STYLES, "index.css"), "utf8");

  it("the modal is inset by the sidebar and keeps 24 px of margin", () => {
    expect(index).toMatch(
      /\.ric-modal\s*\{[^}]*inset: 0 0 0 var\(--sidebar-w\)/,
    );
    expect(index).toMatch(/--ric-dialog-gap: 24px/);
  });

  it("the sidebar width is exposed on :root and is 0 under 1024 px", () => {
    const { comfortable } = tokensByMode();
    expect(comfortable).toMatch(/:root\s*\{[^}]*--sidebar-w: 0px/);
    expect(comfortable).toMatch(
      /@media \(min-width: 1024px\)\s*\{\s*:root\s*\{\s*--sidebar-w: 290px/,
    );
  });
});

describe("responsive and date rules", () => {
  it("no screen uses the 32 px button, below the 44 px tap target", () => {
    expect(filesWith(/size="sm"/, ["src/components/ui/Button.tsx"])).toEqual(
      [],
    );
  });

  it("no native date picker: dates are masked MM/DD/YYYY fields (D7)", () => {
    expect(filesWith(/type="date"/)).toEqual([]);
  });

  it("no raw YYYY-MM-DD period or overlap date on a screen (D7)", () => {
    expect(
      filesWith(
        /\$\{[\w.?]*period(Start|End)\}|\{preview\.overlaps(\[0\]|\.at\(-1\))\}/,
      ),
    ).toEqual([]);
  });

  it("no fixed width wider than a small phone (360 px)", () => {
    const wide: string[] = [];
    for (const file of clientSourceFiles()) {
      for (const match of file.text.matchAll(
        /(?<![\w-])(?:min-)?w-\[(\d+)px\]/g,
      )) {
        if (Number(match[1]) > 360) {
          wide.push(`${file.path}: ${match[0]}`);
        }
      }
    }
    expect(wide).toEqual([]);
  });

  it("the phone drawer is capped to the screen", () => {
    const shell = clientSourceFiles().find(
      (file) => file.path === "src/app/layouts/AppShell.tsx",
    );
    expect(shell?.text).toContain("w-[290px] max-w-[85vw]");
  });

  it("no negative margin that a clipped column would cut off", () => {
    expect(filesWith(/\b(?:lg|md|xl):-m[lr]-\[/)).toEqual([]);
  });
});
