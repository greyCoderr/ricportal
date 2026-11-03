import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertSafeTestDatabase, loadTestEnv } from "./test-database.js";

// Runs once before the db test group: check the guard, then bring the test
// database up to date with `prisma migrate deploy` (never migrate dev or
// reset). Prisma's output is not shown, because it can include the host;
// on failure only the Prisma error code is printed.

const SERVER_DIR = fileURLToPath(new URL("../../", import.meta.url));
const PRISMA_CLI = fileURLToPath(
  new URL("../../../node_modules/prisma/build/index.js", import.meta.url),
);

export default function setup(): void {
  loadTestEnv();
  assertSafeTestDatabase(process.env.DATABASE_URL, process.env.NODE_ENV);

  const result = spawnSync(
    process.execPath,
    [PRISMA_CLI, "migrate", "deploy", "--config", "prisma/prisma.config.ts"],
    { cwd: SERVER_DIR, env: process.env, encoding: "utf8", timeout: 120_000 },
  );

  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const code = /\bP\d{4}\b/.exec(output)?.[0] ?? "unknown";
    throw new Error(
      `Test database is not reachable or migrations failed (code: ${code}). Is XAMPP MySQL running?`,
    );
  }
}
