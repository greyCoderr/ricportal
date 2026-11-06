import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { AssignmentsController } from "./assignments.controller.js";

export function createAssignmentsRouter(
  controller: AssignmentsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const teacher = [authenticate, requireRole("TEACHER")];
  router.get("/", teacher, controller.week);
  router.put("/:date", teacher, controller.replace);
  return router;
}

export function createParentScheduleRouter(
  controller: AssignmentsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.get("/", authenticate, requireRole("PARENT"), controller.schedule);
  return router;
}
