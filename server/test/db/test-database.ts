import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createPrismaClient,
  DatabaseUrlError,
  parseDatabaseUrl,
  type DatabaseConnection,
} from "../../src/core/db.js";
import type { PrismaClient } from "../../src/generated/prisma/client.js";

// Test database rules (DEC-019). Every message is fixed text, so the URL,
// user, password and host are never shown.

const ENV_TEST_FILE = fileURLToPath(
  new URL("../../../.env.test", import.meta.url),
);
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const TEST_NAME = /_test$/;
const KEPT_TABLES = new Set(["_prisma_migrations"]);
const SAFE_IDENTIFIER = /^[A-Za-z0-9_]+$/;

export class TestDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestDatabaseError";
  }
}

// Loads .env.test when it exists. Variables that are already set (CI) win.
export function loadTestEnv(): void {
  if (existsSync(ENV_TEST_FILE)) {
    process.loadEnvFile(ENV_TEST_FILE);
  }
}

export function assertSafeTestDatabase(
  databaseUrl: string | undefined,
  nodeEnv: string | undefined,
): DatabaseConnection {
  if (nodeEnv !== "test") {
    throw new TestDatabaseError("Database tests need NODE_ENV=test");
  }
  if (databaseUrl === undefined || databaseUrl === "") {
    throw new TestDatabaseError(
      "DATABASE_URL for tests is missing (create .env.test from .env.test.example)",
    );
  }
  let connection: DatabaseConnection;
  try {
    connection = parseDatabaseUrl(databaseUrl);
  } catch (error) {
    if (error instanceof DatabaseUrlError) {
      throw new TestDatabaseError("DATABASE_URL for tests is not valid");
    }
    throw error;
  }
  if (!LOCAL_HOSTS.has(connection.host)) {
    throw new TestDatabaseError(
      "Test database must be on this machine (127.0.0.1, localhost or ::1)",
    );
  }
  if (!TEST_NAME.test(connection.database)) {
    throw new TestDatabaseError("Test database name must end with _test");
  }
  return connection;
}

export function assertTestDatabaseName(name: string | null): void {
  if (name === null || !TEST_NAME.test(name)) {
    throw new TestDatabaseError(
      "Connected database is not a test database; reset refused",
    );
  }
}

// Loads .env.test, checks the guard, then connects through core/db.ts.
export function createTestPrisma(): PrismaClient {
  loadTestEnv();
  const url = process.env.DATABASE_URL;
  assertSafeTestDatabase(url, process.env.NODE_ENV);
  return createPrismaClient(url ?? "");
}

// Empties every table in the connected database except the migration
// history, so tables added in later phases are covered automatically.
// DELETE (not TRUNCATE) keeps it inside one transaction and one connection,
// which the FOREIGN_KEY_CHECKS session setting needs.
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const current = await prisma.$queryRaw<{ name: string | null }[]>`
    SELECT DATABASE() AS name`;
  assertTestDatabaseName(current[0]?.name ?? null);

  const tables = await prisma.$queryRaw<{ name: string }[]>`
    SELECT TABLE_NAME AS name FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`;
  const names = tables
    .map((table) => table.name)
    .filter((name) => !KEPT_TABLES.has(name));
  for (const name of names) {
    if (!SAFE_IDENTIFIER.test(name)) {
      throw new TestDatabaseError("Unexpected table name; reset refused");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const name of names) {
        await tx.$executeRawUnsafe(`DELETE FROM \`${name}\``);
      }
    } finally {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }
  });
}
