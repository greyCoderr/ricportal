import type { Request, Response } from "express";
import { ok } from "../../core/response.js";
import type { HealthService } from "./health.service.js";

export type HealthController = {
  get: (req: Request, res: Response) => Promise<void>;
};

export function createHealthController(
  service: HealthService,
): HealthController {
  return {
    async get(_req, res) {
      // Set before the check so the 503 is never cached either.
      res.set("Cache-Control", "no-store");
      ok(res, await service.check());
    },
  };
}
