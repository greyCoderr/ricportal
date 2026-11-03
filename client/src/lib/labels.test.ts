import { describe, expect, it } from "vitest";
import { LABELS } from "./labels";

describe("LABELS", () => {
  it('uses "RIC Teacher" for the teacher role (A-01)', () => {
    expect(LABELS.teacher).toBe("RIC Teacher");
  });

  it("names the app, the other roles and the center", () => {
    expect(LABELS.appName).toBe("RICPortal");
    expect(LABELS.admin).toBe("Administrator");
    expect(LABELS.parent).toBe("Parent");
    expect(LABELS.center).toBe("RIC Children Center");
  });

  it("has only non-empty strings", () => {
    for (const value of Object.values(LABELS)) {
      expect(typeof value).toBe("string");
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
