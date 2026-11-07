import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { UsersController } from "./users.controller.js";

// Teacher accounts are managed by the Admin (BR-04, BR-05).
export function createTeachersRouter(
  controller: UsersController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const guard = [authenticate, requireRole("ADMIN")];
  router.get("/", guard, controller.listTeachers);
  router.post("/", guard, controller.createTeacher);
  router.get("/:id", guard, controller.getTeacher);
  router.patch("/:id", guard, controller.updateTeacher);
  router.post("/:id/reset-password", guard, controller.resetTeacherPassword);
  return router;
}

// Parents are managed by the Teacher of their center (BR-02, BR-03, BR-05).
export function createParentsRouter(
  controller: UsersController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const guard = [authenticate, requireRole("TEACHER")];
  router.get("/", guard, controller.listParents);
  router.get("/approved", guard, controller.listApprovedParents);
  router.post("/:id/approve", guard, controller.moveParent("approve"));
  router.post("/:id/decline", guard, controller.moveParent("decline"));
  router.post("/:id/disable", guard, controller.moveParent("disable"));
  router.post("/:id/enable", guard, controller.moveParent("enable"));
  router.post("/:id/reset-password", guard, controller.resetParentPassword);
  return router;
}
