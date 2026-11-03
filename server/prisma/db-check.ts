import { createPrismaClient } from "../src/core/db.js";
import { fail, print, requireDatabaseUrl } from "./script-output.js";

// Used by db:check (local .env) and tidb:check (.env.tidb, run only by the
// Developer). Prints exactly three lines and never the URL, user or host.

type StatusRow = { Variable_name: string; Value: string };

async function main(): Promise<void> {
  const url = requireDatabaseUrl();
  if (url === null) {
    return;
  }

  const prisma = createPrismaClient(url);
  try {
    await prisma.$queryRaw`SELECT 1`;
    print("SELECT 1: ok");

    const rows = await prisma.$queryRaw<
      StatusRow[]
    >`SHOW STATUS LIKE 'Ssl_cipher'`;
    const cipher = rows[0]?.Value ?? "";
    print(cipher === "" ? "TLS: off" : `TLS: on (${cipher})`);

    const count = await prisma.setting.count();
    print(`settings rows: ${count}`);
  } catch (error) {
    fail("Database check", error);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
