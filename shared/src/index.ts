export const APP_NAME = "RICPortal";

// The Express port when PORT is not set. The client dev proxy uses the same
// number, so both sides agree without reading .env (DEC-021).
export const DEFAULT_SERVER_PORT = 3000;

export {
  ERROR_CODES,
  type ApiError,
  type ApiSuccess,
  type ErrorCode,
  type ErrorDetail,
  type HealthStatus,
  type PageMeta,
} from "./api.js";
