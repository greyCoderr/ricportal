import {
  ERROR_CODES,
  type ApiSuccess,
  type ErrorCode,
  type ErrorDetail,
} from "@ricportal/shared";

// The only place that calls fetch. Components use feature hooks, never this
// directly. Response bodies are never logged.

// NETWORK_ERROR is client-only: the request failed, or the response did not
// come from our API (for example the dev proxy's error page). DEC-021.
export type ClientErrorCode = ErrorCode | "NETWORK_ERROR";

const NETWORK_MESSAGE =
  "Cannot reach the server. Please check your connection and try again.";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ClientErrorCode;
  readonly details: ErrorDetail[];

  constructor(
    status: number,
    code: ClientErrorCode,
    message: string,
    details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isErrorCode(value: unknown): value is ErrorCode {
  return (ERROR_CODES as readonly unknown[]).includes(value);
}

function isDetail(value: unknown): value is ErrorDetail {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    (value.field === undefined || typeof value.field === "string")
  );
}

function toApiError(status: number, body: unknown): ApiError {
  if (isRecord(body) && isRecord(body.error)) {
    const { code, message, details } = body.error;
    if (
      isErrorCode(code) &&
      typeof message === "string" &&
      Array.isArray(details) &&
      details.every(isDetail)
    ) {
      return new ApiError(status, code, message, details);
    }
  }
  return new ApiError(status, "NETWORK_ERROR", NETWORK_MESSAGE);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T, M = Record<string, never>>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<ApiSuccess<T, M>> {
  const headers = new Headers({ Accept: "application/json" });
  const init: RequestInit = { method, headers, credentials: "same-origin" };
  if (body instanceof FormData) {
    // The browser sets the multipart Content-Type with its boundary.
    init.body = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", NETWORK_MESSAGE);
  }

  const json = await readJson(response);
  if (!response.ok) {
    throw toApiError(response.status, json);
  }
  if (!isRecord(json) || !("data" in json) || !isRecord(json.meta)) {
    throw new ApiError(response.status, "NETWORK_ERROR", NETWORK_MESSAGE);
  }
  return json as ApiSuccess<T, M>;
}

export function apiGet<T, M = Record<string, never>>(
  path: string,
): Promise<ApiSuccess<T, M>> {
  return apiRequest<T, M>("GET", path);
}
