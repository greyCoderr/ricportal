import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { AuthController } from "./auth.controller.js";

// Login and sign-up are public. The session routes need a login but no role,
// so a user who must change the password can still reach them.
export function createAuthRouter(
  controller: AuthController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.post("/login", controller.login);
  router.post("/parent-signup", controller.parentSignup);
  router.post("/logout", authenticate, controller.logout);
  router.get("/me", authenticate, controller.me);
  router.post("/change-password", authenticate, controller.changePassword);
  // requireRole also blocks these while a password change is forced. A user
  // only ever reaches their own row, so there is no center scope to apply.
  const everyRole = requireRole("ADMIN", "TEACHER", "PARENT");
  router.get("/profile", authenticate, everyRole, controller.profile);
  router.patch("/profile", authenticate, everyRole, controller.updateProfile);
  router.get("/profile/activity", authenticate, everyRole, controller.activity);
  router.get("/logins", authenticate, everyRole, controller.logins);
  // Plan 4 D9: the Teacher's own summary. Every query in it is limited to the
  // caller's id and center, so no other scope applies.
  router.get(
    "/profile/teacher-summary",
    authenticate,
    requireRole("TEACHER"),
    controller.teacherSummary,
  );
  return router;
}

export function createPublicRouter(controller: AuthController): Router {
  const router = Router();
  router.get("/centers", controller.publicCenters);
  return router;
}
