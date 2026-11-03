# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 1: Authentication, Roles, Centers and Accounts

| Item | Value |
| --- | --- |
| Goal | Everyone can log in with the right role. Admin manages centers and Teacher accounts. Parents sign up and Teachers approve them |
| Depends on | Phase 0 gate |
| Branch and tag | `phase-1-auth`, tag `v0.1.0` |
| Rules | BR-02, BR-03, BR-04, BR-05, BR-19, BR-21 |

**Build:** centers, users, login and session, role guards, forced password change, Admin center and Teacher management, Parent sign-up, Teacher parent approval, role-based navigation, seed data.

**Do NOT build:** students, reports, calendar, import, assignments, purchase requests, dashboard numbers, email of any kind, "forgot password by email".

**Figma screens to read:** Login, Parent Sign-up, Pending approval message, Change password, Admin: Centers list and form, Admin: Teachers list and form, Teacher: Parent requests and Parents list, role home pages. The home page of each role is only a welcome panel in this phase.

**Data:** `centers`, `users`, `parent_profiles` (4.5). Seed: the Admin from environment variables, the 28 centers (Appendix B), and in development only fake Teachers and Parents.

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /api/auth/login | Public | Username and password; sets cookie; returns user and `mustChangePassword` |
| POST /api/auth/logout | Any | Clears cookie |
| GET /api/auth/me | Any | Current user and center |
| POST /api/auth/change-password | Any | Current and new password; increments token_version |
| POST /api/auth/parent-signup | Public | Creates a PENDING Parent for the chosen center |
| GET /api/public/centers | Public | Active centers for the sign-up dropdown (id and name only) |
| GET, POST, PATCH /api/centers | Admin | List, create, edit; PATCH can deactivate |
| GET, POST, PATCH /api/teachers | Admin | List, create (with temporary password and center), edit, enable or disable |
| POST /api/teachers/:id/reset-password | Admin | Returns a temporary password once |
| GET /api/parents?status= | Teacher | Parents of own center by status |
| POST /api/parents/:id/approve, /decline, /disable, /enable | Teacher | State transitions per 4.9 |
| POST /api/parents/:id/reset-password | Teacher | Temporary password once |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P1-T01 | Shared Zod schemas and enums: roles, user status, login, signup, center, teacher, password policy | shared/src | Imported by both client and server; typecheck passes |
| P1-T02 | Prisma models `centers`, `users`, `parent_profiles` with indexes and unique constraints; migrate | prisma/schema.prisma | Migration applies; case-insensitive unique username verified |
| P1-T03 | Seed: Admin from env, 28 centers, settings; dev-only fake Teachers and Parents behind `NODE_ENV !== production` | prisma/seed.ts | Seed is idempotent (run twice, no duplicates) |
| P1-T04 | Auth service: hash with bcrypt (cost 12), verify, failed-attempt counter, lock for 15 minutes after 5 failures, generic error, status checks (BR-03) | modules/auth | Unit tests: success, wrong password, lockout, pending, declined, disabled |
| P1-T05 | Login, logout, me, change-password endpoints; JWT in httpOnly cookie (8 hours); `token_version` check invalidates old tokens | auth routes and controller | Cookie flags verified in tests; old token rejected after password change |
| P1-T06 | `authenticate` and `requireRole` middleware; `scopeToCenter` helper in `core/scope.ts` | core/middleware, core/scope.ts | Unit tests for all three |
| P1-T07 | Login rate limit per IP and username, separate from the global limit | rateLimit.ts | The sixth attempt in the window returns 429 |
| P1-T08 | Centers module (service, repository, routes): list with search and pagination, create, edit, deactivate (blocked while an active Teacher is assigned) | modules/centers | Duplicate names rejected; deactivation rule enforced |
| P1-T09 | Teachers module: create (center required, one active per center), edit, enable, disable, reset password (temporary password returned once, `must_change_password` set) | modules/users | Rules BR-04 and BR-05 tested; password hash never in a response |
| P1-T10 | Parent sign-up endpoint and public centers endpoint; validation of mobile (PH format) and username | modules/auth | Parent is PENDING; inactive center rejected; duplicate username rejected |
| P1-T11 | Parents module for Teachers: list by status, approve, decline, disable, enable, reset password, all scoped to the Teacher's center | modules/users | A Teacher of center A gets 404 for a Parent of center B |
| P1-T12 | Permission matrix test: a table of every route x role x expected status, run in CI. `GET /api/health` is listed as Public: 200 (or 503 when the database is down) for every role and with no login (DEC-001) | server/test/permissions.test.ts | Fails if any route is added without an entry |
| P1-T13 | Frontend auth: login page, session query (`/me`), route guards, 401 redirect with return path, 403 page, forced change-password flow | features/auth | Unauthenticated users are redirected; `mustChangePassword` blocks everything else |
| P1-T14 | Frontend: Parent sign-up page and "waiting for approval" screen; login messages for pending, declined and disabled | features/auth | Each state shows its own clear message |
| P1-T15 | Frontend Admin: centers list, add and edit form, deactivate; Teachers list, add and edit form, reset password dialog showing the temporary password once with a copy button | features/centers, features/teachers | Matches Figma; all validation messages shown |
| P1-T16 | Frontend Teacher: pending requests with approve and decline, parents list with status filter, disable, reset password | features/parents | Approving moves the row; the Parent can then log in |
| P1-T17 | Role-based navigation and welcome home pages for the three roles | app/layouts | Each role sees only its menu; typed URLs to forbidden pages show 403 |
| P1-T18 | Polish and gate: forms (blur and submit validation, show or hide password, busy buttons), empty states, error states, mobile pass | all | Gate checklist ticked |

**Details.**

- Password policy: at least 8 characters with a letter and a number. Username: 4 to 30 characters of lowercase letters, digits, dot and underscore. Mobile: `09XXXXXXXXX` or `+639XXXXXXXXX`.
- Login failure message is always "Invalid username or password" for unknown user and wrong password alike. Pending, declined, disabled and locked accounts get their own message after correct credentials only.
- Cookie: httpOnly, SameSite Lax, Secure in production, 8 hour expiry, cleared on logout.
- The temporary password is shown once in the UI and is never stored in plain text or logged.
- A Teacher cannot approve the same Parent twice (second call returns the current state). A DECLINED Parent can be re-enabled by the Teacher.
- Admin cannot disable their own account. The last Admin cannot be disabled.

**Edge cases to test:** username in different letter case; center deactivated after a Parent applied; Teacher moved to another center (their old Parents are no longer visible to them); expired cookie during a form submit; two browser tabs with different roles.

**Tests required:** auth service, middleware, permission matrix, center scoping, password change invalidation, throttling, response DTO contains no secrets.

**Gate additions:** all 28 centers present in production; Admin can log in on the live URL; the permission matrix test is part of CI.
