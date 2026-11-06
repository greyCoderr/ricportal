// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";
import { readColorTokens } from "./contrast";
import { CLIENT_DIR } from "./source-files";

// Sample elements for every token (P0-T11 Done-when). They live only in this
// test, so nothing reaches the production bundle: the real stylesheet
// (src/styles/index.css with tokens.css) is compiled with Tailwind and each
// sample class must produce CSS that uses its token.

const STYLES_DIR = join(CLIENT_DIR, "src/styles");
const TAILWIND_DIR = dirname(
  dirname(createRequire(import.meta.url).resolve("tailwindcss")),
);

function loadStylesheet(id: string, base: string) {
  const path =
    id === "tailwindcss" ? join(TAILWIND_DIR, "index.css") : resolve(base, id);
  return Promise.resolve({
    path,
    base: dirname(path),
    content: readFileSync(path, "utf8"),
  });
}

let build: (candidates: string[]) => string;

beforeAll(async () => {
  const css = readFileSync(join(STYLES_DIR, "index.css"), "utf8");
  const compiler = await compile(css, { base: STYLES_DIR, loadStylesheet });
  build = (candidates) => compiler.build(candidates);
});

function ruleFor(output: string, className: string): string | undefined {
  const start = output.indexOf(`.${className} {`);
  if (start === -1) {
    return undefined;
  }
  return output.slice(start, output.indexOf("}", start) + 1);
}

const COLOR_TOKENS = [
  "primary",
  "primary-contrast",
  "primary-hover",
  "accent",
  "accent-soft",
  "success",
  "success-soft",
  "warning",
  "warning-soft",
  "warning-text",
  "info",
  "info-soft",
  "info-text",
  "danger",
  "danger-soft",
  "danger-text",
  "surface",
  "text",
  "text-secondary",
  "text-muted",
  "text-placeholder",
  "border",
  "border-subtle",
  "nav",
  "nav-text",
  "nav-selected",
  "nav-selected-text",
  "header",
  "overlay",
];
const TEXT_SIZES = [10, 11, 12, 13, 15, 16, 18, 20, 24, 40, 42, 48];
const RADII = ["cell", "control", "card", "icon"];
const SHADOWS = {
  header: "0 4px 20px 4px",
  card: "1px 1px 10px 1px",
  panel: "2px 2px 8px 1px",
};

describe("design tokens render", () => {
  it("defines exactly the planned color tokens", () => {
    expect([...readColorTokens().keys()].sort()).toEqual(
      [...COLOR_TOKENS].sort(),
    );
  });

  it.each(COLOR_TOKENS)("bg-%s uses its color token", (token) => {
    const rule = ruleFor(build([`bg-${token}`]), `bg-${token}`);
    expect(rule).toContain(`var(--color-${token})`);
  });

  it.each(TEXT_SIZES)("text-%i uses its size token", (size) => {
    const output = build([`text-${String(size)}`]);
    expect(ruleFor(output, `text-${String(size)}`)).toContain(
      `var(--text-${String(size)})`,
    );
    expect(output).toContain(`--text-${String(size)}: ${String(size)}px`);
  });

  it.each(RADII)("rounded-%s uses its radius token", (name) => {
    expect(ruleFor(build([`rounded-${name}`]), `rounded-${name}`)).toContain(
      `var(--radius-${name})`,
    );
  });

  it.each(Object.entries(SHADOWS))("shadow-%s is %s", (name, geometry) => {
    expect(ruleFor(build([`shadow-${name}`]), `shadow-${name}`)).toContain(
      geometry,
    );
  });

  it("font-sans is Montserrat and tracking-label is 0.1em", () => {
    const output = build(["font-sans", "tracking-label"]);
    expect(output).toMatch(/--font-sans: "Montserrat"/);
    expect(ruleFor(output, "tracking-label")).toContain(
      "var(--tracking-label)",
    );
    expect(output).toContain("--tracking-label: 0.1em");
  });

  it("Tailwind defaults for colors, sizes, radius and shadows are reset", () => {
    const output = build([
      "bg-green-500",
      "text-red-600",
      "text-sm",
      "text-2xl",
      "rounded-lg",
      "shadow-md",
    ]);
    for (const name of [
      "bg-green-500",
      "text-red-600",
      "text-sm",
      "text-2xl",
      "rounded-lg",
      "shadow-md",
    ]) {
      expect(ruleFor(output, name), name).toBeUndefined();
    }
  });
});
