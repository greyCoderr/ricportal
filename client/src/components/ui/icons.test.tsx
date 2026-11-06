import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICON_NAMES, ICON_STROKE, Icon } from "./icons";

// The geometry of each icon as published in lucide-static 1.70.0
// (cdn.jsdelivr.net/npm/lucide-static@1.70.0/icons/<name>.svg, fetched
// 2026-11-06). Each entry is one element: its tag and its attributes.
type Shape = [string, Record<string, string>];
const LUCIDE_1_70_0: Record<string, Shape[]> = {
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
  "circle-alert": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }],
  ],
  "circle-check": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m16 9-5.5 5.5L8 12" }],
  ],
  eye: [
    [
      "path",
      {
        d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      },
    ],
    ["circle", { cx: "12", cy: "12", r: "3" }],
  ],
  "loader-circle": [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]],
  "refresh-cw": [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }],
    ["path", { d: "M8 16H3v5" }],
  ],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }],
  ],
};

describe("Icon", () => {
  it("has one stroke width for every icon (DEC-028: 1.5)", () => {
    expect(ICON_STROKE).toBe(1.5);
  });

  it("every icon is pinned to Lucide 1.70.0", () => {
    expect([...ICON_NAMES].sort()).toEqual(Object.keys(LUCIDE_1_70_0).sort());
  });

  it.each(ICON_NAMES)("%s matches Lucide 1.70.0 exactly", (name) => {
    const { container } = render(<Icon name={name} />);
    const drawn = [...(container.querySelector("svg")?.children ?? [])].map(
      (element): Shape => {
        const attributes: Record<string, string> = {};
        for (const attribute of element.attributes) {
          if (attribute.name !== "vector-effect") {
            attributes[attribute.name] = attribute.value;
          }
        }
        return [element.tagName, attributes];
      },
    );
    expect(drawn).toEqual(LUCIDE_1_70_0[name]);
  });

  it("accepts a stroke width for a single use (the checkbox check mark)", () => {
    const { container } = render(<Icon name="check" strokeWidth={2} />);
    expect(container.querySelector("svg")?.getAttribute("stroke-width")).toBe(
      "2",
    );
  });

  it.each(ICON_NAMES)(
    "%s: currentColor stroke, non-scaling, decorative by default",
    (name) => {
      const { container } = render(<Icon name={name} />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      expect(svg?.getAttribute("focusable")).toBe("false");
      expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
      expect(svg?.getAttribute("fill")).toBe("none");
      expect(svg?.getAttribute("stroke")).toBe("currentColor");
      expect(svg?.getAttribute("stroke-width")).toBe("1.5");
      expect(svg?.getAttribute("stroke-linecap")).toBe("round");
      expect(svg?.getAttribute("stroke-linejoin")).toBe("round");
      const shapes = svg?.querySelectorAll("path, circle, line") ?? [];
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) {
        expect(shape.getAttribute("vector-effect")).toBe("non-scaling-stroke");
      }
    },
  );

  it("defaults to 20 px and accepts a size", () => {
    const { container } = render(
      <>
        <Icon name="eye" />
        <Icon name="chevron-down" size={16} />
      </>,
    );
    const [first, second] = container.querySelectorAll("svg");
    expect(first?.getAttribute("width")).toBe("20");
    expect(second?.getAttribute("height")).toBe("16");
  });

  it("is an image with a name when given a label", () => {
    // Attributes are read directly: getByRole's accessible-name pass on SVG
    // timed out under full-suite load (6.7 s) with the same meaning.
    const { container } = render(<Icon name="circle-check" label="Saved" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Saved");
    expect(svg?.getAttribute("aria-hidden")).toBe(null);
  });
});
