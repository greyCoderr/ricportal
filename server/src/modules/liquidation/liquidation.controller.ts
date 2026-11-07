import {
  reportListQuerySchema,
  calendarQuerySchema,
  prDateQuerySchema,
  prQuerySchema,
  reportDateQuerySchema,
  reviewSchema,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { currentUser } from "../../core/middleware/authenticate.js";
import { parsePagination } from "../../core/pagination.js";
import { created, ok, paginated } from "../../core/response.js";
import { parseId, parseWith } from "../../core/validate.js";
import type { FormKind, LiquidationService } from "./liquidation.service.js";

function sendPdf(res: Response, pdf: Buffer, filename: string): void {
  res
    .status(200)
    .set("Content-Type", "application/pdf")
    .set("Content-Disposition", `inline; filename="${filename}"`)
    .send(pdf);
}

export function createLiquidationController(service: LiquidationService) {
  return {
    preview: async (req: Request, res: Response) => {
      const { from, to } = parseWith(calendarQuerySchema, req.query);
      ok(res, await service.preview(currentUser(req), from, to));
    },

    submit: async (req: Request, res: Response) => {
      const { from, to } = parseWith(calendarQuerySchema, req.body);
      created(res, await service.submit(currentUser(req), from, to));
    },

    pdfPurchaseRequest: async (req: Request, res: Response) => {
      const { date, centerId } = parseWith(prDateQuerySchema, req.query);
      sendPdf(
        res,
        await service.pdfPurchaseRequest(currentUser(req), date, centerId),
        "purchase-request.pdf",
      );
    },

    pdfForm: (kind: FormKind) => {
      return async (req: Request, res: Response) => {
        const { from, to } = parseWith(calendarQuerySchema, req.query);
        const { centerId } = parseWith(prQuerySchema, req.query);
        sendPdf(
          res,
          await service.pdfForm(currentUser(req), kind, from, to, centerId),
          `${kind}.pdf`,
        );
      };
    },

    listReports: async (req: Request, res: Response) => {
      const page = parsePagination(req.query);
      const { rows, total } = await service.listReports(currentUser(req), {
        skip: page.skip,
        take: page.take,
        ...parseWith(reportListQuerySchema, req.query),
      });
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    listFeedback: async (req: Request, res: Response) => {
      const page = parsePagination(req.query);
      const { rows, total } = await service.listFeedback(currentUser(req), {
        skip: page.skip,
        take: page.take,
      });
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    getReport: async (req: Request, res: Response) => {
      ok(
        res,
        await service.getReport(currentUser(req), parseId(req.params.id)),
      );
    },

    snapshot: async (req: Request, res: Response) => {
      ok(res, await service.snapshot(currentUser(req), parseId(req.params.id)));
    },

    review: async (req: Request, res: Response) => {
      ok(
        res,
        await service.review(
          currentUser(req),
          parseId(req.params.id),
          parseWith(reviewSchema, req.body),
        ),
      );
    },

    reportForm: (kind: FormKind) => {
      return async (req: Request, res: Response) => {
        sendPdf(
          res,
          await service.reportForm(
            currentUser(req),
            parseId(req.params.id),
            kind,
          ),
          `${kind}.pdf`,
        );
      };
    },

    reportPurchaseRequest: async (req: Request, res: Response) => {
      const { date } = parseWith(reportDateQuerySchema, req.query);
      sendPdf(
        res,
        await service.reportPurchaseRequest(
          currentUser(req),
          parseId(req.params.id),
          date,
        ),
        "purchase-request.pdf",
      );
    },
  };
}

export type LiquidationController = ReturnType<
  typeof createLiquidationController
>;
