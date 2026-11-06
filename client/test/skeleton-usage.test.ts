// @vitest-environment node
import { describe, expect, it } from "vitest";
import { clientSourceFiles } from "./source-files";

// Any container that shows Skeleton blocks must say it is loading (DEC-028):
// it wraps them in SkeletonGroup, which sets aria-busy="true" and holds the
// visually hidden "Loading..." text. The Skeleton component's own file is the
// only exception.
const SKELETON_FILE = "src/components/ui/Skeleton.tsx";
const USES_SKELETON = /<Skeleton\b(?!Group)/;
const USES_GROUP = /<SkeletonGroup\b/;

function missingGroup(text: string): boolean {
  return USES_SKELETON.test(text) && !USES_GROUP.test(text);
}

describe("Skeleton usage", () => {
  it("every file that renders Skeleton also renders SkeletonGroup", () => {
    const offenders = clientSourceFiles()
      .filter((file) => file.path !== SKELETON_FILE)
      .filter((file) => missingGroup(file.text))
      .map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it("the check catches a Skeleton without a SkeletonGroup", () => {
    expect(missingGroup('<div><Skeleton className="h-4" /></div>')).toBe(true);
    expect(
      missingGroup(
        '<SkeletonGroup><Skeleton className="h-4" /></SkeletonGroup>',
      ),
    ).toBe(false);
    expect(missingGroup("<SkeletonGroup />")).toBe(false);
    expect(missingGroup("<p>No skeleton here</p>")).toBe(false);
  });
});
