import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { isWriteConflict } from "../db-errors.js";
import {
  AppError,
  ConflictError,
  InternalError,
  PayloadTooLargeError,
  RateLimitedError,
  ValidationError,
} from "../errors.js";

function bodyParserType(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof error.type === "string"
  ) {
    return error.type;
  }
  return null;
}

function toAppError(error: unknown): AppError | null {
  if (error instanceof AppError) {
    return error;
  }
  switch (bodyParserType(error)) {
    case "entity.parse.failed":
      return new ValidationError("Request body is not valid JSON.");
    case "entity.too.large":
      return new PayloadTooLargeError();
    default:
      break;
  }
  // The second of two requests that wrote the same thing at once: a safe 409
  // instead of a 500 (AUD-005). Its transaction was rolled back.
  if (isWriteConflict(error)) {
    return new ConflictError(
      "This was just saved by another request. Please refresh and try again.",
    );
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

    if (
      appError instanceof RateLimitedError &&
      appError.retryAfterSeconds !== undefined
    ) {
      res.set("Retry-After", String(appError.retryAfterSeconds));
    }
    res.status(appError.status).json(appError.toBody());
  };
}
