import { describe, expect, it } from "vitest";
import { assertDemoDatabase, DemoSeedRefused } from "../prisma/demo-guard.js";

const OK = "mysql://root@127.0.0.1:3306/ricportal";

describe("assertDemoDatabase (sprint plan S6)", () => {
  it("allows the local ricportal database outside production", () => {
    expect(() => {
      assertDemoDatabase(OK, "development");
    }).not.toThrow();
    expect(() => {
      assertDemoDatabase("mysql://root@localhost:3306/ricportal", undefined);
    }).not.toThrow();
  });

  it.each([
    ["production", OK, "production"],
    [
      "a remote host",
      "mysql://u:p@gateway.tidbcloud.com:4000/ricportal",
      "development",
    ],
    [
      "another database",
      "mysql://root@127.0.0.1:3306/ricportal_test",
      "development",
    ],
    ["another database", "mysql://root@127.0.0.1:3306/other", "development"],
    ["no URL", undefined, "development"],
    ["a bad URL", "not a url", "development"],
  ])("refuses %s", (_name, url, nodeEnv) => {
    expect(() => {
      assertDemoDatabase(url, nodeEnv);
    }).toThrow(DemoSeedRefused);
  });

  it("never prints the URL", () => {
    const secret = "mysql://user:secretpw@gateway.example.com:4000/ricportal";
    try {
      assertDemoDatabase(secret, "development");
      throw new Error("should have refused");
    } catch (error) {
      expect((error as Error).message).not.toContain("secretpw");
      expect((error as Error).message).not.toContain("gateway");
    }
  });
});
