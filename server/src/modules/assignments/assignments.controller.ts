import {
  assignmentPutSchema,
  assignmentWeekSchema,
  scheduleQuerySchema,
  weekSaveSchema,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { currentUser } from "../../core/middleware/authenticate.js";
import { ok } from "../../core/response.js";
import { parseDay, parseWith } from "../../core/validate.js";
import type { AssignmentsService } from "./assignments.service.js";

export function createAssignmentsController(service: AssignmentsService) {
  return {
    week: async (req: Request, res: Response) => {
      const { week } = parseWith(assignmentWeekSchema, req.query);
      ok(res, await service.week(currentUser(req), week));
    },

    readWeek: async (req: Request, res: Response) => {
      const { week } = parseWith(assignmentWeekSchema, req.query);
      ok(res, await service.readWeek(currentUser(req), week));
    },

    saveWeek: async (req: Request, res: Response) => {
      ok(
        res,
        await service.saveWeek(
          currentUser(req),
          parseWith(weekSaveSchema, req.body),
        ),
      );
    },

    replace: async (req: Request, res: Response) => {
      const { parentIds } = parseWith(assignmentPutSchema, req.body);
      ok(
        res,
        await service.replace(
          currentUser(req),
          parseDay(req.params.date),
          parentIds,
        ),
      );
    },

    schedule: async (req: Request, res: Response) => {
      const { from, to } = parseWith(scheduleQuerySchema, req.query);
      ok(res, await service.schedule(currentUser(req), from, to));
    },
  };
}

export type AssignmentsController = ReturnType<
  typeof createAssignmentsController
>;
