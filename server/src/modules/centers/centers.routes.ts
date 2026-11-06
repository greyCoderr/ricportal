import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { CentersController } from "./centers.controller.js";

// Admin only (blueprint 4.1).
export function createCentersRouter(
  controller: CentersController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const guard = [authenticate, requireRole("ADMIN")];
  router.get("/", guard, controller.list);
  router.post("/", guard, controller.create);
  router.patch("/:id", guard, controller.update);
  return router;
}
