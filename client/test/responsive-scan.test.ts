// @vitest-environment node
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
