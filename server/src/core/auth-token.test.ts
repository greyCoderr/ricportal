import { passwordSchema } from "@ricportal/shared";
import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./auth-token.js";
import {
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from "./password.js";

const CONFIG = {
  JWT_SECRET: "test-secret-test-secret-test-secret-1234",
  SESSION_HOURS: 8,
};

describe("session token", () => {
  it("round-trips the user id and token version", async () => {
    const token = await signSessionToken(
      { userId: 7, tokenVersion: 3 },
      CONFIG,
    );
    expect(await verifySessionToken(token, CONFIG.JWT_SECRET)).toEqual({
      userId: 7,
      tokenVersion: 3,
    });
  });

  it("rejects a wrong secret, garbage, and an expired token", async () => {
    const start = new Date("2026-11-06T00:00:00Z");
    const token = await signSessionToken(
      { userId: 7, tokenVersion: 3 },
      CONFIG,
      start,
    );
    expect(
      await verifySessionToken(token, "another-secret-another-secret-12345"),
    ).toBe(null);
    expect(await verifySessionToken("garbage", CONFIG.JWT_SECRET)).toBe(null);

    const in7h = new Date(start.getTime() + 7 * 3600_000);
    expect(await verifySessionToken(token, CONFIG.JWT_SECRET, in7h)).not.toBe(
      null,
    );
    const in9h = new Date(start.getTime() + 9 * 3600_000);
    expect(await verifySessionToken(token, CONFIG.JWT_SECRET, in9h)).toBe(null);
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("Demo2026!", 4);
    expect(hash).not.toContain("Demo2026!");
    expect(await verifyPassword("Demo2026!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("temporary passwords always pass the password policy", () => {
    for (let i = 0; i < 200; i += 1) {
      expect(
        passwordSchema.safeParse(generateTemporaryPassword()).success,
      ).toBe(true);
    }
  });
});
