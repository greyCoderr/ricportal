import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { LiquidationController } from "./liquidation.controller.js";

export function createLiquidationRouter(
  controller: LiquidationController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const teacher = [authenticate, requireRole("TEACHER")];
  const read = [authenticate, requireRole("ADMIN", "TEACHER")];
  router.get("/preview", teacher, controller.preview);
  router.post("/submit", teacher, controller.submit);
  router.get("/pdf/purchase-request", read, controller.pdfPurchaseRequest);
  router.get("/pdf/summary", read, controller.pdfForm("summary"));
  router.get("/pdf/transmittal", read, controller.pdfForm("transmittal"));
  return router;
}

export function createReportsRouter(
  controller: LiquidationController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const read = [authenticate, requireRole("ADMIN", "TEACHER")];
  router.get("/", read, controller.listReports);
  router.get("/:id", read, controller.getReport);
  router.get("/:id/snapshot", read, controller.snapshot);
  router.post(
    "/:id/review",
    authenticate,
    requireRole("ADMIN"),
    controller.review,
  );
  router.get(
    "/:id/pdf/purchase-request",
    read,
    controller.reportPurchaseRequest,
  );
  router.get("/:id/pdf/summary", read, controller.reportForm("summary"));
  router.get(
    "/:id/pdf/transmittal",
    read,
    controller.reportForm("transmittal"),
  );
  return router;
}
