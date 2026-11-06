import type { PrismaClient } from "../../generated/prisma/client.js";

// Used by other modules; there is no settings screen in the sprint (the seeded
// values are used, docs/SPRINT_SHORTCUTS.md).
const DEFAULT_SCHOOL_YEAR = "2026-2027";

export function createSettingsRepository(prisma: PrismaClient) {
  async function read(key: string): Promise<string | null> {
    const row = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });
    return row?.value ?? null;
  }

  return {
    read,
    async currentSchoolYear(): Promise<string> {
      return (await read("currentSchoolYear")) ?? DEFAULT_SCHOOL_YEAR;
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
