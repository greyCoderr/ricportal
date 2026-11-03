import { Router } from "express";
import type { HealthController } from "./health.controller.js";

// Public by design (DEC-001): no authenticate or requireRole. The global rate
// limit still applies. Mounted at /api/health.
export function createHealthRouter(controller: HealthController): Router {
  const router = Router();
  router.get("/", controller.get);
  return router;
}
