import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { TEST_DEFAULT_PASSWORD } from "../test-config.js";
import { buildApp, loginAs, seedWorld, TEST_PASSWORD } from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

// AUD-002 (docs/AUDIT_REPORT.md): a forced change must really change the
// password (BR-05). The same password, or the default one, is refused.

type ErrorBody = {
  error: { code: string; details: { field: string; message: string }[] };
};
type Me = { data: { mustChangePassword: boolean } };

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let world: Awaited<ReturnType<typeof seedWorld>>;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  world = await seedWorld(prisma);
});

function change(
  agent: Awaited<ReturnType<typeof loginAs>>,
  currentPassword: string,
  newPassword: string,
) {
  return agent
    .post("/api/auth/change-password")
    .send({ currentPassword, newPassword, confirmPassword: newPassword });
}

describe("change-password refuses a password that changes nothing (BR-05, AUD-002)", () => {
  it("after a reset, the default password cannot be kept", async () => {
    const teacher = await loginAs(app, "teacher.a");
    await teacher.post(
      `/api/parents/${String(world.parentA.id)}/reset-password`,
    );
    const parent = await loginAs(app, "parent.a", TEST_DEFAULT_PASSWORD);

    const res = await change(
      parent,
      TEST_DEFAULT_PASSWORD,
      TEST_DEFAULT_PASSWORD,
    );

    expect(res.status).toBe(400);
    const body = res.body as ErrorBody;
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details[0]?.field).toBe("newPassword");
    const me = (await parent.get("/api/auth/me")).body as Me;
    expect(me.data.mustChangePassword).toBe(true);
    expect((await parent.get("/api/parent-schedule")).status).toBe(403);
  });

  it("a user cannot change to the password they already have", async () => {
    const parent = await loginAs(app, "parent.a");
    const res = await change(parent, TEST_PASSWORD, TEST_PASSWORD);
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.details[0]?.field).toBe("newPassword");
    // The session was not replaced, so it still works.
    expect((await parent.get("/api/auth/me")).status).toBe(200);
  });

  it("nobody can choose the default password, whatever the current one is", async () => {
    const parent = await loginAs(app, "parent.a");
    const res = await change(parent, TEST_PASSWORD, TEST_DEFAULT_PASSWORD);
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.details[0]?.field).toBe("newPassword");
    await expect(
      loginAs(app, "parent.a", TEST_DEFAULT_PASSWORD),
    ).rejects.toThrow();
  });

  it("a wrong current password is still reported first", async () => {
    const parent = await loginAs(app, "parent.a");
    const res = await change(parent, "Wrong2026pw", "Wrong2026pw");
    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.details[0]?.field).toBe(
      "currentPassword",
    );
  });

  it("a really new password is accepted", async () => {
    const parent = await loginAs(app, "parent.a");
    expect((await change(parent, TEST_PASSWORD, "Fresh2026pw")).status).toBe(
      200,
    );
    await loginAs(app, "parent.a", "Fresh2026pw");
  });
});
