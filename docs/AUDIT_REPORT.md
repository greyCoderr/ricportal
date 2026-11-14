# RICPortal Code Audit (Plan 5, stage J1a)

Date: Sat 2026-11-14. Branch demo-polish-5 at af84a68. Read-only audit of `server/src`, `shared/src`,
`server/prisma/schema.prisma`, the db tests and a sample of `client/src`, against
docs/blueprint/03-blueprint.md, docs/phases/*.md, docs/SPRINT_SHORTCUTS.md and docs/DECISIONS.md.

## 1. Result in short

- Critical: 0. High: 3 (AUD-001 to AUD-003, fixed in J1b). Medium: 19. Low: 20.
- No way was found for one role or center to read or change another center's data by id, and no PATCH
  accepts a field it should not (section 3).
- Nothing in the code handles concurrent requests on purpose, and no test sends two requests at once.
  All three high findings and most of the medium ones come from that.
- Not everything could be audited by reading. Section 5 lists what was only sampled or not checked.

Severity: critical = another user's data or an account can be reached now; high = a business rule or
security control fails in normal use or with two simple requests; medium = wrong result or a 500 that
needs unusual timing, an unusual file, or a deployment mistake; low = small, cosmetic, or documentation.

Size: S = under 1 hour, M = 1 to 4 hours, L = more than 4 hours.

## 2. Findings

### High

| Id | Area | Evidence | Why it matters | Proposed fix | Size |
| --- | --- | --- | --- | --- | --- |
| AUD-001 | Login lockout (BR-19) | `auth.service.ts:235-247` reads `failedLoginCount`, checks the password, then writes `count + 1` with `auth.repository.ts:92-98` | Wrong passwords sent at the same moment all read the same count and all write the same number, so 20 parallel guesses count as 1 failure. The 5-failure lock can be passed many times over. Reproduce: 10 parallel wrong logins for one user, then the right password: it logs in instead of 429 | Take a slot before checking the password, in one conditional UPDATE (`failed_login_count < 5`, not locked, increment). A request that gets no slot answers 429 | M |
| AUD-002 | Forced password change (BR-05) | `auth.service.ts:433-459` never compares the new password with the current one or with `DEFAULT_PASSWORD`; `shared/src/accounts.ts:75-84` | After a reset, a user can "change" the default password to the same default password. The forced change is cleared and the account stays on a password that every Teacher and many Parents know. Reproduce: reset a Parent, log in, POST change-password with new = current: 200 | Refuse a new password equal to the current one or to the default password, with a field message | S |
| AUD-003 | Purchase rows (BR-11, BR-12) | `purchase-requests.repository.ts:96-110` numbers a new row `count + 1` with no lock and there is no unique (request, item_no); `:33-53` upsert is not atomic on MySQL; `purchase-requests.service.ts:227-239` and `:311-319` check OPEN, then write in a second step | Two people adding a row at once (a team has up to 4 Parents plus the Teacher) get the same item number, which prints twice on the official Purchase Request, or one of them gets a 500 on a day not opened yet. A row can also be added or deleted just after the Teacher locked the day. Reproduce: two parallel POST `/api/purchase-requests/:date/items` | Lock the request row inside the transaction with a conditional update that also checks OPEN, then number the row; read the request again when the upsert loses the race | M |

### Medium

| Id | Area | Evidence | Why it matters | Proposed fix | Size |
| --- | --- | --- | --- | --- | --- |
| AUD-004 | Lock, unlock, no-feeding, submit | `purchase-requests.repository.ts:55-93` update by id with no condition; `purchase-requests.service.ts:353-369` checks `submittedReportId` before, not in, the update; `liquidation.repository.ts:101-104` marks days by id without checking they are still LOCKED | Unlock sent at the same moment as Submit can leave a day OPEN and editable inside a submitted (later approved) report. The snapshot and its PDFs stay correct; the live day no longer matches them | Make each transition one conditional `updateMany` (expected status and `submittedReportId: null`); in submit, mark only days that are still LOCKED or NO_FEEDING and compare the count | M |
| AUD-005 | Week assignment PUT | `assignments.repository.ts:38-75` deletes then inserts in one transaction | A double click or two tabs saving the same week: one request can fail with a unique or deadlock error and answers 500. Data stays consistent (the transaction rolls back) | Map Prisma P2002 and P2034 to 409 CONFLICT in the error handler ("just saved, refresh"), for every route | S |
| AUD-006 | Unique races elsewhere | `auth.service.ts:471-483`, `users.service.ts:141-157`, `students.service.ts:224-253`, `centers.service.ts:27-30` check, then insert | A double click on sign-up, Add Teacher, Add Student or Add Center answers 500 for the second request instead of 409. A-02 (one active Teacher per center) is checked only in code, so two parallel requests can create two | Same mapping as AUD-005; for A-02 lock the center row in the transaction | S |
| AUD-007 | Menu import confirm | `parser.ts:36`, `:220-228` do not limit lengths; schema: `menu_name` 200, `pr_no` 30, `sheet_name` 100, `day_name` 20, `file_name` 255; `dayNo` may be a fraction | A file with a long menu cell, a long sheet name or a day number like 1.5 passes the preview and then fails on confirm with 500, and the preview token is already used | Validate lengths and whole day numbers in the parser and report them as preview errors | S |
| AUD-008 | Liquidation submit errors | `liquidation.service.ts:203-229` `catch {}` | Any failure in the submit transaction (database down, timeout) is answered as 409 "This period was just submitted" and nothing is logged | Throw a typed error from the repository for the two known cases and let everything else reach the error handler | S |
| AUD-009 | Secrets when NODE_ENV is not set | `env.ts:39`, `:69-73`, `:144-152` | NODE_ENV defaults to development, and development falls back to a JWT secret, Admin password and default password that are written in the repository. A hosted copy started without NODE_ENV=production would accept forged Admin sessions. Not reachable today (no deployment) | Before deployment: refuse to start when a fallback secret is used and the host is not local, or require NODE_ENV to be set. Add to docs/DEPLOY.md | S |
| AUD-010 | Login limit by IP (BR-19, P1-T07) | `auth.routes.ts:12`, `rate-limit.ts` (one global limiter only) | BR-19 and P1-T07 describe a login rate limiter per IP and username. Only the per-username lock exists. One IP can try one password on every username at the global rate (300 in 15 minutes) without any lock | Planned in J4 (a): a stricter limiter on login (and sign-up) | S |
| AUD-011 | Default password (D6, DEC-037) | `users.service.ts:77-84`, `:152-155` | By decision, every reset or blank new account gets the same default password. Until the user logs in, anyone who knows the default and the username can take the account. Listed so the client accepts it knowingly | Client decision. Options: a random one-time password shown once to the approver, or an expiry on the default | M |
| AUD-012 | Logout | `auth.controller.ts:38-46` clears the cookie only | A session token copied before logout keeps working until it expires (up to 8 hours). Phase 1 asks only for "clears cookie", so this is a hardening item | Increment `token_version` on logout | S |
| AUD-013 | Optional fields cannot be cleared | `students.service.ts:262-279` (`?? row.x`), `shared/src/students.ts:27-28` (blank becomes undefined), `child-records.service.ts:62-70`, `centers.service.ts:55-59`, `users.service.ts:176-180` | A middle name, religion, ethnicity, conference time, home visit remarks, a center's barangay or address, or a Teacher's mobile cannot be emptied once set: a blank is read as "no change" | Accept null (or blank) as "clear" in the PATCH schemas, as the profile form already does | M |
| AUD-014 | Child's Record on past years | `child-records.service.ts:128-157` uses `loadForRead`; `students.service.ts:134-143` blocks student edits for earlier school years | Entries can still be added, edited and deleted for a child of an earlier school year, although that year is read-only | Use `loadForWrite` for create, and check the school year for edit and delete | S |
| AUD-015 | Transaction time limits | Every `prisma.$transaction(async ...)` uses the defaults (2 s to get a connection, 5 s to finish) | On a slow database (this laptop under memory pressure, or TiDB Cloud waking up) a transaction fails with 500. This is the most likely cause of the intermittent 404 (section 4) | Set `maxWait` and `timeout` once in `core/db.ts`; map the timeout to 503 | S |
| AUD-016 | Rate limit and proxy | `pipeline.ts:27-29` (all paths), `env.ts:51` (TRUST_PROXY 0) | The global limit counts static files (known, J4 a). Behind a proxy with TRUST_PROXY 0 every user shares one IP and one limit; set too high, the header can be forged | J4 (a); document the TRUST_PROXY value for Hostinger in docs/DEPLOY.md | S |
| AUD-017 | PDF text outside Latin-1 | `pdf.ts:7-14` (built-in Helvetica), `shared/src/students.ts:10` allows any letter, descriptions allow any character | Names or ingredients with characters outside the built-in font (other scripts, emoji, the peso sign) print wrong or blank on official forms. Not run in this audit | Embed a Unicode font (also solves the peso sign), or limit the allowed characters | M |
| AUD-018 | Lists without pages (4.4) | `child-records.repository.ts:26-31`, `:71-76`, `:122-127`; `students.repository.ts:105-114`; `auth.repository.ts:197-207`; `users.repository.ts:188-194` | The blueprint says every list is paged. Notes of up to 5000 characters are returned in full for a child; the Admin summary loads every student row of the year to count ages | Page the three entry lists; count ages in SQL or select only birthdate and gender | M |
| AUD-019 | Personal data in error logs (BR-21) | `error-handler.ts:49-58` logs the whole error; the redaction in `logger.ts:11-24` covers passwords and cookies only | A Prisma validation error prints the arguments of the failed call, which can hold a child's name or birthdate. Only on unexpected errors | Log the error name, code and stack, not the message of Prisma validation errors | S |
| AUD-020 | Missing tests | No db test uses `Promise.all`; phase-5 and phase-6 edge cases "locking while a Parent's request is in flight" and "concurrent Submit by two browser tabs" have no test; no test cites BR-05, BR-08, BR-09, BR-17 or BR-21 by id (BR-06 and BR-20 are Objective 3) | The races above were not caught. J1b adds the first three concurrent tests | Add concurrent tests for AUD-004 and AUD-005, and tag the existing password, date, PDF and log tests with their rule ids | M |
| AUD-021 | Teacher moved to another center | `auth.repository.ts:167-207` filters by `teacherId` only | After the Admin moves a Teacher, the Teacher Profile still counts and lists the reports of the old center (ids, dates, status). Phase 1 says old center data is no longer visible | Filter by the current center as well | S |
| AUD-022 | Database clock for defaults | `schema.prisma` `@default(now())`; `adapter-mariadb` writes UTC strings | If a row is inserted without Prisma filling the time (raw SQL, some seeds), MariaDB's local time (+08:00) is stored and read back as UTC, 8 hours ahead. Not confirmed in this audit; TiDB Cloud runs in UTC | Check once with a test; if confirmed set the session time zone to UTC on connect | S |

### Low

| Id | Area | Evidence | Why it matters | Proposed fix | Size |
| --- | --- | --- | --- | --- | --- |
| AUD-023 | Unknown-username throttle | `auth.service.ts:115-148` | Kept in memory and emptied at 10,000 names or on restart, so it can be reset by flooding names | Accept, or move to the login limiter of J4 | S |
| AUD-024 | Lockout as denial of service | BR-19 by design | Anyone can keep any account, the Admin included, locked with 5 wrong tries every 15 minutes | Accept and tell the client; the IP limiter (AUD-010) reduces it | S |
| AUD-025 | Username existence | `auth.service.ts:471-475` | Sign-up answers "This username is already taken", which shows that a username exists. Normal for sign-up forms | Accept | S |
| AUD-026 | Profile PATCH mobile | `auth.service.ts:424-427` | Leaving `mobile` out clears it for the Admin and Teachers, the opposite of the other fields | Keep the stored value when left out | S |
| AUD-027 | Lock with nothing to buy | `purchase-requests.service.ts:322-351` | An opened day with no rows, or rows without quantity or cost, can be locked and submitted with PHP 0.00 | Ask the client; maybe warn before locking | S |
| AUD-028 | Repeated review | `liquidation.service.ts:342-344` vs blueprint 4.8 | A repeated Approve answers 409, where 4.8 says a repeated approve returns the current state | Return the current state when the decision is the same | S |
| AUD-029 | Layering by the letter | `core/money.ts:1` imports Prisma for Decimal; `purchase-requests.service.ts:253`, `:297` compare `centerId` by hand instead of `assertCenterAccess`; `users.controller.ts:16-18`, `centers.controller.ts:13` validate a query without a shared schema | Small departures from 4.4 | Tidy up when the files are next touched | S |
| AUD-030 | Duplicate and unused code | `findCenter`, `findActiveTeacherName`, `usernameExists` and the student count exist in 2 to 4 repositories; the line-total rule is in `builder.ts:37-40` and `purchase-requests.service.ts:42-46`; `generateTemporaryPassword` (`password.ts:15-28`) and `@fullcalendar/list` are unused | Maintenance cost | Remove the unused ones; share the rest | S |
| AUD-031 | Many small queries | `purchase-requests.repository.ts:149-154` updates each remaining row on delete; `liquidation.service.ts:86-93` reads four settings one by one | Slow only with many rows | One query for settings; leave the renumbering | S |
| AUD-032 | Menu preview in memory | `menu.service.ts:41-49`, DEC-036 | A preview is lost on restart or with more than one server process ("preview expired") | Accept (documented), or store previews in the database | M |
| AUD-033 | Large Excel file | `menu.routes.ts:8-11` (5 MB), `parser.ts:279-283` | A small file can expand to a very large workbook in memory. Admin only | Check the unzipped size before parsing | M |
| AUD-034 | PDF queue | `pdf.ts:19-40` | The queue has no length limit or time limit | Reject when more than about 20 wait | S |
| AUD-035 | No `no-store` on data | Only `auth.controller.ts:49-73` and health set it | Children's data and PDFs may stay in a shared computer's cache | Set `Cache-Control: no-store` on `/api` | S |
| AUD-036 | Page titles and skip link | `client/index.html:6`; no `document.title` in `client/src` | Every page is titled "RICPortal", and there is no "skip to content" link (WCAG 2.4.2, 2.4.1) | Set the title per route; add a skip link in the shell | S |
| AUD-037 | docs/API.md | 15 of 79 routes are missing (the entry PATCH and DELETE routes, the three entry lists, `GET /api/centers`, decline, disable, enable, restore, two report PDFs); line 83 still says "temporary password returned once"; line 11 calls health "the only public route" | The document cannot be trusted | Planned in J5 | M |
| AUD-038 | Blueprint and CLAUDE.md | 4.3 says bcrypt and file-type (code: bcryptjs, no file-type); 4.5 `reports` unique (center, type, year, month) and `report_versions` (schema: period dates, no unique, no table); BR-19 login limiter (AUD-010); CLAUDE.md says "Phase: 0" and React Hook Form (DEC-030) | Documents and code disagree | Planned in J5 | S |
| AUD-039 | Dependencies | `npm audit` on 2026-11-14: 11 moderate, 0 high, 0 critical. Two roots: `uuid` through exceljs 4.4.0 (runtime, the Admin's Excel import only; BACKLOG, J4 g) and `minimatch` through eslint and typescript-eslint (development tools only; eslint 10.15.0 fixes part without a major change). Licences of the 51 direct packages: MIT 45, Apache-2.0 4, BSD-3-Clause 1, OFL-1.1 1 (the Montserrat font). Installed below them: `mariadb` LGPL-2.1-or-later (the database driver, used unchanged), `lightningcss` MPL-2.0 (build tool), `elkjs` EPL-2.0, and `busboy`, `streamsearch`, `buffers`, `png-js` with no licence field in package.json | No advisory is reachable by a Teacher or Parent. The LGPL driver is used as an unchanged library, which the licence allows; say so in the final documentation | J4 (g); update eslint; read the four licence files that have no field | S |
| AUD-040 | Settings values | `purchase-requests.service.ts:146-161`, `settings.repository.ts` | A rate that is not a number in the settings table gives 500 on every day view | Validate on read; J3 (b) adds the screen | S |
| AUD-041 | Disabled Parents in teams | `assignments.repository.ts:13-35` | A Parent disabled after being assigned still shows on the day and in the team | Hide or mark them | S |
| AUD-042 | Sign-up flood | `auth.routes.ts:13` | Sign-up is public and limited only by the global limit, so a Teacher's Parent Requests list can be filled | J4 (a) limiter on sign-up | S |

## 3. Checked and found in order

1. Routes: all 79 routes are in the matrix test, which fails when a route is added without a row
   (`permissions.db.test.ts:150-166`). Each has authenticate and requireRole in its route line, except the
   four public ones and the three session routes (logout, me, change-password), which is as designed.
2. Access by id across centers: students and their entries (`students.service.ts:124-131`,
   `child-records.service.ts:80-89`), purchase days (center from the session), purchase rows
   (`purchase-requests.service.ts:253`, `:297`), reports, snapshots and report PDFs
   (`liquidation.service.ts:141-148`), live PDFs and the Enrollment Form (`scopeToCenter`), Parents
   (`users.repository.ts:196-201`), feedback (`ownCenterId`), profiles (own row only). A Parent's day that
   is not assigned answers 404 and never carries the budget.
3. Mass assignment: every PATCH is parsed with a Zod object (unknown keys are dropped) and then copied
   field by field. Role, username, center, status, token_version and created_by cannot be set by the user.
4. Passwords: bcryptjs, cost 12 outside tests; unknown usernames do the same hashing work; no password or
   hash is returned or logged; reset ends sessions and clears the lock; cookie httpOnly, SameSite Lax,
   Secure from config and required in production. No state-changing GET exists, so SameSite Lax covers
   cross-site requests. `X-Forwarded-For` is ignored unless TRUST_PROXY is set.
5. Purchase row PATCH: the version check and the OPEN check are in one UPDATE
   (`purchase-requests.repository.ts:130-139`), so two editors and lock-versus-edit are safe there.
   Submit: report, snapshot and day marks are one transaction; a second submit of the same days rolls
   back to 409. Resubmit and review move the status with a conditional update. Import confirm: the token
   is used once and the unique date makes a late overlap fail as 409.
6. Money and dates: money is Decimal end to end, rounded half-up to 2 places once per line
   (`core/money.ts`); the API carries strings. Calendar days are strings; the only Date conversions are
   `core/dates.ts` at UTC midnight, and the adapter writes and reads dates in UTC, so no time zone can move
   a day. "Today" and the month of the login count use Asia/Manila. 29 February is tested.
7. Upload (menu file only): memory storage, 5 MB, one file, `.xlsx` and ZIP signature both required,
   library messages never reach the client.
8. PDF: all text is passed as pdfmake text nodes, so no markup or script can be injected; two PDFs at a
   time; ranges are at most 62 days; file names are fixed.
9. Accessibility sample: dialogs are native `<dialog>` with a labelled title; icon buttons take a label;
   all 19 images have `alt`; no click handlers on div, span or table rows; 10 live regions, the autosave
   state included; calendar events are keyboard reachable (`eventInteractive`); focus-visible styles exist.

## 4. The intermittent 404 in "a Parent adds a row"

What is certain: in that test both Parent logins succeeded (a failed login throws), so the users existed.
`POST /api/purchase-requests/:date/items` answers 404 for a Parent in two cases only: the Parent is not
assigned to the day (`purchase-requests.service.ts:220-225`) or the date has no menu (`:226`). The menu
days are inserted directly and would throw on failure. So the assignment was missing, and the only thing
that creates it is the week save in that group's `beforeEach`, whose answer was not checked at the time.

What can make that save fail once in 519 tests: its inputs are fixed (422 and 401 are ruled out), dates
are written in UTC (ruled out), and the rate limiter is off in tests. What remains is a 500 from the save's
transaction. It is an interactive transaction with Prisma's default limits (AUD-015). The failing run was
the first run after the system had stopped the previous run for low memory, on one worker, with the
database on the same laptop. A wait of more than 2 seconds for a connection or 5 seconds for the four
statements is enough.

This is the most likely cause, not a proven one: it was not reproduced (8 clean runs on 2026-11-07, and
the J1b runs of this file). It cannot pass silently again, because the setup now asserts the save and
prints its body. A production request cannot hit the same 404: the application returns 500 for the
failed save and the page shows the error. AUD-015 removes the tight limits.

## 5. Not verified in this audit

- The client was sampled with searches (section 3, item 9), not read file by file. No screen reader,
  contrast or keyboard walk-through was done. J2 visits every page.
- Licences were read from each package.json `license` field only, not from the licence files, and only
  for the packages installed on this machine (Windows builds).
- AUD-017 (PDF characters) and AUD-022 (database clock) come from reading; neither was run.
- Behaviour on TiDB Cloud was not tested (DEC-016). The AUD-003 fix uses row locks that MariaDB and TiDB
  both support, but it ran only on the local MariaDB.
- `server/prisma/*.ts` seed scripts, `client` tests and the Figma fidelity were not part of this audit.
- Report file uploads (BR-06, BR-20) do not exist yet; their design is in docs/OBJ3_PLAN.md.
