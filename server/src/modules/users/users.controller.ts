import {
  teacherCreateSchema,
  teacherPatchSchema,
  USER_STATUSES,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { z } from "zod";
import { currentUser } from "../../core/middleware/authenticate.js";
import { parsePagination } from "../../core/pagination.js";
import { created, ok, paginated } from "../../core/response.js";
import { ownCenterId } from "../../core/scope.js";
import { parseId, parseWith } from "../../core/validate.js";
import type { ParentAction, UsersService } from "./users.service.js";

const parentQuerySchema = z.object({
  status: z.enum(USER_STATUSES).optional(),
});

export function createUsersController(service: UsersService) {
  return {
    async listTeachers(req: Request, res: Response) {
      const page = parsePagination(req.query as Record<string, unknown>);
      const { rows, total } = await service.listTeachers({
        skip: page.skip,
        take: page.take,
      });
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    async createTeacher(req: Request, res: Response) {
      created(
        res,
        await service.createTeacher(parseWith(teacherCreateSchema, req.body)),
      );
    },

    async updateTeacher(req: Request, res: Response) {
      ok(
        res,
        await service.updateTeacher(
          parseId(req.params.id),
          parseWith(teacherPatchSchema, req.body),
        ),
      );
    },

    async resetTeacherPassword(req: Request, res: Response) {
      ok(res, await service.resetTeacherPassword(parseId(req.params.id)));
    },

    async listParents(req: Request, res: Response) {
      const query = req.query as Record<string, unknown>;
      const page = parsePagination(query);
      const { status } = parseWith(parentQuerySchema, {
        status: query.status,
      });
      const { rows, total } = await service.listParents({
        centerId: ownCenterId(currentUser(req)),
        status,
        skip: page.skip,
        take: page.take,
      });
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    moveParent(action: ParentAction) {
      return async (req: Request, res: Response) => {
        ok(
          res,
          await service.moveParent(
            parseId(req.params.id),
            ownCenterId(currentUser(req)),
            action,
          ),
        );
      };
    },

    async resetParentPassword(req: Request, res: Response) {
      ok(
        res,
        await service.resetParentPassword(
          parseId(req.params.id),
          ownCenterId(currentUser(req)),
        ),
      );
    },
  };
}

export type UsersController = ReturnType<typeof createUsersController>;
