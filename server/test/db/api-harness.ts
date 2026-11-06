import request from "supertest";
import { createApp } from "../../src/app.js";
import { createLogger } from "../../src/core/logger.js";
import { hashPassword } from "../../src/core/password.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { createHealthRepository } from "../../src/modules/health/health.repository.js";
import { testConfig } from "../test-config.js";

export const TEST_PASSWORD = "Test2026pw";

export function buildApp(
  prisma: PrismaClient,
  options: { now?: () => Date } = {},
) {
  return createApp({
    logger: createLogger({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    config: testConfig(),
    health: { repository: createHealthRepository(prisma) },
    prisma,
    now: options.now,
  });
}

let cachedHash: string | undefined;
async function testHash(): Promise<string> {
  cachedHash ??= await hashPassword(TEST_PASSWORD, 4);
  return cachedHash;
}

export async function createCenter(prisma: PrismaClient, name: string) {
  return prisma.center.create({ data: { name } });
}

type NewUser = {
  username: string;
  role: "ADMIN" | "TEACHER" | "PARENT";
  centerId?: number | null;
  status?: "ACTIVE" | "PENDING" | "DECLINED" | "DISABLED";
  mustChangePassword?: boolean;
};

export async function createUser(prisma: PrismaClient, user: NewUser) {
  const created = await prisma.user.create({
    data: {
      username: user.username,
      role: user.role,
      centerId: user.centerId ?? null,
      status: user.status ?? "ACTIVE",
      mustChangePassword: user.mustChangePassword ?? false,
      fullName: `${user.username} Test`,
      passwordHash: await testHash(),
    },
  });
  if (user.role === "PARENT") {
    await prisma.parentProfile.create({ data: { userId: created.id } });
  }
  return created;
}

// A supertest agent keeps the session cookie between calls.
export async function loginAs(
  app: ReturnType<typeof buildApp>,
  username: string,
  password = TEST_PASSWORD,
) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ username, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${username}: ${String(res.status)}`);
  }
  return agent;
}

// A small base world: one Admin, two centers, a Teacher and a Parent in A and
// a Teacher in B.
export async function seedWorld(prisma: PrismaClient) {
  const centerA = await createCenter(prisma, "Center A");
  const centerB = await createCenter(prisma, "Center B");
  const admin = await createUser(prisma, {
    username: "admin.t",
    role: "ADMIN",
  });
  const teacherA = await createUser(prisma, {
    username: "teacher.a",
    role: "TEACHER",
    centerId: centerA.id,
  });
  const teacherB = await createUser(prisma, {
    username: "teacher.b",
    role: "TEACHER",
    centerId: centerB.id,
  });
  const parentA = await createUser(prisma, {
    username: "parent.a",
    role: "PARENT",
    centerId: centerA.id,
  });
  const parentB = await createUser(prisma, {
    username: "parent.b",
    role: "PARENT",
    centerId: centerB.id,
  });
  return { centerA, centerB, admin, teacherA, teacherB, parentA, parentB };
}

// Fails the test if any secret-looking field appears anywhere in a body.
export function expectNoSecrets(body: unknown): void {
  const text = JSON.stringify(body);
  for (const key of [
    "passwordHash",
    "password_hash",
    "tokenVersion",
    "token_version",
    "failedLoginCount",
    "lockedUntil",
  ]) {
    if (text.includes(key)) {
      throw new Error(`response contains ${key}`);
    }
  }
}
