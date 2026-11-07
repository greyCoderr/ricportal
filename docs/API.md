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
| GET /api/auth/profile | Any role | Own profile: id, role, username, fullName, mobile, centerId, centerName, status. 403 during a forced password change (D11) |
| PATCH /api/auth/profile | Any role | `fullName` and `mobile` only (Zod `profileUpdateSchema`). A blank mobile clears it, except for a Parent (400) |
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

## Assignments and Purchase Requests (sprint S4)

Money travels as decimal strings, computed on the server with half-up rounding to 2 decimals (BR-11).

| Method and path | Role | Purpose and failures |
| --- | --- | --- |
| GET /api/parents/approved | Teacher | Approved Parents of the own center |
| GET /api/assignments?week= | Teacher | Seven days from the Monday given: menu, assigned Parents, status. 400 if it is not a Monday |
| PUT /api/assignments/:date | Teacher | Body `{ parentIds }`, replaces the set. 422 no menu that day, or a Parent who is not approved or of another center |
| GET /api/parent-schedule?from=&to= | Parent | Assigned days only (BR-14): date, dayName, menuName, status |
| GET /api/purchase-requests/:date | Teacher (own), assigned Parent, Admin (needs centerId) | The PR with items and totals. `status` is NOT_OPENED, OPEN, LOCKED or NO_FEEDING. A Parent response has no `budget`, `enrolledCount`, `ratePerChild` or `isOverBudget` (DEC-026). 404 no menu, or a Parent not assigned |
| POST /api/purchase-requests/:date/open | Teacher | Creates the PR, safe to repeat |
| POST /api/purchase-requests/:date/items | Teacher | Body `{ description }`; opens the PR if needed. 409 when locked |
| POST /api/purchase-requests/:date/lock | Teacher | OPEN to LOCKED; freezes the budget. 409 if not opened or No feeding |
| POST /api/purchase-requests/:date/unlock | Teacher | LOCKED or NO_FEEDING to OPEN; clears the freeze |
| POST /api/purchase-requests/:date/no-feeding | Teacher | OPEN or not opened to NO_FEEDING. 409 when locked |
| PATCH /api/purchase-items/:id | Teacher, assigned Parent | Body has `version`, and any of unit, quantity, unitCost (description for the Teacher only: a Parent gets 403). 409 CONFLICT "Updated by someone else. Your change was not saved." on a stale version, 409 STATE_INVALID when locked, 404 another center or not assigned |
| DELETE /api/purchase-items/:id | Teacher | Renumbers the rest 1 to n. 409 when locked |

## Liquidation and reports (sprint S5)

| Method and path | Role | Purpose and failures |
| --- | --- | --- |
| GET /api/liquidation/preview?from=&to= | Teacher | Days, items, subtotals, total, and `blockingDays` (not LOCKED or NO_FEEDING). At most 62 days |
| POST /api/liquidation/submit | Teacher | Body `{ from, to }`. Creates the report and snapshot in one transaction; after Need Revision the same period becomes a new version. 422 no feeding days, or blocking days listed in `details`; 409 overlap with another report |
| GET /api/liquidation/pdf/purchase-request?date= | Teacher (own), Admin (needs centerId) | One day. 404 no Purchase Request |
| GET /api/liquidation/pdf/summary?from=&to= | Same | Summary of Disbursement |
| GET /api/liquidation/pdf/transmittal?from=&to= | Same | Placeholder page, "layout pending the official copy" (A-09) |
| GET /api/reports | Teacher (own), Admin (all) | Newest first, paginated |
| GET /api/reports/:id | Teacher (own), Admin | Report with its reviews and feedback |
| GET /api/reports/:id/snapshot | Teacher (own), Admin | What was submitted, latest version. Never changes with later edits |
| POST /api/reports/:id/review | Admin | `{ decision, feedback }`: APPROVED, or NEED_REVISION with required feedback, which unlocks the days. 409 when not SUBMITTED; APPROVED is final |
| GET /api/reports/:id/pdf/summary, /transmittal, /purchase-request?date= | Teacher (own), Admin | Built from the snapshot (P6-T08) |

`POST /api/purchase-requests/:date/unlock` answers 409 for a day that is part of a submitted report.

## Demo polish: week assignment and Parent rows (F2)

| Endpoint | Role | Notes |
| --- | --- | --- |
| GET /api/assignments/week?week=YYYY-MM-DD | Teacher | The week is its Monday (400 otherwise). Returns `{ week, team: [{ id, fullName, username }], days: [{ date, dayName, menuName, status, parents }] }`, seven days |
| PUT /api/assignments/week | Teacher | Body `{ week, teamParentIds, days: [{ date, parentIds }] }` (`weekSaveSchema`). Replaces the team and all days of the week in one transaction. 422: over 4 team members, a duplicate, a parent not approved or of another center, a day parent outside the team, a date outside Monday to Sunday, a date with no menu, a date listed twice |
| PUT /api/assignments/:date | Teacher | Unchanged body. Now also 422 when it would take the week's team past 4; adds a new parent to the team |
| GET /api/parent-schedule?from&to | Parent | Now every menu of the range for the Parent's center: `{ date, dayName, menuName, assigned, status, parents: [{ id, fullName }] }`. `status` is null unless assigned. 400 over 62 days or backwards |
| POST /api/purchase-requests/:date/items | Teacher, assigned Parent | A Parent on any other day gets 404; locked or No feeding 409. Keeps `created_by`. Opens a day that was not opened |
| PATCH /api/purchase-items/:id | Teacher, assigned Parent | A Parent may now change the description as well |
| DELETE /api/purchase-items/:id | Teacher, assigned Parent | A Parent only rows they created (403 otherwise); another day 404; locked 409 |
| Every purchase item | | Now carries `canDelete`, computed for the reader |
| GET /api/parents/approved | Teacher | Now also returns `username` |

## Demo polish: students (F3)

| Endpoint | Change |
| --- | --- |
| POST /api/students, PATCH /api/students/:id | Optional `profileExtra` (`profileExtraSchema`). 400 on wrong types, unknown keys, too many rows, or over 6000 characters. A PATCH without it keeps the stored value |
| GET /api/students, GET /api/students/:id | Every student now carries `profileExtra` (null when there is none). Dates stay YYYY-MM-DD; screens and PDFs show MM/DD/YYYY (D7) |

## Demo polish: Admin and passwords (F4)

| Endpoint | Role | Notes |
| --- | --- | --- |
| GET /api/dashboard/summary | Admin | `{ activeTeachers, disabledTeachers, centersWithTeacher, enrolledStudents, reports: { submitted, needRevision, approved } }`. Grouped queries. Archived students and students of earlier years are left out |
| POST /api/teachers | Admin | Optional `password`; blank or missing means DEFAULT_PASSWORD. A change is forced at next login. The answer no longer holds any password |
| POST /api/teachers/:id/reset-password | Admin | Teachers only (anyone else 404). Sets DEFAULT_PASSWORD, forces a change, ends sessions, clears a lockout. Answers only `{ message }` |
| POST /api/parents/:id/reset-password | Teacher | Parents of the own center only (others 404). Same as above |
| GET /api/teachers | Admin | Now also `q` (name or username), `status` (ACTIVE, DISABLED), `centerId` |
| GET /api/reports | Admin, Teacher | Now also `status`. A Teacher still sees only the own center |


## Demo polish: Teacher pages (F5)

| Endpoint | Role | Notes |
| --- | --- | --- |
| GET /api/reports/feedback | Teacher | Feedback on the own center's returned reports, newest first, paginated: `{ id, reportId, periodStart, periodEnd, versionNo, feedback, reviewedAt, reportStatus }`. The center comes from the login |

## Polish Round 2: Admin (G2)

| Endpoint | Role | Change |
| --- | --- | --- |
| GET /api/dashboard/summary | Admin | New `submittedByType: { enrollment, accomplishment }`: reports with status SUBMITTED, by type. Both are 0 until Objective 3 |
| GET /api/teachers/:id | Admin | New. The TeacherDto plus `email`, `address`, `position`, `sex`, `birthDate`, `qualification`, `createdAt`. No secrets. 400 bad id, 401, 403 other roles, 404 unknown id or not a Teacher. An Admin works across centers, so no center scope applies |
| GET /api/auth/profile | Every role | Also `email`, `address`, `position`, `sex`, `birthDate`, `qualification`, `createdAt`, `lastLoginAt` |
| PATCH /api/auth/profile | Every role | Also accepts those six editable fields. Left out keeps the stored value; `""` or `null` clears it. 400 for a bad email, a too-long text, a sex other than Female or Male, or a birth date that is invalid or in the future |
