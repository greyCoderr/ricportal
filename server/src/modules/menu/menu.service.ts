import { randomUUID } from "node:crypto";
import type { CalendarDay, MenuBatchDto, MenuPreview } from "@ricportal/shared";
import { fromDbDate } from "../../core/dates.js";
import { isUniqueViolation } from "../../core/db-errors.js";
import {
  ConflictError,
  RuleViolationError,
  StateInvalidError,
} from "../../core/errors.js";
import type { MenuRepository } from "./menu.repository.js";
import { parseMenuWorkbook, type ParsedBatch } from "./parser.js";

const PREVIEW_LIFETIME_MS = 30 * 60 * 1000;
const MAX_OPEN_PREVIEWS = 50;

type HeldPreview = {
  batches: ParsedBatch[];
  fileName: string;
  uploadedBy: number;
  expiresAt: number;
};

const OVERLAP_MESSAGE =
  "Some dates in this file already have a menu. Remove the overlap from the file and upload it again.";

export function createMenuService(deps: {
  repository: MenuRepository;
  now: () => Date;
}) {
  const { repository, now } = deps;
  // The file is never stored: only its parsed result, for 30 minutes (DEC-036).
  const previews = new Map<string, HeldPreview>();

  function dropExpired(at: number): void {
    for (const [token, preview] of previews) {
      if (preview.expiresAt <= at) {
        previews.delete(token);
      }
    }
  }

  return {
    async preview(input: {
      buffer: Buffer;
      fileName: string;
      uploadedBy: number;
    }): Promise<MenuPreview> {
      let parsed: Awaited<ReturnType<typeof parseMenuWorkbook>>;
      try {
        parsed = await parseMenuWorkbook(input.buffer);
      } catch {
        // Parser text never reaches the client.
        throw new RuleViolationError(
          "This file could not be read as an Excel workbook.",
        );
      }

      const dates = parsed.batches.flatMap((batch) =>
        batch.days.map((day) => day.feedingDate),
      );
      const overlaps =
        dates.length === 0 ? [] : await repository.findExistingDates(dates);

      let token: string | null = null;
      if (parsed.errors.length === 0 && overlaps.length === 0) {
        const at = now().getTime();
        dropExpired(at);
        if (previews.size >= MAX_OPEN_PREVIEWS) {
          previews.clear();
        }
        token = randomUUID();
        previews.set(token, {
          batches: parsed.batches,
          fileName: input.fileName,
          uploadedBy: input.uploadedBy,
          expiresAt: at + PREVIEW_LIFETIME_MS,
        });
      }

      return {
        token,
        fileName: input.fileName,
        batches: parsed.batches.map((batch) => ({
          sheetName: batch.sheetName,
          prNo: batch.prNo,
          prDate: batch.prDate,
          periodStart: batch.periodStart,
          periodEnd: batch.periodEnd,
          days: batch.days.length,
          warnings: batch.warnings,
        })),
        warnings: parsed.warnings,
        errors: parsed.errors,
        overlaps,
      };
    },

    async confirm(token: string): Promise<{ batches: number; days: number }> {
      const held = previews.get(token);
      if (held === undefined || held.expiresAt <= now().getTime()) {
        previews.delete(token);
        throw new StateInvalidError(
          "This preview has expired. Please upload the file again.",
        );
      }
      // One use only, so confirming twice cannot import twice.
      previews.delete(token);

      const dates = held.batches.flatMap((batch) =>
        batch.days.map((day) => day.feedingDate),
      );
      if ((await repository.findExistingDates(dates)).length > 0) {
        throw new ConflictError(OVERLAP_MESSAGE);
      }
      try {
        await repository.saveBatches({
          batches: held.batches,
          fileName: held.fileName,
          uploadedBy: held.uploadedBy,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictError(OVERLAP_MESSAGE);
        }
        throw error;
      }
      return { batches: held.batches.length, days: dates.length };
    },

    async listBatches(input: { skip: number; take: number }) {
      const { rows, total } = await repository.listBatches(input);
      const dtos: MenuBatchDto[] = rows.map((row) => ({
        id: row.id,
        sheetName: row.sheetName,
        fileName: row.fileName,
        prNo: row.prNo,
        prDate: fromDbDate(row.prDate),
        periodStart: fromDbDate(row.periodStart),
        periodEnd: fromDbDate(row.periodEnd),
        days: row._count.days,
        createdAt: row.createdAt.toISOString(),
      }));
      return { rows: dtos, total };
    },

    async calendar(from: string, to: string): Promise<CalendarDay[]> {
      const rows = await repository.listDays(from, to);
      return rows.map((row) => ({
        date: fromDbDate(row.feedingDate),
        dayNo: row.dayNo,
        dayName: row.dayName,
        menuName: row.menuName,
        prNo: row.batch.prNo,
        prDate: fromDbDate(row.batch.prDate),
      }));
    },
  };
}

export type MenuService = ReturnType<typeof createMenuService>;
