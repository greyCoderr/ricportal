# API

Every endpoint that exists now: method and path, role, request fields, response and error codes.

## Endpoints

None yet. The first one, `GET /api/health`, comes in P0-T08.

## Conventions in force (blueprint 4.8)

**Success:** `{ "data": ..., "meta": { ... } }`. `meta` is always present (`{}` when empty). Lists use `meta: { page, pageSize, total }`.

**Error:** `{ "error": { "code": "...", "message": "...", "details": [ { "field": "...", "message": "..." } ] } }`. `details` is always an array (empty when there is nothing to add).

| Code | Status | Used for |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | Invalid input, including a body that is not valid JSON ("Request body is not valid JSON.") |
| UNAUTHENTICATED | 401 | Not logged in |
| FORBIDDEN | 403 | Role not allowed |
| NOT_FOUND | 404 | Unknown route ("The requested resource was not found."), or a row in another center |
| CONFLICT | 409 | Duplicate or version conflict |
| STATE_INVALID | 409 | Wrong state for the action |
| PAYLOAD_TOO_LARGE | 413 | Request body over `BODY_LIMIT` ("Request body is too large."). Uploads use it from P3 (DEC-014) |
| RULE_VIOLATION | 422 | Business rule failed |
| RATE_LIMITED | 429 | Throttled ("Too many requests. Please wait and try again."), with a `Retry-After` header in seconds |
| INTERNAL | 500 | Any unexpected error. The message is always "Something went wrong. Please try again." Stack, SQL and raw messages are never sent; they are logged with the request id |

**Pagination query:** `?page=1&pageSize=20`. Defaults are page 1 and pageSize 20; the maximum pageSize is 100. Values that are not whole numbers, are below 1, or are a pageSize over 100 return VALIDATION_ERROR with `details` naming `page` or `pageSize`.

**Request id:** every response has an `X-Request-Id` header. A client may send its own; it is kept only if it matches `^[A-Za-z0-9_-]{8,64}$`, otherwise a new UUID is used. Quote this id when reporting a problem; the server logs it with every error.

**Security headers:** every response has the helmet defaults (for example `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`) and no `X-Powered-By`. Responses over 1 KB are gzip-compressed when the client sends `Accept-Encoding: gzip`.

**Limits (from config):** JSON body up to `BODY_LIMIT` (default 100kb). Global rate limit of `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` per client address (default 300 per 15 minutes), when `RATE_LIMIT_ENABLED` is true. Responses carry the `RateLimit` and `RateLimit-Policy` headers (IETF draft 8). The client address comes from `X-Forwarded-For` only when `TRUST_PROXY` is above 0.
