import type { FeedbackDto, ReportStatus } from "@ricportal/shared";
import type {
  LiquidationData,
  ReportDetailDto,
  ReportDto,
  ReportSnapshotDto,
  reviewSchema,
  Signatories,
} from "@ricportal/shared";
import type { z } from "zod";
import { fromDbDate } from "../../core/dates.js";
import {
  ConflictError,
  NotFoundError,
  RuleViolationError,
  StateInvalidError,
  ValidationError,
} from "../../core/errors.js";
import {
  assertCenterAccess,
  ownCenterId,
  scopeToCenter,
  type AuthUser,
} from "../../core/scope.js";
import {
  buildPurchaseRequestForm,
  buildSummaryForm,
  buildTransmittalForm,
} from "../pdf/liquidation-forms.js";
import { renderPdf } from "../pdf/pdf.js";
import type { SettingsRepository } from "../settings/settings.repository.js";
import { buildLiquidationData } from "./builder.js";
import type { LiquidationRepository } from "./liquidation.repository.js";

type ReportRow = NonNullable<
  Awaited<ReturnType<LiquidationRepository["findReport"]>>
>;
type ReportListRow = Awaited<
  ReturnType<LiquidationRepository["listReports"]>
>["rows"][number];

export type FormKind = "summary" | "transmittal";

function snapshotData(row: { payload: unknown }): LiquidationData {
  return row.payload as LiquidationData;
}

function toReportDto(row: ReportListRow | ReportRow): ReportDto {
  const latest = row.snapshots[0];
  return {
    id: row.id,
    centerId: row.centerId,
    centerName: row.center.name,
    teacherName: row.teacher.fullName,
    type: row.type,
    periodStart: fromDbDate(row.periodStart),
    periodEnd: fromDbDate(row.periodEnd),
    status: row.status,
    currentVersion: row.currentVersion,
    total: latest === undefined ? "0.00" : snapshotData(latest).total,
    submittedAt: row.submittedAt.toISOString(),
  };
}

function buildForm(data: LiquidationData, kind: FormKind) {
  return kind === "summary"
    ? buildSummaryForm(data)
    : buildTransmittalForm(data);
}

function requirePrDay(data: LiquidationData, date: string) {
  const day = data.days.find((row) => row.date === date);
  if (day === undefined || day.status === "NOT_OPENED") {
    throw new NotFoundError("There is no Purchase Request for this date.");
  }
}

export function createLiquidationService(deps: {
  repository: LiquidationRepository;
  settings: SettingsRepository;
  now: () => Date;
}) {
  const { repository, settings, now } = deps;

  // Printed names are Settings fields, blank by default (A-10).
  async function readSignatories(): Promise<Signatories> {
    const [approvedByName, approvedByTitle, notedByName, notedByTitle] =
      await Promise.all([
        settings.read("approvedByName"),
        settings.read("approvedByTitle"),
        settings.read("notedByName"),
        settings.read("notedByTitle"),
      ]);
    return {
      approvedByName: approvedByName ?? "",
      approvedByTitle: approvedByTitle ?? "",
      notedByName: notedByName ?? "",
      notedByTitle: notedByTitle ?? "",
    };
  }

  async function gather(centerId: number, from: string, to: string) {
    const [center, teacherName, menuDays, prs, signatories] = await Promise.all(
      [
        repository.findCenter(centerId),
        repository.findActiveTeacherName(centerId),
        repository.listMenuDays(from, to),
        repository.listPrs(centerId, from, to),
        readSignatories(),
      ],
    );
    if (center === null) {
      throw new NotFoundError("This center was not found.");
    }
    return {
      prIds: prs.map((pr) => pr.id),
      data: buildLiquidationData({
        centerName: center.name,
        barangay: center.barangay,
        teacherName,
        from,
        to,
        menuDays,
        prs,
        signatories,
      }),
    };
  }

  // Teacher: own center. Admin: must name one.
  function pdfCenter(user: AuthUser, requested: number | undefined): number {
    const centerId = scopeToCenter(user, requested);
    if (centerId === null) {
      throw new ValidationError("Some fields are not valid.", [
        { field: "centerId", message: "Choose a center." },
      ]);
    }
    return centerId;
  }

  async function loadReport(user: AuthUser, id: number): Promise<ReportRow> {
    const row = await repository.findReport(id);
    if (row === null) {
      throw new NotFoundError("This report was not found.");
    }
    assertCenterAccess(user, row.centerId);
    return row;
  }

  function latestSnapshot(row: ReportRow) {
    const latest = row.snapshots[0];
    if (latest === undefined) {
      throw new NotFoundError("This report has no snapshot.");
    }
    return latest;
  }

  return {
    async preview(
      user: AuthUser,
      from: string,
      to: string,
    ): Promise<LiquidationData> {
      return (await gather(ownCenterId(user), from, to)).data;
    },

    async submit(
      user: AuthUser,
      from: string,
      to: string,
    ): Promise<ReportDetailDto> {
      const centerId = ownCenterId(user);
      const { data, prIds } = await gather(centerId, from, to);
      if (data.days.length === 0) {
        throw new RuleViolationError(
          "There are no feeding days in this period.",
        );
      }
      if (data.blockingDays.length > 0) {
        throw new RuleViolationError(
          "Every day must be locked or marked No feeding before you submit.",
          data.blockingDays.map((date) => ({
            field: "days",
            message: `${date} is not locked yet.`,
          })),
        );
      }

      const overlapping = await repository.findOverlapping(centerId, from, to);
      const revision = overlapping.find(
        (report) =>
          report.status === "NEED_REVISION" &&
          fromDbDate(report.periodStart) === from &&
          fromDbDate(report.periodEnd) === to,
      );
      if (overlapping.length > (revision === undefined ? 0 : 1)) {
        throw new ConflictError(
          "This period overlaps a report that was already submitted.",
        );
      }

      let reportId: number;
      try {
        if (revision === undefined) {
          reportId = await repository.submit({
            centerId,
            teacherId: user.id,
            from,
            to,
            prIds,
            payload: data,
            at: now(),
          });
        } else {
          reportId = revision.id;
          await repository.resubmit({
            reportId,
            versionNo: revision.currentVersion + 1,
            prIds,
            payload: data,
            at: now(),
          });
        }
      } catch {
        // Two tabs at once: the transaction rolled back, nothing was saved.
        throw new ConflictError(
          "This period was just submitted. Please refresh the page.",
        );
      }
      return this.getReport(user, reportId);
    },

    async pdfPurchaseRequest(
      user: AuthUser,
      date: string,
      requested: number | undefined,
    ): Promise<Buffer> {
      const { data } = await gather(pdfCenter(user, requested), date, date);
      requirePrDay(data, date);
      return renderPdf(buildPurchaseRequestForm(data, date));
    },

    async pdfForm(
      user: AuthUser,
      kind: FormKind,
      from: string,
      to: string,
      requested: number | undefined,
    ): Promise<Buffer> {
      const { data } = await gather(pdfCenter(user, requested), from, to);
      return renderPdf(buildForm(data, kind));
    },

    async listReports(
      user: AuthUser,
      page: {
        skip: number;
        take: number;
        status?: ReportStatus | undefined;
      },
    ): Promise<{ rows: ReportDto[]; total: number }> {
      const { rows, total } = await repository.listReports({
        centerId: scopeToCenter(user),
        ...page,
      });
      return { rows: rows.map(toReportDto), total };
    },

    // D10: what the Admin wrote on the Teacher's returned reports. The center comes
    // from the login, so another center's notes cannot be asked for.
    async listFeedback(
      user: AuthUser,
      page: { skip: number; take: number },
    ): Promise<{ rows: FeedbackDto[]; total: number }> {
      const { rows, total } = await repository.listFeedback({
        centerId: ownCenterId(user),
        ...page,
      });
      return {
        rows: rows.map((row) => ({
          id: row.id,
          reportId: row.reportId,
          periodStart: fromDbDate(row.report.periodStart),
          periodEnd: fromDbDate(row.report.periodEnd),
          versionNo: row.versionNo,
          feedback: row.feedback ?? "",
          reviewedAt: row.createdAt.toISOString(),
          reportStatus: row.report.status,
        })),
        total,
      };
    },

    async getReport(user: AuthUser, id: number): Promise<ReportDetailDto> {
      const row = await loadReport(user, id);
      return {
        ...toReportDto(row),
        reviews: row.reviews.map((review) => ({
          id: review.id,
          versionNo: review.versionNo,
          decision: review.decision,
          feedback: review.feedback,
          createdAt: review.createdAt.toISOString(),
        })),
      };
    },

    async snapshot(user: AuthUser, id: number): Promise<ReportSnapshotDto> {
      const latest = latestSnapshot(await loadReport(user, id));
      return {
        versionNo: latest.versionNo,
        createdAt: latest.createdAt.toISOString(),
        payload: snapshotData(latest),
      };
    },

    // PDFs of a submitted report come from the snapshot, not live data (P6-T08).
    async reportForm(user: AuthUser, id: number, kind: FormKind) {
      const latest = latestSnapshot(await loadReport(user, id));
      return renderPdf(buildForm(snapshotData(latest), kind));
    },

    async reportPurchaseRequest(user: AuthUser, id: number, date: string) {
      const data = snapshotData(latestSnapshot(await loadReport(user, id)));
      requirePrDay(data, date);
      return renderPdf(buildPurchaseRequestForm(data, date));
    },

    async review(
      user: AuthUser,
      id: number,
      input: z.output<typeof reviewSchema>,
    ): Promise<ReportDetailDto> {
      const row = await loadReport(user, id);
      const moved = await repository.review({
        reportId: id,
        versionNo: row.currentVersion,
        reviewerId: user.id,
        decision: input.decision,
        feedback: input.feedback === "" ? null : (input.feedback ?? null),
      });
      if (!moved) {
        throw new StateInvalidError("This report has already been decided.");
      }
      return this.getReport(user, id);
    },
  };
}

export type LiquidationService = ReturnType<typeof createLiquidationService>;
