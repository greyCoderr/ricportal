import { fromDbDate, toDbDate } from "../../core/dates.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { ParsedBatch } from "./parser.js";

export function createMenuRepository(prisma: PrismaClient) {
  return {
    async findExistingDates(dates: string[]): Promise<string[]> {
      const rows = await prisma.menuDay.findMany({
        where: { feedingDate: { in: dates.map(toDbDate) } },
        select: { feedingDate: true },
        orderBy: { feedingDate: "asc" },
      });
      return rows.map((row) => fromDbDate(row.feedingDate));
    },

    // All batches or nothing: the unique feeding_date makes a late overlap
    // fail the whole transaction.
    async saveBatches(input: {
      batches: ParsedBatch[];
      fileName: string;
      uploadedBy: number;
    }): Promise<void> {
      await prisma.$transaction(async (tx) => {
        for (const batch of input.batches) {
          const created = await tx.menuBatch.create({
            data: {
              sheetName: batch.sheetName,
              fileName: input.fileName,
              prNo: batch.prNo,
              prDate: toDbDate(batch.prDate),
              periodStart: toDbDate(batch.periodStart),
              periodEnd: toDbDate(batch.periodEnd),
              uploadedBy: input.uploadedBy,
            },
            select: { id: true },
          });
          await tx.menuDay.createMany({
            data: batch.days.map((day) => ({
              batchId: created.id,
              feedingDate: toDbDate(day.feedingDate),
              dayNo: day.dayNo,
              dayName: day.dayName,
              menuName: day.menuName,
            })),
          });
        }
      });
    },

    async listBatches(input: { skip: number; take: number }) {
      const [rows, total] = await prisma.$transaction([
        prisma.menuBatch.findMany({
          orderBy: { periodStart: "desc" },
          skip: input.skip,
          take: input.take,
          include: { _count: { select: { days: true } } },
        }),
        prisma.menuBatch.count(),
      ]);
      return { rows, total };
    },

    listDays(from: string, to: string) {
      return prisma.menuDay.findMany({
        where: { feedingDate: { gte: toDbDate(from), lte: toDbDate(to) } },
        orderBy: { feedingDate: "asc" },
        include: { batch: { select: { prNo: true, prDate: true } } },
      });
    },
  };
}

export type MenuRepository = ReturnType<typeof createMenuRepository>;
