import { toDbDate } from "../../core/dates.js";
import { isUniqueViolation } from "../../core/db-errors.js";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

const ITEMS = { items: { orderBy: { itemNo: "asc" as const } } };

export type ItemChange = {
  description?: string;
  unit?: string | null;
  quantity?: string | null;
  unitCost?: string | null;
  filledBy?: number;
};

// Locks the request row until the transaction ends and tells whether the day
// is still OPEN and which item number is the last. Everyone who adds or deletes
// a row waits here in turn, so two rows never get the same number, and a row
// cannot be written after a lock (AUD-003). The lock is on the request row
// only, never on item rows, so it cannot deadlock with a row being edited.
async function lockOpenRequest(
  tx: Prisma.TransactionClient,
  purchaseRequestId: number,
): Promise<{ lastItemNo: number } | null> {
  const rows = await tx.$queryRaw<
    { status: string; lastItemNo: number | bigint | null }[]
  >`
    SELECT pr.status AS status,
      (SELECT MAX(pi.item_no) FROM purchase_items pi
        WHERE pi.purchase_request_id = pr.id) AS lastItemNo
    FROM purchase_requests pr
    WHERE pr.id = ${purchaseRequestId}
    FOR UPDATE`;
  const row = rows[0];
  if (row?.status !== "OPEN") {
    return null;
  }
  return { lastItemNo: Number(row.lastItemNo ?? 0) };
}

export function createPurchaseRequestsRepository(prisma: PrismaClient) {
  function readWithItems(id: number) {
    return prisma.purchaseRequest.findUnique({ where: { id }, include: ITEMS });
  }

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

    // Safe to repeat: the unique (center, date) keeps one row. When two
    // requests open the same day at once, the one that loses the insert reads
    // the row the other one made (AUD-003).
    async open(input: {
      centerId: number;
      date: string;
      menuDayId: number;
      prNo: string;
    }) {
      const feedingDate = toDbDate(input.date);
      const where = {
        centerId_feedingDate: { centerId: input.centerId, feedingDate },
      };
      try {
        return await prisma.purchaseRequest.upsert({
          where,
          create: {
            centerId: input.centerId,
            feedingDate,
            menuDayId: input.menuDayId,
            prNo: input.prNo,
          },
          update: {},
          include: ITEMS,
        });
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
        return prisma.purchaseRequest.findUniqueOrThrow({
          where,
          include: ITEMS,
        });
      }
    },

    // The three changes of state below each run as one UPDATE that also
    // checks the state it starts from (AUD-004). A request that read the day a
    // moment earlier cannot overwrite what another request did since; it gets
    // null. An UPDATE waits for a submit that is marking the same row, and
    // then sees the mark.
    async lock(
      id: number,
      snapshot: {
        enrolledCount: number;
        ratePerChild: string;
        budget: string;
        lockedAt: Date;
        lockedBy: number;
      },
    ) {
      const changed = await prisma.purchaseRequest.updateMany({
        where: { id, status: "OPEN" },
        data: { status: "LOCKED", ...snapshot },
      });
      return changed.count === 0 ? null : readWithItems(id);
    },

    // Never reopens a day that is part of a submitted report (BR-12, BR-16).
    async setOpen(id: number) {
      const changed = await prisma.purchaseRequest.updateMany({
        where: {
          id,
          status: { in: ["LOCKED", "NO_FEEDING"] },
          submittedReportId: null,
        },
        data: {
          status: "OPEN",
          enrolledCount: null,
          ratePerChild: null,
          budget: null,
          lockedAt: null,
          lockedBy: null,
        },
      });
      return changed.count === 0 ? null : readWithItems(id);
    },

    async setNoFeeding(id: number) {
      const changed = await prisma.purchaseRequest.updateMany({
        where: { id, status: "OPEN" },
        data: { status: "NO_FEEDING" },
      });
      return changed.count === 0 ? null : readWithItems(id);
    },

    // Item numbers run 1 to n (BR-11). Null when the day is no longer OPEN.
    addItem(purchaseRequestId: number, description: string, createdBy: number) {
      return prisma.$transaction(async (tx) => {
        const open = await lockOpenRequest(tx, purchaseRequestId);
        if (open === null) {
          return null;
        }
        return tx.purchaseItem.create({
          data: {
            purchaseRequestId,
            description,
            createdBy,
            itemNo: open.lastItemNo + 1,
          },
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

    // False when the day is no longer OPEN; nothing is deleted then.
    deleteItem(id: number, purchaseRequestId: number) {
      return prisma.$transaction(async (tx) => {
        if ((await lockOpenRequest(tx, purchaseRequestId)) === null) {
          return false;
        }
        await tx.purchaseItem.deleteMany({ where: { id, purchaseRequestId } });
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
        return true;
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
