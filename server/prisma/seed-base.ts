import { hashPassword } from "../src/core/password.js";
import type { PrismaClient } from "../src/generated/prisma/client.js";

// Defaults only: `update: {}` keeps any value the Admin has changed since.
// currentSchoolYear is a default still to be confirmed with the clients.
const DEFAULT_SETTINGS = [
  { key: "perChildDailyRate", value: "25.00" },
  { key: "currentSchoolYear", value: "2026-2027" },
] as const;

// Appendix A (docs/seed-centers.md): the 28 RIC Children Centers.
const CENTERS = [
  "Bahay",
  "Beguito Nuevo",
  "Bigajo Norte",
  "Bikal 1",
  "Bikal 2 (Paradahon)",
  "Cambalidio",
  "Camambugan",
  "Candato",
  "Ibid",
  "Labao",
  "Loba-Loba",
  "Mandacanan",
  "Mabini",
  "Mambulo Nuevo",
  "Malinao",
  "Patag",
  "Puro-Batia",
  "Pag Oring Nuevo",
  "Sigamot",
  "Tumanan Sigamot",
  "Sibujo",
  "San Juan",
  "San Isidro (Centro)",
  "San Isidro (Sta Cruz)",
  "San Isidro Quinale",
  "Tampuhan",
  "Udoc 1",
  "Udoc 2",
] as const;

// Settings, centers and the Admin. Safe to run again.
export async function seedBase(
  prisma: PrismaClient,
  env: { ADMIN_USERNAME: string; ADMIN_PASSWORD: string; BCRYPT_COST: number },
) {
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: setting.value },
      update: {},
    });
  }
  for (const name of CENTERS) {
    await prisma.center.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const username = env.ADMIN_USERNAME.toLowerCase();
  await prisma.user.upsert({
    where: { username },
    create: {
      role: "ADMIN",
      status: "ACTIVE",
      username,
      fullName: "MAO Administrator",
      passwordHash: await hashPassword(env.ADMIN_PASSWORD, env.BCRYPT_COST),
    },
    update: {},
  });
  return { settings: DEFAULT_SETTINGS.length, centers: CENTERS.length };
}
