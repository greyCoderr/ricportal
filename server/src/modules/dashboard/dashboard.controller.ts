import type { Request, Response } from "express";
import { ok } from "../../core/response.js";
import type { DashboardService } from "./dashboard.service.js";

export function createDashboardController(service: DashboardService) {
  return {
    summary: async (_req: Request, res: Response) => {
      ok(res, await service.summary());
    },
  };
}

export type DashboardController = ReturnType<typeof createDashboardController>;
