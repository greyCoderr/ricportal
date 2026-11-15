import type { ReportStatus } from "@ricportal/shared";
import { toDbDate } from "../../core/dates.js";
import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

const LATEST_SNAPSHOT = {
  snapshots: { orderBy: { versionNo: "desc" as const }, take: 1 },
};
const REPORT_INCLUDE = {
  center: { select: { name: true } },
  teacher: { select: { fullName: true } },
  ...LATEST_SNAPSHOT,
};

// Only days still LOCKED or NO_FEEDING can join a report (BR-16). A day that
// was reopened after the totals were read makes the count differ, and the
// whole submit rolls back (AUD-004).
const SUBMITTABLE: ("LOCKED" | "NO_FEEDING")[] = ["LOCKED", "NO_FEEDING"];

// The one failure of submit that is expected: another request took a day or
// the report first. Everything else is a real error (AUD-008).
export class SubmitRaceError extends Error {
  constructor() {
    super("Another request submitted this period first.");
    this.name = "SubmitRaceError";
  }
}

function asJson(payload: object): Prisma.InputJsonObject {
  return payload;
}

export function createLiquidationRepository(prisma: PrismaClient) {
  return {
    listMenuDays(from: string, to: string) {
      return prisma.menuDay.findMany({
        where: { feedingDate: { gte: toDbDate(from), lte: toDbDate(to) } },
        orderBy: { feedingDate: "asc" },
        include: { batch: { select: { prNo: true, prDate: true } } },
      });
    },

    listPrs(centerId: number, from: string, to: string) {
      return prisma.purchaseRequest.findMany({
        where: {
          centerId,
          feedingDate: { gte: toDbDate(from), lte: toDbDate(to) },
        },
        include: { items: { orderBy: { itemNo: "asc" } } },
      });
    },

    findCenter(id: number) {
      return prisma.center.findUnique({
        where: { id },
        select: { name: true, barangay: true },
      });
    },

    findActiveTeacherName(centerId: number) {
      return prisma.user
        .findFirst({
          where: { centerId, role: "TEACHER", status: "ACTIVE" },
          select: { fullName: true },
        })
        .then((row) => row?.fullName ?? null);
    },

    findOverlapping(centerId: number, from: string, to: string) {
      return prisma.report.findMany({
        where: {
          centerId,
          periodStart: { lte: toDbDate(to) },
          periodEnd: { gte: toDbDate(from) },
        },
        select: {
          id: true,
          status: true,
          currentVersion: true,
          periodStart: true,
          periodEnd: true,
        },
      });
    },

    // Report, snapshot and the submitted mark together, or nothing (BR-16). A
    // day taken by another report makes the count differ and rolls it all back.
    submit(input: {
      centerId: number;
      teacherId: number;
      from: string;
      to: string;
      prIds: number[];
      payload: object;
      at: Date;
    }) {
      return prisma.$transaction(async (tx) => {
        const report = await tx.report.create({
          data: {
            centerId: input.centerId,
            teacherId: input.teacherId,
            type: "LIQUIDATION",
            periodStart: toDbDate(input.from),
            periodEnd: toDbDate(input.to),
            submittedAt: input.at,
          },
          select: { id: true },
        });
        await tx.liquidationSnapshot.create({
          data: {
            reportId: report.id,
            versionNo: 1,
            payload: asJson(input.payload),
          },
        });
        const marked = await tx.purchaseRequest.updateMany({
          where: {
            id: { in: input.prIds },
            submittedReportId: null,
            status: { in: SUBMITTABLE },
          },
          data: { submittedReportId: report.id },
        });
        if (marked.count !== input.prIds.length) {
          throw new SubmitRaceError();
        }
        return report.id;
      });
    },

    // After Need Revision: a new version of the same report.
    resubmit(input: {
      reportId: number;
      versionNo: number;
      prIds: number[];
      payload: object;
      at: Date;
    }) {
      return prisma.$transaction(async (tx) => {
        const moved = await tx.report.updateMany({
          where: { id: input.reportId, status: "NEED_REVISION" },
          data: {
            status: "SUBMITTED",
            currentVersion: input.versionNo,
            submittedAt: input.at,
          },
        });
        if (moved.count !== 1) {
          throw new SubmitRaceError();
        }
        await tx.liquidationSnapshot.create({
          data: {
            reportId: input.reportId,
            versionNo: input.versionNo,
            payload: asJson(input.payload),
          },
        });
        const marked = await tx.purchaseRequest.updateMany({
          where: {
            id: { in: input.prIds },
            submittedReportId: null,
            status: { in: SUBMITTABLE },
          },
          data: { submittedReportId: input.reportId },
        });
        if (marked.count !== input.prIds.length) {
          throw new SubmitRaceError();
        }
      });
    },

    async listReports(input: {
      centerId: number | null;
      status?: ReportStatus | undefined;
      skip: number;
      take: number;
    }) {
      const where = {
        ...(input.centerId === null ? {} : { centerId: input.centerId }),
        ...(input.status === undefined ? {} : { status: input.status }),
      };
      const [rows, total] = await prisma.$transaction([
        prisma.report.findMany({
          where,
          orderBy: { submittedAt: "desc" },
          skip: input.skip,
          take: input.take,
          include: REPORT_INCLUDE,
        }),
        prisma.report.count({ where }),
      ]);
      return { rows, total };
    },

    // Returned reports of one center, newest first.
    async listFeedback(input: {
      centerId: number;
      skip: number;
      take: number;
    }) {
      const where = {
        decision: "NEED_REVISION" as const,
        report: { centerId: input.centerId },
      };
      const [rows, total] = await prisma.$transaction([
        prisma.reportReview.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: input.skip,
          take: input.take,
          include: {
            report: {
              select: { periodStart: true, periodEnd: true, status: true },
            },
          },
        }),
        prisma.reportReview.count({ where }),
      ]);
      return { rows, total };
    },

    findReport(id: number) {
      return prisma.report.findUnique({
        where: { id },
        include: {
          ...REPORT_INCLUDE,
          reviews: { orderBy: { id: "desc" } },
        },
      });
    },

    // Only a SUBMITTED report can be decided. Need Revision unlocks the days
    // (BR-16): locked days reopen, and all leave the report.
    review(input: {
      reportId: number;
      versionNo: number;
      reviewerId: number;
      decision: Exclude<ReportStatus, "SUBMITTED">;
      feedback: string | null;
    }) {
      return prisma.$transaction(async (tx) => {
        const moved = await tx.report.updateMany({
          where: { id: input.reportId, status: "SUBMITTED" },
          data: { status: input.decision },
        });
        if (moved.count !== 1) {
          return false;
        }
        await tx.reportReview.create({
          data: {
            reportId: input.reportId,
            versionNo: input.versionNo,
            reviewerId: input.reviewerId,
            decision: input.decision,
            feedback: input.feedback,
          },
        });
        if (input.decision === "NEED_REVISION") {
          await tx.purchaseRequest.updateMany({
            where: { submittedReportId: input.reportId, status: "LOCKED" },
            data: {
              status: "OPEN",
              enrolledCount: null,
              ratePerChild: null,
              budget: null,
              lockedAt: null,
              lockedBy: null,
            },
          });
          await tx.purchaseRequest.updateMany({
            where: { submittedReportId: input.reportId },
            data: { submittedReportId: null },
          });
        }
        return true;
      });
    },
  };
}

export type LiquidationRepository = ReturnType<
  typeof createLiquidationRepository
>;
