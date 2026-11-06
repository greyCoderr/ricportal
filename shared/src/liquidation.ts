import { z } from "zod";
import type { PrDayStatus } from "./purchase.js";
import { calendarDateSchema } from "./students.js";

export const REPORT_STATUSES = [
  "SUBMITTED",
  "NEED_REVISION",
  "APPROVED",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const reviewSchema = z
  .object({
    decision: z.enum(["APPROVED", "NEED_REVISION"], "Choose a decision."),
    feedback: z
      .string()
      .trim()
      .max(2000, "Feedback must be at most 2000 characters.")
      .optional(),
  })
  // BR-07: feedback is required for Need Revision.
  .refine(
    (input) =>
      input.decision !== "NEED_REVISION" || (input.feedback ?? "") !== "",
    { path: ["feedback"], message: "Write what the Teacher should change." },
  );
export type ReviewInput = z.input<typeof reviewSchema>;

export const prDateQuerySchema = z.object({
  date: calendarDateSchema,
  centerId: z.coerce.number().int().positive().optional(),
});

export const reportDateQuerySchema = z.object({ date: calendarDateSchema });

export type LiquidationItem = {
  itemNo: number;
  unit: string | null;
  description: string;
  quantity: string | null;
  unitCost: string | null;
  total: string | null;
};

export type LiquidationDay = {
  date: string;
  dayName: string;
  menuName: string;
  prNo: string;
  prDate: string;
  status: PrDayStatus;
  subtotal: string;
  items: LiquidationItem[];
};

export type Signatories = {
  approvedByName: string;
  approvedByTitle: string;
  notedByName: string;
  notedByTitle: string;
};

// One structure feeds the preview, the PDFs and the snapshot (P6-T02).
export type LiquidationData = {
  centerName: string;
  barangay: string;
  teacherName: string;
  from: string;
  to: string;
  days: LiquidationDay[];
  total: string;
  // Days that are not LOCKED or NO_FEEDING (BR-16).
  blockingDays: string[];
  signatories: Signatories;
};

export type ReportDto = {
  id: number;
  centerId: number;
  centerName: string;
  teacherName: string;
  type: "LIQUIDATION";
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  currentVersion: number;
  total: string;
  submittedAt: string;
};

export type ReportReviewDto = {
  id: number;
  versionNo: number;
  decision: "APPROVED" | "NEED_REVISION";
  feedback: string | null;
  createdAt: string;
};

export type ReportDetailDto = ReportDto & { reviews: ReportReviewDto[] };

export type ReportSnapshotDto = {
  versionNo: number;
  createdAt: string;
  payload: LiquidationData;
};
