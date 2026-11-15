import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, loginAs, seedWorld, TEST_PASSWORD } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// Stage J1d, docs/AUDIT_REPORT.md.

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  await seedWorld(prisma);
  await prisma.setting.create({
    data: { key: "currentSchoolYear", value: "2026-2027" },
  });
});

describe("logout ends the session on the server (AUD-012)", () => {
  it("a cookie copied before logout no longer works after it", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ username: "teacher.a", password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    const raw = login.headers["set-cookie"] as unknown as string[];
    const cookie = (raw[0] ?? "").split(";")[0] ?? "";
    expect(cookie).toContain("rp_session=");
    expect(
      (await request(app).get("/api/auth/me").set("Cookie", cookie)).status,
    ).toBe(200);

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);
    expect(logout.status).toBe(200);

    expect(
      (await request(app).get("/api/auth/me").set("Cookie", cookie)).status,
    ).toBe(401);
    // The account itself is fine: a new login works.
    await loginAs(app, "teacher.a");
  });
});
