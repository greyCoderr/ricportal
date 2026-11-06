import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { ChildRecordsController } from "./child-records.controller.js";

// Editing an entry is for the Teacher of the center only (BR-22, A-16).
function entryRouter(
  update: RequestHandler,
  remove: RequestHandler,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const write = [authenticate, requireRole("TEACHER")];
  router.patch("/:id", write, update);
  router.delete("/:id", write, remove);
  return router;
}

export function createConferencesRouter(
  controller: ChildRecordsController,
  authenticate: RequestHandler,
): Router {
  return entryRouter(
    controller.updateConference,
    controller.deleteConference,
    authenticate,
  );
}

export function createHomeVisitsRouter(
  controller: ChildRecordsController,
  authenticate: RequestHandler,
): Router {
  return entryRouter(
    controller.updateHomeVisit,
    controller.deleteHomeVisit,
    authenticate,
  );
}

export function createProgressRouter(
  controller: ChildRecordsController,
  authenticate: RequestHandler,
): Router {
  return entryRouter(
    controller.updateProgress,
    controller.deleteProgress,
    authenticate,
  );
}
