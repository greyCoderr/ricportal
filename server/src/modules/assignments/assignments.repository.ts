import { toDbDate } from "../../core/dates.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

export function createAssignmentsRepository(prisma: PrismaClient) {
  return {
    listMenuDays(from: string, to: string) {
      return prisma.menuDay.findMany({
        where: { feedingDate: { gte: toDbDate(from), lte: toDbDate(to) } },
        select: { feedingDate: true, menuName: true, dayName: true },
      });
    },

    listAssignments(centerId: number, from: string, to: string) {
      return prisma.feedingAssignment.findMany({
        where: {
          centerId,
          feedingDate: { gte: toDbDate(from), lte: toDbDate(to) },
        },
        orderBy: { parent: { fullName: "asc" } },
        select: {
          feedingDate: true,
          parent: { select: { id: true, fullName: true, username: true } },
        },
      });
    },

    listTeam(centerId: number, monday: string) {
      return prisma.weekTeamMember.findMany({
        where: { centerId, weekStart: toDbDate(monday) },
        orderBy: { parent: { fullName: "asc" } },
        select: {
          parent: { select: { id: true, fullName: true, username: true } },
        },
      });
    },

    // Replaces the team and every day of one week, all or nothing (D4).
    saveWeek(input: {
      centerId: number;
      monday: string;
      sunday: string;
      teamParentIds: number[];
      days: { date: string; parentIds: number[] }[];
      assignedBy: number;
    }) {
      const { centerId, assignedBy } = input;
      const weekStart = toDbDate(input.monday);
      return prisma.$transaction(async (tx) => {
        await tx.feedingAssignment.deleteMany({
          where: {
            centerId,
            feedingDate: { gte: weekStart, lte: toDbDate(input.sunday) },
          },
        });
        await tx.weekTeamMember.deleteMany({ where: { centerId, weekStart } });
        await tx.weekTeamMember.createMany({
          data: input.teamParentIds.map((parentId) => ({
            centerId,
            weekStart,
            parentId,
            assignedBy,
          })),
        });
        await tx.feedingAssignment.createMany({
          data: input.days.flatMap((day) =>
            day.parentIds.map((parentId) => ({
              centerId,
              feedingDate: toDbDate(day.date),
              parentId,
              assignedBy,
            })),
          ),
        });
      });
    },

    listPrStatuses(centerId: number, from: string, to: string) {
      return prisma.purchaseRequest.findMany({
        where: {
          centerId,
          feedingDate: { gte: toDbDate(from), lte: toDbDate(to) },
        },
        select: { feedingDate: true, status: true },
      });
    },

    menuDayExists(date: string) {
      return prisma.menuDay
        .count({ where: { feedingDate: toDbDate(date) } })
        .then((count) => count > 0);
    },

    countApprovedParents(centerId: number, ids: number[]) {
      return prisma.user.count({
        where: {
          id: { in: ids },
          centerId,
          role: "PARENT",
          status: "ACTIVE",
        },
      });
    },

    // Replaces the whole set for one day in one transaction, and adds anyone
    // new to the week's team.
    replaceAssignments(input: {
      centerId: number;
      date: string;
      monday: string;
      parentIds: number[];
      assignedBy: number;
    }) {
      const feedingDate = toDbDate(input.date);
      return prisma.$transaction(async (tx) => {
        await tx.feedingAssignment.deleteMany({
          where: { centerId: input.centerId, feedingDate },
        });
        await tx.feedingAssignment.createMany({
          data: input.parentIds.map((parentId) => ({
            centerId: input.centerId,
            feedingDate,
            parentId,
            assignedBy: input.assignedBy,
          })),
        });
        await tx.weekTeamMember.createMany({
          data: input.parentIds.map((parentId) => ({
            centerId: input.centerId,
            weekStart: toDbDate(input.monday),
            parentId,
            assignedBy: input.assignedBy,
          })),
          skipDuplicates: true,
        });
      });
    },
  };
}

export type AssignmentsRepository = ReturnType<
  typeof createAssignmentsRepository
>;
