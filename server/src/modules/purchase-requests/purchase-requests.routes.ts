import { Router, type RequestHandler } from "express";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { PurchaseRequestsController } from "./purchase-requests.controller.js";

export function createPurchaseRequestsRouter(
  controller: PurchaseRequestsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const teacher = [authenticate, requireRole("TEACHER")];
  router.get(
    "/:date",
    authenticate,
    requireRole("ADMIN", "TEACHER", "PARENT"),
    controller.get,
  );
  router.post("/:date/open", teacher, controller.open);
  router.post("/:date/items", teacher, controller.addItem);
  router.post("/:date/lock", teacher, controller.lock);
  router.post("/:date/unlock", teacher, controller.unlock);
  router.post("/:date/no-feeding", teacher, controller.noFeeding);
  return router;
}

// A Parent assigned to the day may edit a row (BR-12); the Admin never.
export function createPurchaseItemsRouter(
  controller: PurchaseRequestsController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.patch(
    "/:id",
    authenticate,
    requireRole("TEACHER", "PARENT"),
    controller.updateItem,
  );
  router.delete(
    "/:id",
    authenticate,
    requireRole("TEACHER"),
    controller.deleteItem,
  );
  return router;
}
