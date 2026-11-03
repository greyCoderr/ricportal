import { describe, expect, it } from "vitest";
import { APP_NAME } from "@ricportal/shared";

describe("@ricportal/shared", () => {
  it("resolves from the server workspace and exports the app name", () => {
    expect(APP_NAME).toBe("RICPortal");
  });
});
