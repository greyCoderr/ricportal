import { createPrismaClient } from "../src/core/db.js";
import { fail, print, requireDatabaseUrl } from "./script-output.js";

// Defaults only: `update: {}` keeps any value the Admin has changed since.
// currentSchoolYear is a default still to be confirmed with the clients.
const DEFAULT_SETTINGS = [
  { key: "perChildDailyRate", value: "25.00" },
  { key: "currentSchoolYear", value: "2026-2027" },
] as const;

async function main(): Promise<void> {
  const url = requireDatabaseUrl();
  if (url === null) {
    return;
  }

  const prisma = createPrismaClient(url);
  try {
    for (const setting of DEFAULT_SETTINGS) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        create: { key: setting.key, value: setting.value },
        update: {},
      });
    }
    print(`Seed done: ${DEFAULT_SETTINGS.length} default settings present.`);
  } catch (error) {
    fail("Seed", error);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
