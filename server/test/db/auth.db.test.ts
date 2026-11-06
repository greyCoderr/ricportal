import {
  INVALID_LOGIN_MESSAGE,
  LOCKED_MESSAGE,
  STATUS_LOGIN_MESSAGES,
} from "@ricportal/shared";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createCenter,
  createUser,
  expectNoSecrets,
  loginAs,
  TEST_PASSWORD,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

type ErrorBody = { error: { code: string; message: string } };

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

describe("POST /api/auth/login", () => {
  it("logs in, sets the cookie flags and returns the user without secrets", async () => {
    const center = await createCenter(prisma, "Sibujo");
    await createUser(prisma, {
      username: "teacher.sibujo",
      role: "TEACHER",
      centerId: center.id,
    });

    const res = await login("teacher.sibujo", TEST_PASSWORD);

    expect(res.status).toBe(200);
    const body = res.body as {
      data: {
        username: string;
        role: string;
        centerName: string;
        mustChangePassword: boolean;
      };
    };
    expect(body.data.username).toBe("teacher.sibujo");
    expect(body.data.role).toBe("TEACHER");
    expect(body.data.centerName).toBe("Sibujo");
    expect(body.data.mustChangePassword).toBe(false);
    expectNoSecrets(res.body);

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toContain("rp_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=28800");
    expect(cookie).not.toContain("Secure");
  });

  it("username is case-insensitive", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    const res = await login("ADMIN.T", TEST_PASSWORD);
    expect(res.status).toBe(200);
  });

  it("wrong password and unknown user give the same 401", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    const wrong = await login("admin.t", "Wrong2026pw");
    const unknown = await login("nobody.here", "Wrong2026pw");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect((wrong.body as ErrorBody).error.message).toBe(INVALID_LOGIN_MESSAGE);
  });

  it.each(["PENDING", "DECLINED", "DISABLED"] as const)(
    "%s: own message after correct credentials only",
    async (status) => {
      const center = await createCenter(prisma, "Sibujo");
      await createUser(prisma, {
        username: "parent.x",
        role: "PARENT",
        centerId: center.id,
        status,
      });

      const right = await login("parent.x", TEST_PASSWORD);
      expect(right.status).toBe(403);
      expect((right.body as ErrorBody).error.message).toBe(
        STATUS_LOGIN_MESSAGES[status],
      );
      expect(right.headers["set-cookie"]).toBeUndefined();

      const wrong = await login("parent.x", "Wrong2026pw");
      expect(wrong.status).toBe(401);
      expect((wrong.body as ErrorBody).error.message).toBe(
        INVALID_LOGIN_MESSAGE,
      );
    },
  );

  it("records a successful login and clears failures", async () => {
    const user = await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
    });
    await login("admin.t", "Wrong2026pw");
    await login("admin.t", TEST_PASSWORD);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row.failedLoginCount).toBe(0);
    expect(row.lastLoginAt).not.toBe(null);
  });
});

describe("lockout (BR-19, DEC-026)", () => {
  async function failFive(username: string) {
    for (let i = 0; i < 5; i += 1) {
      const res = await login(username, "Wrong2026pw");
      expect(res.status).toBe(401);
    }
  }

  it("the sixth attempt is locked, right or wrong password, with Retry-After", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    await failFive("admin.t");

    const wrong = await login("admin.t", "Wrong2026pw");
    const right = await login("admin.t", TEST_PASSWORD);

    for (const res of [wrong, right]) {
      expect(res.status).toBe(429);
      expect((res.body as ErrorBody).error.code).toBe("RATE_LIMITED");
      expect((res.body as ErrorBody).error.message).toBe(LOCKED_MESSAGE);
      expect(res.headers["retry-after"]).toBe("900");
    }
    expect(right.body).toEqual(wrong.body);
  });

  it("Retry-After counts down and the lock ends after 15 minutes", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    await failFive("admin.t");

    clock = new Date(clock.getTime() + 5 * 60_000);
    const during = await login("admin.t", TEST_PASSWORD);
    expect(during.status).toBe(429);
    expect(during.headers["retry-after"]).toBe("600");

    clock = new Date(clock.getTime() + 10 * 60_000);
    const after = await login("admin.t", TEST_PASSWORD);
    expect(after.status).toBe(200);
  });

  it("locked and unknown usernames get identical status, body and header", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    await failFive("admin.t");
    await failFive("nobody.here");

    const locked = await login("admin.t", "Wrong2026pw");
    const unknown = await login("nobody.here", "Wrong2026pw");

    expect(unknown.status).toBe(locked.status);
    expect(unknown.body).toEqual(locked.body);
    expect(unknown.headers["retry-after"]).toBe(locked.headers["retry-after"]);
    expect(unknown.status).toBe(429);
  });

  it("a locked Pending account shows the lock, not the status message", async () => {
    const center = await createCenter(prisma, "Sibujo");
    await createUser(prisma, {
      username: "parent.x",
      role: "PARENT",
      centerId: center.id,
      status: "PENDING",
    });
    await failFive("parent.x");
    const res = await login("parent.x", TEST_PASSWORD);
    expect(res.status).toBe(429);
    expect((res.body as ErrorBody).error.message).toBe(LOCKED_MESSAGE);
  });
});

describe("session", () => {
  it("me returns the user; no cookie is 401; logout clears", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    const agent = await loginAs(app, "admin.t");

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expectNoSecrets(me.body);

    const anonymous = await request(app).get("/api/auth/me");
    expect(anonymous.status).toBe(401);

    const out = await agent.post("/api/auth/logout");
    expect(out.status).toBe(200);
    expect(out.headers["set-cookie"]?.[0]).toContain("rp_session=;");
    const after = await agent.get("/api/auth/me");
    expect(after.status).toBe(401);
  });

  it("an expired session is refused", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    const agent = await loginAs(app, "admin.t");
    clock = new Date(clock.getTime() + 9 * 3600_000);
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("a user disabled after login loses access at once", async () => {
    const user = await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
    });
    const agent = await loginAs(app, "admin.t");
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "DISABLED" },
    });
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/change-password", () => {
  it("changes the password, clears the flag and invalidates old tokens", async () => {
    await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
      mustChangePassword: true,
    });
    const oldAgent = await loginAs(app, "admin.t");
    const stolen = await loginAs(app, "admin.t");

    const res = await oldAgent.post("/api/auth/change-password").send({
      currentPassword: TEST_PASSWORD,
      newPassword: "Fresh2026pw",
      confirmPassword: "Fresh2026pw",
    });
    expect(res.status).toBe(200);
    expect(
      (res.body as { data: { mustChangePassword: boolean } }).data
        .mustChangePassword,
    ).toBe(false);

    // The other session held an old token_version.
    expect((await stolen.get("/api/auth/me")).status).toBe(401);
    // This browser got a fresh cookie and stays logged in.
    expect((await oldAgent.get("/api/auth/me")).status).toBe(200);

    expect((await login("admin.t", TEST_PASSWORD)).status).toBe(401);
    expect((await login("admin.t", "Fresh2026pw")).status).toBe(200);
  });

  it("rejects a wrong current password and a weak new one", async () => {
    await createUser(prisma, { username: "admin.t", role: "ADMIN" });
    const agent = await loginAs(app, "admin.t");

    const wrong = await agent.post("/api/auth/change-password").send({
      currentPassword: "Wrong2026pw",
      newPassword: "Fresh2026pw",
      confirmPassword: "Fresh2026pw",
    });
    expect(wrong.status).toBe(400);

    const weak = await agent.post("/api/auth/change-password").send({
      currentPassword: TEST_PASSWORD,
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(weak.status).toBe(400);
  });

  it("mustChangePassword blocks every other protected route", async () => {
    await createUser(prisma, {
      username: "admin.t",
      role: "ADMIN",
      mustChangePassword: true,
    });
    const agent = await loginAs(app, "admin.t");
    expect((await agent.get("/api/centers")).status).toBe(403);
    expect((await agent.get("/api/auth/me")).status).toBe(200);
  });
});

describe("parent sign-up", () => {
  function signup(centerId: number, username = "parent.new") {
    return request(app).post("/api/auth/parent-signup").send({
      fullName: "Rosa Dela Cruz",
      username,
      mobile: "09171234567",
      centerId,
      childName: "Ana",
      password: "Parent2026pw",
      confirmPassword: "Parent2026pw",
    });
  }

  it("creates a PENDING Parent and returns the center name", async () => {
    const center = await createCenter(prisma, "Sibujo");
    const res = await signup(center.id);
    expect(res.status).toBe(201);
    expect((res.body as { data: { centerName: string } }).data.centerName).toBe(
      "Sibujo",
    );
    expectNoSecrets(res.body);
    const row = await prisma.user.findUniqueOrThrow({
      where: { username: "parent.new" },
      include: { parentProfile: true },
    });
    expect(row.status).toBe("PENDING");
    expect(row.role).toBe("PARENT");
    expect(row.parentProfile?.childName).toBe("Ana");
    expect(row.passwordHash).not.toContain("Parent2026pw");
  });

  it("rejects an inactive center, a duplicate username and bad fields", async () => {
    const closed = await prisma.center.create({
      data: { name: "Closed", isActive: false },
    });
    const inactive = await signup(closed.id);
    expect(inactive.status).toBe(422);

    const center = await createCenter(prisma, "Sibujo");
    await signup(center.id);
    const duplicate = await signup(center.id, "PARENT.NEW");
    expect(duplicate.status).toBe(409);
    expect(
      (duplicate.body as { error: { details: { field: string }[] } }).error
        .details[0]?.field,
    ).toBe("username");

    const bad = await request(app).post("/api/auth/parent-signup").send({
      fullName: "R",
      username: "x",
      mobile: "123",
      centerId: "",
      password: "short",
      confirmPassword: "other",
    });
    expect(bad.status).toBe(400);
  });

  it("public centers lists active centers with id and name only", async () => {
    await createCenter(prisma, "Sibujo");
    await prisma.center.create({ data: { name: "Closed", isActive: false } });
    const res = await request(app).get("/api/public/centers");
    expect(res.status).toBe(200);
    const data = (res.body as { data: Record<string, unknown>[] }).data;
    expect(data.map((row) => row.name)).toEqual(["Sibujo"]);
    expect(Object.keys(data[0] ?? {}).sort()).toEqual(["id", "name"]);
  });
});
