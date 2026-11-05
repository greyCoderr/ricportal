// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_DIR, clientSourceFiles } from "./source-files";

// Montserrat is self-hosted from @fontsource (DEC-022): only weights 300, 400,
// 500, 600 and 700, latin subset, and no external font host.
const EXPECTED = [
  "@fontsource/montserrat/latin-300.css",
  "@fontsource/montserrat/latin-400.css",
  "@fontsource/montserrat/latin-500.css",
  "@fontsource/montserrat/latin-600.css",
  "@fontsource/montserrat/latin-700.css",
];

describe("fonts", () => {
  it("imports exactly the five latin Montserrat weights", () => {
    const main = readFileSync(join(CLIENT_DIR, "src/main.tsx"), "utf8");
    const imports = [...main.matchAll(/import\s+"(@fontsource\/[^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(imports).toEqual(EXPECTED);
  });

  it("uses no external font or style host", () => {
    const external =
      /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|@import\s+url\(\s*["']?https?:/i;
    const found = clientSourceFiles()
      .filter((file) => external.test(file.text))
      .map((file) => file.path);
    expect(found).toEqual([]);
  });
});

describe("font package", () => {
  it("pins @fontsource/montserrat to an exact version", () => {
    const pkg = JSON.parse(
      readFileSync(join(CLIENT_DIR, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies?.["@fontsource/montserrat"]).toMatch(
      /^\d+\.\d+\.\d+$/,
    );
  });
});
