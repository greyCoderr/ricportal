import { EnvError, parseEnv, type Env } from "../src/config/env.js";
import { createPrismaClient } from "../src/core/db.js";
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
  } catch (error) {
    if (error instanceof EnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const prisma = createPrismaClient(url);
  try {
    const { settings, centers } = await seedBase(prisma, env);
    print(
      `Seed done: ${String(settings)} default settings, ${String(centers)} centers, 1 Admin present.`,
    );
  } catch (error) {
    fail("Seed", error);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
