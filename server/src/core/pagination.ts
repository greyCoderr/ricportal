import type { ErrorDetail } from "@ricportal/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../config/limits.js";
import { ValidationError } from "./errors.js";

export type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

const WHOLE_NUMBER = /^[0-9]+$/;

function readWholeNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number | null {
  if (value === undefined || value === "") {
    return fallback;
  }
  if (typeof value !== "string" || !WHOLE_NUMBER.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? parsed : null;
}

export function parsePagination(
  query: Readonly<Record<string, unknown>>,
): Pagination {
  const page = readWholeNumber(query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = readWholeNumber(
    query.pageSize,
    DEFAULT_PAGE_SIZE,
    1,
    MAX_PAGE_SIZE,
  );

  const details: ErrorDetail[] = [];
  if (page === null) {
    details.push({
      field: "page",
      message: "Must be a whole number of 1 or more.",
    });
  }
  if (pageSize === null) {
    details.push({
      field: "pageSize",
      message: `Must be a whole number from 1 to ${MAX_PAGE_SIZE}.`,
    });
  }
  if (page === null || pageSize === null) {
    throw new ValidationError("Some list options are not valid.", details);
  }

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
