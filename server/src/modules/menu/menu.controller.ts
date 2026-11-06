import { calendarQuerySchema, menuConfirmSchema } from "@ricportal/shared";
import type { Request, Response } from "express";
import { ValidationError } from "../../core/errors.js";
import { currentUser } from "../../core/middleware/authenticate.js";
import { parsePagination } from "../../core/pagination.js";
import { created, ok, paginated } from "../../core/response.js";
import { parseWith } from "../../core/validate.js";
import type { MenuService } from "./menu.service.js";

export function createMenuController(service: MenuService) {
  return {
    preview: async (req: Request, res: Response) => {
      const file = req.file;
      if (file === undefined) {
        throw new ValidationError("Some fields are not valid.", [
          { field: "file", message: "Choose the DSWD Excel file." },
        ]);
      }
      ok(
        res,
        await service.preview({
          buffer: file.buffer,
          fileName: file.originalname,
          uploadedBy: currentUser(req).id,
        }),
      );
    },

    confirm: async (req: Request, res: Response) => {
      const { token } = parseWith(menuConfirmSchema, req.body);
      created(res, await service.confirm(token));
    },

    listBatches: async (req: Request, res: Response) => {
      const page = parsePagination(req.query);
      const { rows, total } = await service.listBatches({
        skip: page.skip,
        take: page.take,
      });
      paginated(res, rows, { page: page.page, pageSize: page.pageSize, total });
    },

    calendar: async (req: Request, res: Response) => {
      const { from, to } = parseWith(calendarQuerySchema, req.query);
      ok(res, await service.calendar(from, to));
    },
  };
}

export type MenuController = ReturnType<typeof createMenuController>;
