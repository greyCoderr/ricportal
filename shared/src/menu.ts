import { z } from "zod";
import { calendarDateSchema } from "./students.js";
import { daysBetween } from "./dates.js";

export const MAX_CALENDAR_RANGE_DAYS = 62;

export const calendarQuerySchema = z
  .object({ from: calendarDateSchema, to: calendarDateSchema })
  .refine((query) => query.from <= query.to, {
    path: ["to"],
    message: "The end date must be on or after the start date.",
  })
  .refine(
    (query) =>
      query.from > query.to ||
      daysBetween(query.from, query.to) <= MAX_CALENDAR_RANGE_DAYS,
    {
      path: ["to"],
      message: `The range can be at most ${String(MAX_CALENDAR_RANGE_DAYS)} days.`,
    },
  );

export const menuConfirmSchema = z.object({
  token: z.string().min(1, "Upload the file again."),
});

export type MenuPreviewBatch = {
  sheetName: string;
  prNo: string;
  prDate: string;
  periodStart: string;
  periodEnd: string;
  days: number;
  warnings: string[];
};

export type MenuPreview = {
  // Null when the file cannot be confirmed (errors or overlapping dates).
  token: string | null;
  fileName: string;
  batches: MenuPreviewBatch[];
  warnings: string[];
  errors: string[];
  // Dates in the file that already have a menu.
  overlaps: string[];
};

export type MenuBatchDto = {
  id: number;
  sheetName: string;
  fileName: string;
  prNo: string;
  prDate: string;
  periodStart: string;
  periodEnd: string;
  days: number;
  createdAt: string;
};

export type CalendarDay = {
  date: string;
  dayNo: number;
  dayName: string;
  menuName: string;
  prNo: string;
  prDate: string;
};
