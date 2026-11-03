import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { AppError, InternalError, ValidationError } from "../errors.js";

function isJsonParseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}

function toAppError(error: unknown): AppError | null {
  if (error instanceof AppError) {
    return error;
  }
  if (isJsonParseError(error)) {
    return new ValidationError("Request body is not valid JSON.");
  }
  return null;
}

// Unknown errors are logged in full but answered with a generic INTERNAL
// message, so stack traces, SQL and raw messages never reach the client.
export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const known = toAppError(error);
    const appError = known ?? new InternalError();

    if (known === null || appError.status >= 500) {
      logger.error(
        {
          err: error,
          requestId: req.requestId,
          method: req.method,
          path: req.path,
        },
        "request failed",
      );
    }

    res.status(appError.status).json(appError.toBody());
  };
}
