import {
  itemAddSchema,
  itemPatchSchema,
  prQuerySchema,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { currentUser } from "../../core/middleware/authenticate.js";
import { created, ok } from "../../core/response.js";
import { parseDay, parseId, parseWith } from "../../core/validate.js";
import type { PurchaseRequestsService } from "./purchase-requests.service.js";

export function createPurchaseRequestsController(
  service: PurchaseRequestsService,
) {
  return {
    get: async (req: Request, res: Response) => {
      const { centerId } = parseWith(prQuerySchema, req.query);
      ok(
        res,
        await service.get(
          currentUser(req),
          parseDay(req.params.date),
          centerId,
        ),
      );
    },

    open: async (req: Request, res: Response) => {
      ok(res, await service.open(currentUser(req), parseDay(req.params.date)));
    },

    addItem: async (req: Request, res: Response) => {
      const { description } = parseWith(itemAddSchema, req.body);
      created(
        res,
        await service.addItem(
          currentUser(req),
          parseDay(req.params.date),
          description,
        ),
      );
    },

    lock: async (req: Request, res: Response) => {
      ok(res, await service.lock(currentUser(req), parseDay(req.params.date)));
    },

    unlock: async (req: Request, res: Response) => {
      ok(
        res,
        await service.unlock(currentUser(req), parseDay(req.params.date)),
      );
    },

    noFeeding: async (req: Request, res: Response) => {
      ok(
        res,
        await service.noFeeding(currentUser(req), parseDay(req.params.date)),
      );
    },

    updateItem: async (req: Request, res: Response) => {
      ok(
        res,
        await service.updateItem(
          currentUser(req),
          parseId(req.params.id),
          parseWith(itemPatchSchema, req.body),
        ),
      );
    },

    deleteItem: async (req: Request, res: Response) => {
      await service.deleteItem(currentUser(req), parseId(req.params.id));
      ok(res, { deleted: true });
    },
  };
}

export type PurchaseRequestsController = ReturnType<
  typeof createPurchaseRequestsController
>;
