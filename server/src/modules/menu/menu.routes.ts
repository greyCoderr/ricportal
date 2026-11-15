import { Router, type RequestHandler } from "express";
import multer from "multer";
import { MENU_UPLOAD_MAX_BYTES } from "../../config/limits.js";
import { PayloadTooLargeError, ValidationError } from "../../core/errors.js";
import { requireRole } from "../../core/middleware/authenticate.js";
import type { MenuController } from "./menu.controller.js";

const ONE_FILE = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MENU_UPLOAD_MAX_BYTES, files: 1 },
}).single("file");

const WRONG_TYPE = () =>
  new ValidationError("Some fields are not valid.", [
    { field: "file", message: "Choose an Excel file ending in .xlsx." },
  ]);

// The size of the file_name column (AUD-007).
const MAX_FILE_NAME_LENGTH = 255;

// An .xlsx file is a ZIP archive, which starts with these four bytes.
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

// Runs multer and turns its errors into the standard shape; its own text never
// reaches the client.
const receiveXlsx: RequestHandler = (req, res, next) => {
  ONE_FILE(req, res, (error: unknown) => {
    if (error !== undefined && error !== null) {
      if (error instanceof multer.MulterError) {
        next(
          error.code === "LIMIT_FILE_SIZE"
            ? new PayloadTooLargeError("The file must be 5 MB or smaller.")
            : WRONG_TYPE(),
        );
        return;
      }
      next(WRONG_TYPE());
      return;
    }
    const file = req.file;
    if (
      file !== undefined &&
      (!file.originalname.toLowerCase().endsWith(".xlsx") ||
        !file.buffer.subarray(0, 4).equals(ZIP_SIGNATURE))
    ) {
      next(WRONG_TYPE());
      return;
    }
    if (file !== undefined && file.originalname.length > MAX_FILE_NAME_LENGTH) {
      next(
        new ValidationError("Some fields are not valid.", [
          {
            field: "file",
            message:
              "The file name is too long. Rename the file and try again.",
          },
        ]),
      );
      return;
    }
    next();
  });
};

export function createMenuRouter(
  controller: MenuController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const admin = [authenticate, requireRole("ADMIN")];
  router.post("/imports/preview", admin, receiveXlsx, controller.preview);
  router.post("/imports/confirm", admin, controller.confirm);
  router.get("/batches", admin, controller.listBatches);
  return router;
}

export function createCalendarRouter(
  controller: MenuController,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.get(
    "/",
    authenticate,
    requireRole("ADMIN", "TEACHER"),
    controller.calendar,
  );
  return router;
}
