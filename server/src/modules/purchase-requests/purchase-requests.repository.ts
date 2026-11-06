import { toDbDate } from "../../core/dates.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

const ITEMS = { items: { orderBy: { itemNo: "asc" as const } } };

export type ItemChange = {
  description?: string;
  unit?: string | null;
  quantity?: string | null;
  unitCost?: string | null;
  filledBy?: number;
};

export function createPurchaseRequestsRepository(prisma: PrismaClient) {
  return {
    findMenuDay(date: string) {
      return prisma.menuDay.findUnique({
        where: { feedingDate: toDbDate(date) },
        include: { batch: { select: { prNo: true } } },
      });
    },

    find(centerId: number, date: string) {
      return prisma.purchaseRequest.findUnique({
        where: {
          centerId_feedingDate: { centerId, feedingDate: toDbDate(date) },
        },
        include: ITEMS,
      });
    },

    // Safe to repeat: the unique (center, date) keeps one row.
    open(input: {
      centerId: number;
      date: string;
      menuDayId: number;
      prNo: string;
    }) {
      const feedingDate = toDbDate(input.date);
      return prisma.purchaseRequest.upsert({
        where: {
          centerId_feedingDate: { centerId: input.centerId, feedingDate },
        },
        create: {
          centerId: input.centerId,
          feedingDate,
          menuDayId: input.menuDayId,
          prNo: input.prNo,
        },
        update: {},
        include: ITEMS,
      });
    },

    lock(
      id: number,
      snapshot: {
        enrolledCount: number;
        ratePerChild: string;
        budget: string;
        lockedAt: Date;
        lockedBy: number;
      },
    ) {
      return prisma.purchaseRequest.update({
        where: { id },
        data: { status: "LOCKED", ...snapshot },
        include: ITEMS,
      });
    },

    setOpen(id: number) {
      return prisma.purchaseRequest.update({
        where: { id },
        data: {
          status: "OPEN",
          enrolledCount: null,
          ratePerChild: null,
          budget: null,
          lockedAt: null,
          lockedBy: null,
        },
        include: ITEMS,
      });
    },

    setNoFeeding(id: number) {
      return prisma.purchaseRequest.update({
        where: { id },
        data: { status: "NO_FEEDING" },
        include: ITEMS,
      });
    },

    // Item numbers run 1 to n (BR-11).
    addItem(purchaseRequestId: number, description: string) {
      return prisma.$transaction(async (tx) => {
        const count = await tx.purchaseItem.count({
          where: { purchaseRequestId },
        });
        return tx.purchaseItem.create({
          data: { purchaseRequestId, description, itemNo: count + 1 },
        });
      });
    },

    findItem(id: number) {
      return prisma.purchaseItem.findUnique({
        where: { id },
        include: {
          purchaseRequest: {
            select: {
              id: true,
              centerId: true,
              feedingDate: true,
              status: true,
            },
          },
        },
      });
    },

    // Only changes the row when the version still matches and the day is still
    // OPEN, in one statement, so a lock or another editor cannot slip between.
    async updateItemIfCurrent(id: number, version: number, change: ItemChange) {
      const result = await prisma.purchaseItem.updateMany({
        where: { id, version, purchaseRequest: { status: "OPEN" } },
        data: { ...change, version: { increment: 1 } },
      });
      if (result.count === 0) {
        return null;
      }
      return prisma.purchaseItem.findUnique({ where: { id } });
    },

    deleteItem(id: number, purchaseRequestId: number) {
      return prisma.$transaction(async (tx) => {
        await tx.purchaseItem.delete({ where: { id } });
        const rest = await tx.purchaseItem.findMany({
          where: { purchaseRequestId },
          orderBy: { itemNo: "asc" },
          select: { id: true },
        });
        for (const [index, row] of rest.entries()) {
          await tx.purchaseItem.update({
            where: { id: row.id },
            data: { itemNo: index + 1 },
          });
        }
      });
    },

    isAssigned(centerId: number, date: string, parentId: number) {
      return prisma.feedingAssignment
        .count({
          where: { centerId, feedingDate: toDbDate(date), parentId },
        })
        .then((count) => count > 0);
    },

    countActiveStudents(centerId: number, schoolYear: string) {
      return prisma.student.count({
        where: { centerId, schoolYear, status: "ACTIVE" },
      });
    },
  };
}

export type PurchaseRequestsRepository = ReturnType<
  typeof createPurchaseRequestsRepository
>;
