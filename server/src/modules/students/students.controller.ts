import {
  enrollmentFormQuerySchema,
  studentCreateSchema,
  studentListQuerySchema,
  studentPatchSchema,
  studentSummaryQuerySchema,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { currentUser } from "../../core/middleware/authenticate.js";
import { parsePagination } from "../../core/pagination.js";
import { created, ok, paginated } from "../../core/response.js";
import { parseId, parseWith } from "../../core/validate.js";
import type { StudentsService } from "./students.service.js";

export function createStudentsController(service: StudentsService) {
  return {
    list: async (req: Request, res: Response) => {
      const query = req.query as Record<string, unknown>;
      const page = parsePagination(query);
      const { rows, total } = await service.list(
        currentUser(req),
        parseWith(studentListQuerySchema, query),
        { skip: page.skip, take: page.take },
      );
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    summary: async (req: Request, res: Response) => {
      ok(
        res,
        await service.summary(
          currentUser(req),
          parseWith(studentSummaryQuerySchema, req.query),
        ),
      );
    },

    create: async (req: Request, res: Response) => {
      created(
        res,
        await service.create(
          currentUser(req),
          parseWith(studentCreateSchema, req.body),
        ),
      );
    },

    get: async (req: Request, res: Response) => {
      ok(res, await service.get(currentUser(req), parseId(req.params.id)));
    },

    update: async (req: Request, res: Response) => {
      ok(
        res,
        await service.update(
          currentUser(req),
          parseId(req.params.id),
          parseWith(studentPatchSchema, req.body),
        ),
      );
    },

    setStatus: (status: "ACTIVE" | "ARCHIVED") => {
      return async (req: Request, res: Response) => {
        ok(
          res,
          await service.setStatus(
            currentUser(req),
            parseId(req.params.id),
            status,
          ),
        );
      };
    },

    enrollmentForm: async (req: Request, res: Response) => {
      const pdf = await service.enrollmentForm(
        currentUser(req),
        parseWith(enrollmentFormQuerySchema, req.query),
      );
      res
        .status(200)
        .set("Content-Type", "application/pdf")
        .set("Content-Disposition", 'inline; filename="enrollment-form.pdf"')
        .send(pdf);
    },
  };
}

export type StudentsController = ReturnType<typeof createStudentsController>;
