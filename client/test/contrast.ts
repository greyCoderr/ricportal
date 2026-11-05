import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CLIENT_DIR } from "./source-files";

// WCAG 2.x contrast helpers for the token contrast test (DEC-022, DEC-023).
// Colors are "#rrggbb" or "#rrggbbaa". A translucent color is first mixed
// over the opaque color behind it, as the browser would paint it.

export function readColorTokens(): Map<string, string> {
  const css = readFileSync(join(CLIENT_DIR, "src/styles/tokens.css"), "utf8");
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(
    /--color-([a-z0-9-]+):\s*(#[0-9a-f]{6}(?:[0-9a-f]{2})?)\s*;/gi,
  )) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) {
      tokens.set(name, value.toLowerCase());
    }
  }
  return tokens;
}

type Rgb = [number, number, number];

function parse(hex: string): { rgb: Rgb; alpha: number } {
  const byte = (start: number): number =>
    Number.parseInt(hex.slice(start, start + 2), 16);
  return {
    rgb: [byte(1), byte(3), byte(5)],
    alpha: hex.length === 9 ? byte(7) / 255 : 1,
  };
}

// Paints `hex` over the opaque color `under` and returns the result.
export function composite(hex: string, under: string): Rgb {
  const top = parse(hex);
  const bottom = parse(under).rgb;
  return [0, 1, 2].map(
    (i) => (top.rgb[i] ?? 0) * top.alpha + (bottom[i] ?? 0) * (1 - top.alpha),
  ) as Rgb;
}

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: Rgb): number {
  return (
    0.2126 * channel(rgb[0]) +
    0.7152 * channel(rgb[1]) +
    0.0722 * channel(rgb[2])
  );
}

// Contrast of `foreground` on `background`. Translucent colors are mixed
// over `page` (the surface color) first.
export function contrastRatio(
  foreground: string,
  background: string,
  page = "#ffffff",
): number {
  const bg = composite(background, page);
  const fg = composite(foreground, rgbToHex(bg));
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")}`;
}
