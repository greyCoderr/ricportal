import type { PrismaClient } from "../../generated/prisma/client.js";

export function createDashboardRepository(prisma: PrismaClient) {
  return {
    teacherCounts() {
      return prisma.user.groupBy({
        by: ["status"],
        where: { role: "TEACHER" },
        _count: { _all: true },
      });
    },

    centersWithActiveTeacher() {
      return prisma.user.groupBy({
        by: ["centerId"],
        where: { role: "TEACHER", status: "ACTIVE", centerId: { not: null } },
      });
    },

    countActiveStudents(schoolYear: string) {
      return prisma.student.count({
        where: { schoolYear, status: "ACTIVE" },
      });
    },

    reportCounts() {
      return prisma.report.groupBy({
        by: ["status"],
        _count: { _all: true },
      });
    },
  };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
