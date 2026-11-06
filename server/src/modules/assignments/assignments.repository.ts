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
          parent: { select: { id: true, fullName: true } },
        },
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

    // Replaces the whole set for one day in one transaction.
    replaceAssignments(input: {
      centerId: number;
      date: string;
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
      });
    },

    listForParent(input: {
      centerId: number;
      parentId: number;
      from: string;
      to: string;
    }) {
      return prisma.feedingAssignment.findMany({
        where: {
          centerId: input.centerId,
          parentId: input.parentId,
          feedingDate: {
            gte: toDbDate(input.from),
            lte: toDbDate(input.to),
          },
        },
        orderBy: { feedingDate: "asc" },
        select: { feedingDate: true },
      });
    },
  };
}

export type AssignmentsRepository = ReturnType<
  typeof createAssignmentsRepository
>;
