import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { DashboardController } from "./dashboard.controller.js";

// Counts across every center, so it is for the Admin only.
export function createDashboardRouter(
  controller: DashboardController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.get(
    "/summary",
    authenticate,
    requireRole("ADMIN"),
    controller.summary,
  );
  return router;
}
