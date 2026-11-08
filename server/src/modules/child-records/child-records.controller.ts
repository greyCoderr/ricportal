import {
  childRecordListQuerySchema,
  conferencePatchSchema,
  conferenceSchema,
  homeVisitPatchSchema,
  homeVisitSchema,
  progressPatchSchema,
  progressSchema,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { currentUser } from "../../core/middleware/authenticate.js";
import { parsePagination } from "../../core/pagination.js";
import { created, ok, paginated } from "../../core/response.js";
import { parseId, parseWith } from "../../core/validate.js";
import type { ChildRecordsService } from "./child-records.service.js";

const DELETED = { deleted: true };

export function createChildRecordsController(service: ChildRecordsService) {
  return {
    listChildren: async (req: Request, res: Response) => {
      const query = req.query as Record<string, unknown>;
      const page = parsePagination(query);
      const { rows, total } = await service.listChildren(
        currentUser(req),
        parseWith(childRecordListQuerySchema, query),
        { skip: page.skip, take: page.take },
      );
      paginated(res, rows, { ...page, total });
    },

    listConferences: async (req: Request, res: Response) => {
      ok(
        res,
        await service.listConferences(currentUser(req), parseId(req.params.id)),
      );
    },
    createConference: async (req: Request, res: Response) => {
      created(
        res,
        await service.createConference(
          currentUser(req),
          parseId(req.params.id),
          parseWith(conferenceSchema, req.body),
        ),
      );
    },
    updateConference: async (req: Request, res: Response) => {
      ok(
        res,
        await service.updateConference(
          currentUser(req),
          parseId(req.params.id),
          parseWith(conferencePatchSchema, req.body),
        ),
      );
    },
    deleteConference: async (req: Request, res: Response) => {
      await service.deleteConference(currentUser(req), parseId(req.params.id));
      ok(res, DELETED);
    },

    listHomeVisits: async (req: Request, res: Response) => {
      ok(
        res,
        await service.listHomeVisits(currentUser(req), parseId(req.params.id)),
      );
    },
    createHomeVisit: async (req: Request, res: Response) => {
      created(
        res,
        await service.createHomeVisit(
          currentUser(req),
          parseId(req.params.id),
          parseWith(homeVisitSchema, req.body),
        ),
      );
    },
    updateHomeVisit: async (req: Request, res: Response) => {
      ok(
        res,
        await service.updateHomeVisit(
          currentUser(req),
          parseId(req.params.id),
          parseWith(homeVisitPatchSchema, req.body),
        ),
      );
    },
    deleteHomeVisit: async (req: Request, res: Response) => {
      await service.deleteHomeVisit(currentUser(req), parseId(req.params.id));
      ok(res, DELETED);
    },

    listProgress: async (req: Request, res: Response) => {
      ok(
        res,
        await service.listProgress(currentUser(req), parseId(req.params.id)),
      );
    },
    createProgress: async (req: Request, res: Response) => {
      created(
        res,
        await service.createProgress(
          currentUser(req),
          parseId(req.params.id),
          parseWith(progressSchema, req.body),
        ),
      );
    },
    updateProgress: async (req: Request, res: Response) => {
      ok(
        res,
        await service.updateProgress(
          currentUser(req),
          parseId(req.params.id),
          parseWith(progressPatchSchema, req.body),
        ),
      );
    },
    deleteProgress: async (req: Request, res: Response) => {
      await service.deleteProgress(currentUser(req), parseId(req.params.id));
      ok(res, DELETED);
    },
  };
}

export type ChildRecordsController = ReturnType<
  typeof createChildRecordsController
>;
