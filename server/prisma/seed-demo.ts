import { EnvError, parseEnv, type Env } from "../src/config/env.js";
import { createPrismaClient } from "../src/core/db.js";
import { assertDemoDatabase, DemoSeedRefused } from "./demo-guard.js";
import { seedDemo } from "./demo-seed.js";
import { seedBase } from "./seed-base.js";
import { fail, print, requireDatabaseUrl } from "./script-output.js";

async function main(): Promise<void> {
  const url = requireDatabaseUrl();
  if (url === null) {
    return;
  }

  let env: Env;
  try {
    env = parseEnv(process.env);
    assertDemoDatabase(url, process.env.NODE_ENV);
  } catch (error) {
    if (error instanceof EnvError || error instanceof DemoSeedRefused) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const prisma = createPrismaClient(url);
  try {
    await seedBase(prisma, env);
    const result = await seedDemo(prisma, {
      now: new Date(),
      bcryptCost: env.BCRYPT_COST,
    });
    print(
      `Demo seed done: ${String(result.children)} children (and ${String(result.earlierChildren)} of the year before), ${String(result.assignedDays)} assigned days, ${String(result.reports)} reports.`,
    );
  } catch (error) {
    fail("Demo seed", error);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
