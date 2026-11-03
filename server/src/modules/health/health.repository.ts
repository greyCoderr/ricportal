import type { PrismaClient } from "../../generated/prisma/client.js";

// The only file in this module that touches the database.
export type HealthRepository = {
  ping(): Promise<void>;
};

export function createHealthRepository(prisma: PrismaClient): HealthRepository {
  return {
    async ping() {
      await prisma.$queryRaw`SELECT 1`;
    },
  };
}
