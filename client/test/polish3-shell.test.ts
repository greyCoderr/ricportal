// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";
import { CLIENT_DIR } from "./source-files";

// Polish Round 3, H1: the login field tokens (D2) and the calendar dish names
// (D5), checked in the real stylesheet compiled with Tailwind.

const STYLES_DIR = join(CLIENT_DIR, "src/styles");
const TAILWIND_DIR = dirname(
  dirname(createRequire(import.meta.url).resolve("tailwindcss")),
);
const TOKENS = readFileSync(join(STYLES_DIR, "tokens.css"), "utf8");
const INDEX = readFileSync(join(STYLES_DIR, "index.css"), "utf8");

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
  const compiler = await compile(INDEX, { base: STYLES_DIR, loadStylesheet });
  build = (candidates) => compiler.build(candidates);
});

// The rule for one selector in a CSS text, from "{" to the matching "}".
function rule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `no rule for ${selector}`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start) + 1);
}

describe("login fields (D2)", () => {
  it("the tokens follow the Figma proportion: 50 px high in a 1280 px frame, 16 px text", () => {
    expect(TOKENS).toMatch(
      /--login-field-h:\s*clamp\(44px,\s*3\.9vw,\s*56px\);/,
    );
    expect(TOKENS).toMatch(/--login-field-text:\s*16px;/);
  });

  it("the classes the login form uses produce those tokens", () => {
    const css = build([
      "h-(--login-field-h)",
      "text-(length:--login-field-text)",
    ]);
    expect(css).toContain("height: var(--login-field-h)");
    expect(css).toContain("font-size: var(--login-field-text)");
  });
});

describe("calendar dish names (D5)", () => {
  it("use at most two lines with an ellipsis", () => {
    const title = rule(
      INDEX,
      ".ric-calendar .fc-daygrid-event .fc-event-title",
    );
    expect(title).toContain("display: -webkit-box");
    expect(title).toContain("-webkit-line-clamp: 2");
    expect(title).toContain("-webkit-box-orient: vertical");
    expect(title).toContain("overflow: hidden");
  });

  it("size 11 to 13 px by the cell width, never below 11 px", () => {
    const title = rule(
      INDEX,
      ".ric-calendar .fc-daygrid-event .fc-event-title",
    );
    expect(title).toMatch(/font-size:\s*clamp\(11px,\s*[\d.]+cqi,\s*13px\)/);
    const events = rule(INDEX, ".ric-calendar .fc-daygrid-day-events");
    expect(events).toContain("container-type: inline-size");
  });

  it("show the whole name on keyboard focus", () => {
    const focused = rule(
      INDEX,
      ".ric-calendar .fc-daygrid-event:focus-visible .fc-event-title",
    );
    expect(focused).toContain("-webkit-line-clamp: unset");
  });
});
