import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICON_NAMES, ICON_STROKE, Icon } from "./icons";

describe("Icon", () => {
  it("has one stroke width for every icon (DEC-028: 1.5)", () => {
    expect(ICON_STROKE).toBe(1.5);
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
