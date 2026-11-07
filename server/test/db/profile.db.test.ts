import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import {
  buildApp,
  createCenter,
  createUser,
  expectNoSecrets,
  loginAs,
} from "./api-harness.js";
import { createTestPrisma, resetDatabase } from "./test-database.js";

type ProfileBody = {
  data: {
    username: string;
    fullName: string;
    role: string;
    mobile: string | null;
    centerName: string | null;
  };
};

let prisma: PrismaClient;
let app: ReturnType<typeof buildApp>;
let centerId: number;

beforeAll(() => {
  prisma = createTestPrisma();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  app = buildApp(prisma);
  centerId = (await createCenter(prisma, "Sibujo")).id;
  await createUser(prisma, { username: "admin.t", role: "ADMIN" });
  await createUser(prisma, {
    username: "teacher.a",
    role: "TEACHER",
    centerId,
  });
  await createUser(prisma, {
    username: "parent.a",
    role: "PARENT",
    centerId,
  });
});

describe("GET /api/auth/profile (D11)", () => {
  it.each([
    ["admin.t", "ADMIN", null],
    ["teacher.a", "TEACHER", "Sibujo"],
    ["parent.a", "PARENT", "Sibujo"],
  ])("%s reads their own profile", async (username, role, centerName) => {
    const agent = await loginAs(app, username);
    const res = await agent.get("/api/auth/profile");
    expect(res.status).toBe(200);
    const { data } = res.body as ProfileBody;
    expect(data.username).toBe(username);
    expect(data.role).toBe(role);
    expect(data.centerName).toBe(centerName);
    expectNoSecrets(res.body);
  });
});

describe("PATCH /api/auth/profile (D11)", () => {
  it("changes the name and the mobile, and nothing else", async () => {
    const agent = await loginAs(app, "teacher.a");
    const res = await agent.patch("/api/auth/profile").send({
      fullName: "Ana B. Cruz",
      mobile: "09171234567",
      username: "someone.else",
      role: "ADMIN",
      centerId: 999,
    });
    expect(res.status).toBe(200);
    const { data } = res.body as ProfileBody;
    expect(data.fullName).toBe("Ana B. Cruz");
    expect(data.mobile).toBe("09171234567");
    expect(data.username).toBe("teacher.a");
    expect(data.role).toBe("TEACHER");
    expect(data.centerName).toBe("Sibujo");
    expectNoSecrets(res.body);
  });

  it("rejects a bad name or mobile with field messages", async () => {
    const agent = await loginAs(app, "teacher.a");
    const badName = await agent
      .patch("/api/auth/profile")
      .send({ fullName: "A", mobile: "" });
    expect(badName.status).toBe(400);
    const badMobile = await agent
      .patch("/api/auth/profile")
      .send({ fullName: "Ana Cruz", mobile: "12345" });
    expect(badMobile.status).toBe(400);
  });

  it("a Teacher may clear the mobile, a Parent may not", async () => {
    const teacher = await loginAs(app, "teacher.a");
    const cleared = await teacher
      .patch("/api/auth/profile")
      .send({ fullName: "Ana Cruz", mobile: "" });
    expect(cleared.status).toBe(200);
    expect((cleared.body as ProfileBody).data.mobile).toBe(null);

    const parent = await loginAs(app, "parent.a");
    const refused = await parent
      .patch("/api/auth/profile")
      .send({ fullName: "Rosa Reyes", mobile: "" });
    expect(refused.status).toBe(400);
  });

  it("a forced password change blocks the profile routes", async () => {
    await createUser(prisma, {
      username: "teacher.b",
      role: "TEACHER",
      centerId,
      mustChangePassword: true,
    });
    const agent = await loginAs(app, "teacher.b");
    expect((await agent.get("/api/auth/profile")).status).toBe(403);
    expect(
      (
        await agent
          .patch("/api/auth/profile")
          .send({ fullName: "Ana Cruz", mobile: "" })
      ).status,
    ).toBe(403);
  });
});
