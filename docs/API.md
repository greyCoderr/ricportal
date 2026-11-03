# API

Every endpoint that exists now: method and path, role, request fields, response and error codes.

## Endpoints

### GET /api/health

| Item | Value |
| --- | --- |
| Role | Public, no login (DEC-001). The only public route. The global rate limit applies |
| Added | P0-T08 |
| Request | No body, no query |
| Checks | The database answers `SELECT 1` within 2 seconds (`HEALTH_TIMEOUT_MS`) |
| Headers | `X-Request-Id` (as on every response), `Cache-Control: no-store` (on 200 and 503) |

200 when the database answers:

```json
{ "data": { "status": "ok", "db": "up", "time": "2026-11-03T02:30:00.000Z" }, "meta": {} }
```

`time` is the server time in ISO 8601 UTC.

503 when the database fails or does not answer within 2 seconds:

```json
{ "error": { "code": "SERVICE_UNAVAILABLE", "message": "The service is temporarily unavailable. Please try again.", "details": [] } }
```

The response never contains the database name, host, version, user, URL, uptime or any driver message. The server logs one `warn` line, "health check: database down", with only the driver error code (for example `ECONNREFUSED`) or `timeout`.

Other errors: 429 RATE_LIMITED. Any other method, such as POST, returns 404 NOT_FOUND.

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
| SERVICE_UNAVAILABLE | 503 | The database is down or slow during a health check ("The service is temporarily unavailable. Please try again."). No driver text is sent (DEC-020) |

**Pagination query:** `?page=1&pageSize=20`. Defaults are page 1 and pageSize 20; the maximum pageSize is 100. Values that are not whole numbers, are below 1, or are a pageSize over 100 return VALIDATION_ERROR with `details` naming `page` or `pageSize`.

**Request id:** every response has an `X-Request-Id` header. A client may send its own; it is kept only if it matches `^[A-Za-z0-9_-]{8,64}$`, otherwise a new UUID is used. Quote this id when reporting a problem; the server logs it with every error.

**Security headers:** every response has the helmet defaults (for example `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`) and no `X-Powered-By`. Responses over 1 KB are gzip-compressed when the client sends `Accept-Encoding: gzip`.

**Limits (from config):** JSON body up to `BODY_LIMIT` (default 100kb). Global rate limit of `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` per client address (default 300 per 15 minutes), when `RATE_LIMIT_ENABLED` is true. Responses carry the `RateLimit` and `RateLimit-Policy` headers (IETF draft 8). The client address comes from `X-Forwarded-For` only when `TRUST_PROXY` is above 0.
