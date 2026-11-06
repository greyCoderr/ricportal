import type { ErrorDetail } from "@ricportal/shared";
import type { z } from "zod";
import { ValidationError } from "./errors.js";

function toDetails(error: z.ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

// Every request body and query goes through a shared Zod schema. Express 5's
// req.query is read-only, so the parsed value is returned, not assigned.
export function parseWith<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      "Some fields are not valid.",
      toDetails(result.error),
    );
  }
  return result.data;
}

export function parseId(value: unknown): number {
  const id = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isInteger(id) || id <= 0 || id > 2_147_483_647) {
    throw new ValidationError("The id in the address is not valid.");
  }
  return id;
}
