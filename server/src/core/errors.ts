import type { ApiError, ErrorCode, ErrorDetail } from "@ricportal/shared";

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  STATE_INVALID: 409,
  PAYLOAD_TOO_LARGE: 413,
  RULE_VIOLATION: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  SERVICE_UNAVAILABLE: 503,
};

// The message of an AppError is written for the user and is sent to the client.
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }

  toBody(): ApiError {
    return {
      error: { code: this.code, message: this.message, details: this.details },
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Some fields are not valid.",
    details: ErrorDetail[] = [],
  ) {
    super("VALIDATION_ERROR", message, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Please log in.", details: ErrorDetail[] = []) {
    super("UNAUTHENTICATED", message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "You do not have permission to do this.",
    details: ErrorDetail[] = [],
  ) {
    super("FORBIDDEN", message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "The requested resource was not found.",
    details: ErrorDetail[] = [],
  ) {
    super("NOT_FOUND", message, details);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "This conflicts with existing data.",
    details: ErrorDetail[] = [],
  ) {
    super("CONFLICT", message, details);
  }
}

export class StateInvalidError extends AppError {
  constructor(
    message = "This action is not allowed in the current state.",
    details: ErrorDetail[] = [],
  ) {
    super("STATE_INVALID", message, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(
    message = "Request body is too large.",
    details: ErrorDetail[] = [],
  ) {
    super("PAYLOAD_TOO_LARGE", message, details);
  }
}

export class RuleViolationError extends AppError {
  constructor(
    message = "This action breaks a business rule.",
    details: ErrorDetail[] = [],
  ) {
    super("RULE_VIOLATION", message, details);
  }
}

export class RateLimitedError extends AppError {
  constructor(
    message = "Too many requests. Please wait and try again.",
    details: ErrorDetail[] = [],
  ) {
    super("RATE_LIMITED", message, details);
  }
}

export class InternalError extends AppError {
  constructor(
    message = "Something went wrong. Please try again.",
    details: ErrorDetail[] = [],
  ) {
    super("INTERNAL", message, details);
  }
}

// A dependency such as the database is not answering (health check, DEC-020).
export class ServiceUnavailableError extends AppError {
  constructor(
    message = "The service is temporarily unavailable. Please try again.",
    details: ErrorDetail[] = [],
  ) {
    super("SERVICE_UNAVAILABLE", message, details);
  }
}
