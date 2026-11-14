import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { buildApp, createUser, TEST_PASSWORD } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-001 (docs/AUDIT_REPORT.md): wrong passwords sent at the same moment
// must each count, so the lock of BR-19 cannot be passed with parallel requests.

let prisma: PrismaClient;
let clock: Date;
let app: ReturnType<typeof buildApp>;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  clock = new Date("2026-11-06T02:00:00Z");
  app = buildApp(prisma, { now: () => clock });
});

function login(username: string, password: string) {
  return request(app).post("/api/auth/login").send({ username, password });
}

describe("lockout with parallel requests (BR-19, AUD-001)", () => {
  it("ten wrong passwords at once: five are checked, five are locked out", async () => {
    const user = await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
    });

    const answers = await Promise.all(
      Array.from({ length: 10 }, () => login("admin.t", "Wrong2026pw")),
    );

    const statuses = answers.map((res) => res.status).sort();
    expect(statuses).toEqual([
      401, 401, 401, 401, 401, 429, 429, 429, 429, 429,
    ]);
    for (const res of answers.filter((answer) => answer.status === 429)) {
      expect(res.headers["retry-after"]).toBe("900");
    }

    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.failedLoginCount).toBe(5);
    expect(row.lockedUntil).not.toBe(null);

    const right = await login("admin.t", TEST_PASSWORD);
    expect(right.status).toBe(429);
  });

  it("the right password on the fifth attempt still logs in and clears the count", async () => {
    const user = await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
    });
    for (let i = 0; i < 4; i += 1) {
      expect((await login("admin.t", "Wrong2026pw")).status).toBe(401);
    }
    expect((await login("admin.t", TEST_PASSWORD)).status).toBe(200);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.failedLoginCount).toBe(0);
    expect(row.lockedUntil).toBe(null);
  });

  it("after the lock runs out the count starts again at one", async () => {
    const user = await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
    });
    for (let i = 0; i < 5; i += 1) {
      await login("admin.t", "Wrong2026pw");
    }
    clock = new Date(clock.getTime() + 16 * 60_000);
    expect((await login("admin.t", "Wrong2026pw")).status).toBe(401);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.failedLoginCount).toBe(1);
    expect(row.lockedUntil).toBe(null);
  });
});
