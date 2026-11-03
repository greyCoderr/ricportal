import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  RateLimitedError,
  RuleViolationError,
  StateInvalidError,
  UnauthenticatedError,
  ValidationError,
} from "./errors.js";

const cases = [
  { Cls: ValidationError, code: "VALIDATION_ERROR", status: 400 },
  { Cls: UnauthenticatedError, code: "UNAUTHENTICATED", status: 401 },
  { Cls: ForbiddenError, code: "FORBIDDEN", status: 403 },
  { Cls: NotFoundError, code: "NOT_FOUND", status: 404 },
  { Cls: ConflictError, code: "CONFLICT", status: 409 },
  { Cls: StateInvalidError, code: "STATE_INVALID", status: 409 },
  { Cls: RuleViolationError, code: "RULE_VIOLATION", status: 422 },
  { Cls: RateLimitedError, code: "RATE_LIMITED", status: 429 },
  { Cls: InternalError, code: "INTERNAL", status: 500 },
] as const;

describe("AppError subclasses", () => {
  it.each(cases)("$code has status $status", ({ Cls, code, status }) => {
    const error = new Cls();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error.message.length).toBeGreaterThan(0);
    expect(error.details).toEqual([]);
  });

  it("keeps a custom message and details", () => {
    const error = new ValidationError("Check the form.", [
      { field: "birthdate", message: "Use YYYY-MM-DD." },
    ]);

    expect(error.message).toBe("Check the form.");
    expect(error.details).toEqual([
      { field: "birthdate", message: "Use YYYY-MM-DD." },
    ]);
  });

  it("builds the public error body", () => {
    const error = new ConflictError("Already exists.");

    expect(error.toBody()).toEqual({
      error: { code: "CONFLICT", message: "Already exists.", details: [] },
    });
  });
});
