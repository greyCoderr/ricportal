export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "STATE_INVALID",
  "RULE_VIOLATION",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ErrorDetail = {
  field?: string;
  message: string;
};

export type ApiError = {
  error: {
    code: ErrorCode;
    message: string;
    details: ErrorDetail[];
  };
};

export type ApiSuccess<T, M = Record<string, never>> = {
  data: T;
  meta: M;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
};
