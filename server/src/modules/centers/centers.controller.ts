import { centerCreateSchema, centerPatchSchema } from "@ricportal/shared";
import type { Request, Response } from "express";
import { parsePagination } from "../../core/pagination.js";
import { created, ok, paginated } from "../../core/response.js";
import { parseId, parseWith } from "../../core/validate.js";
import type { CentersService } from "./centers.service.js";

export function createCentersController(service: CentersService) {
  return {
    async list(req: Request, res: Response) {
      const query = req.query as Record<string, unknown>;
      const page = parsePagination(query);
      const q = typeof query.q === "string" ? query.q.trim() : "";
      const { rows, total } = await service.list({
        q: q === "" ? undefined : q,
        skip: page.skip,
        take: page.take,
      });
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    async create(req: Request, res: Response) {
      created(
        res,
        await service.create(parseWith(centerCreateSchema, req.body)),
      );
    },

    async update(req: Request, res: Response) {
      ok(
        res,
        await service.update(
          parseId(req.params.id),
          parseWith(centerPatchSchema, req.body),
        ),
      );
    },
  };
}

export type CentersController = ReturnType<typeof createCentersController>;
