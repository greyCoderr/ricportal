import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { ChildRecordsController } from "../child-records/child-records.controller.js";
import type { StudentsController } from "./students.controller.js";

// Teachers write in their own center; the Admin reads any center (A-16).
export function createStudentsRouter(
  controller: StudentsController,
  records: ChildRecordsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const read = [authenticate, requireRole("ADMIN", "TEACHER")];
  const write = [authenticate, requireRole("TEACHER")];
  router.get("/", read, controller.list);
  router.get("/summary", read, controller.summary);
  router.post("/", write, controller.create);
  router.get("/:id", read, controller.get);
  router.patch("/:id", write, controller.update);
  router.post("/:id/archive", write, controller.setStatus("ARCHIVED"));
  router.post("/:id/restore", write, controller.setStatus("ACTIVE"));
  router.get("/:id/conferences", read, records.listConferences);
  router.post("/:id/conferences", write, records.createConference);
  router.get("/:id/home-visits", read, records.listHomeVisits);
  router.post("/:id/home-visits", write, records.createHomeVisit);
  router.get("/:id/progress", read, records.listProgress);
  router.post("/:id/progress", write, records.createProgress);
  return router;
}

export function createEnrollmentFormRouter(
  controller: StudentsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.get(
    "/",
    authenticate,
    requireRole("ADMIN", "TEACHER"),
    controller.enrollmentForm,
  );
  return router;
}
