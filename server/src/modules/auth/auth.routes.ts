import { Router, type RequestHandler } from "express";
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
  return router;
}

export function createPublicRouter(controller: AuthController): Router {
  const router = Router();
  router.get("/centers", controller.publicCenters);
  return router;
}
