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

## Notes for planned endpoints (not built yet)

- `POST /api/auth/login` (Phase 1, DEC-026): while an account is locked, every attempt returns 429 RATE_LIMITED with "Too many attempts. Try again in 15 minutes." and a `Retry-After` header (remaining seconds), right or wrong password. The login rate limiter returns the same status, message and header, also for unknown usernames. Pending, declined and disabled messages only after correct credentials.
- `GET /api/purchase-requests/:date` (Phase 5, DEC-026): the Parent response leaves out `budget`, `enrolledCount` and `ratePerChild`. Teacher and Admin responses include them.

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

## Auth, centers and accounts (sprint S1)

Session: httpOnly cookie `rp_session` (HS256, 8 hours, SameSite=Lax, Secure from `COOKIE_SECURE`). `token_version` ends old sessions after a password change or reset. A user with `mustChangePassword` gets 403 on every route that has a role guard until the password is changed.

| Method and path | Role | Purpose and failures |
| --- | --- | --- |
| POST /api/auth/login | Public | 200 with the user. 401 "Invalid username or password" (wrong password and unknown user alike). 403 with the status message for PENDING, DECLINED or DISABLED, after correct credentials only. 429 "Too many attempts. Try again in 15 minutes." with `Retry-After` in seconds: every attempt while locked, right or wrong password, and the same for unknown usernames (BR-19, DEC-026) |
| POST /api/auth/parent-signup | Public | 201 `{ centerName }`, creates a PENDING Parent. 409 duplicate username, 422 inactive center |
| GET /api/public/centers | Public | Active centers: id and name only |
| POST /api/auth/logout | Any | Clears the cookie |
| GET /api/auth/me | Any | Current user and center |
| POST /api/auth/change-password | Any | Current and new password; increments `token_version` and sets a fresh cookie |
| GET, POST /api/centers; PATCH /api/centers/:id | Admin | List (`q`, pagination), create, edit, `isActive`. 409 duplicate name, 422 deactivating a center with an active Teacher |
| GET, POST /api/teachers; PATCH /api/teachers/:id | Admin | List, create (temporary password returned once), edit, enable or disable. 409 second active Teacher in a center (BR-04), 422 inactive center |
| POST /api/teachers/:id/reset-password | Admin | Temporary password returned once; ends old sessions |
| GET /api/parents?status= | Teacher | Parents of the own center |
| POST /api/parents/:id/approve, /decline, /disable, /enable | Teacher | Status machine (blueprint 4.9). A repeat returns the current state; an invalid move is 409; a Parent of another center is 404 |
| POST /api/parents/:id/reset-password | Teacher | Temporary password returned once |

No response contains a password hash, `token_version`, the failed-login count or the lock time.

## Students and Child's Record (sprint S2)

| Method and path | Role | Purpose and failures |
| --- | --- | --- |
| GET /api/students | Teacher (own), Admin (any) | Filters: schoolYear (default current), q, gender, status, centerId, pagination. A Teacher asking for another center gets 404 |
| GET /api/students/summary | Teacher, Admin | Counts by age bucket (2, 3, 4, Other) and gender. Active children only. schoolYear, centerId |
| POST /api/students | Teacher | Create in the current school year. 400 field errors (future date, older than 10), 409 same name and birthdate in the center and year |
| GET /api/students/:id | Teacher (own), Admin | One student with the computed age and `ageWarning` |
| PATCH /api/students/:id | Teacher | Edit. 409 duplicate, 422 a row of an earlier school year |
| POST /api/students/:id/archive, /restore | Teacher | Status change. 422 for an earlier school year |
| GET, POST /api/students/:id/conferences | GET: Teacher (own), Admin. POST: Teacher | Newest first |
| GET, POST /api/students/:id/home-visits | Same | Newest first |
| GET, POST /api/students/:id/progress | Same | Newest first. No screen in the sprint |
| PATCH, DELETE /api/conferences/:id, /api/home-visits/:id, /api/progress/:id | Teacher | Edit and soft delete (BR-22). Another center or a deleted entry is 404 |
| GET /api/enrollment-form.pdf | Teacher (own), Admin (needs centerId) | Query: schoolYear, dateStarted, centerId. Streams a PDF |

Weight and height travel as decimal strings. Age is computed on every read and never stored (BR-01).

## Menu import and calendar (sprint S3)

| Method and path | Role | Purpose and failures |
| --- | --- | --- |
| POST /api/menu/imports/preview | Admin | Multipart field `file`: .xlsx with the ZIP signature, at most 5 MB. Returns `{ token, fileName, batches, warnings, errors, overlaps }`; nothing is saved. `token` is null when there are errors or overlapping dates. 400 wrong type or no file, 413 too large, 422 not a readable workbook |
| POST /api/menu/imports/confirm | Admin | Body `{ token }`. Saves all batches in one transaction. 409 used, expired or unknown token, or an overlap that appeared after the preview |
| GET /api/menu/batches | Admin | Import history, paginated |
| GET /api/calendar?from=&to= | Admin, Teacher | Feeding days in the range (at most 62 days): date, dayNo, dayName, menuName, prNo, prDate. A Parent gets 403 |
