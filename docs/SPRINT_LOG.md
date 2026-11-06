# Demo Sprint Log

Plan: docs/SPRINT_PLAN.md. Branch: demo-sprint. Newest stage at the bottom. Started Fri 2026-11-06.

## Blocker check (start)

XAMPP MySQL reachable on 3306. Fixture present as `server/test/fixtures/SF MENU for 30 days.xlsx` (the plan's name has underscores; handled in S3). Branch demo-sprint is checked out. `.claude/settings.json` has an uncommitted change that is not part of this work and is left alone.

## S0 Foundation minimum (budget 2 h)

Plan:
1. Lint script with a 4 GB heap through the eslint binary, cross-platform.
2. UI kit: Modal, Drawer, ConfirmDialog on native dialog (Escape through cancel), Table, Pagination. jsdom tests only for state and aria; real-browser focus goes to the manual list.
3. showModal stub in client/test/setup.ts.
4. More Lucide icons for navigation and actions, pinned to 1.70.0 by the existing test.
5. Shared roles enum. Role-aware nav config.
6. AppShell (sidebar and top bar) for Admin and Teacher, top bar layout for Parent, 403 and 404 pages.
7. Express serves client/dist with SPA fallback /{*splat} for non-/api paths; test it.
8. Root start script; build and start on one port.
9. npm run check, commit.
10. CUT if late: Pagination polish, Drawer animation.

Summary (S0):
- Done: lint with a 4 GB heap; Modal, Drawer, ConfirmDialog (native dialog, Escape through cancel), Table, Pagination; 16 more Lucide icons pinned to 1.70.0; shared roles; role nav, AppShell, ParentLayout, 403 and 404 pages; Express serves client/dist with /{*splat}; root `start` script. Smoke test on one port: / and /students 200 HTML, /api/health 200 JSON, /api/nope 404 JSON.
- Cut: none.
- Fixed: `server/src/core/logger.test.ts` failed by chance when a timestamp contained "555". The same secret check now runs on the logged fields, leaving out time, pid and hostname.
- Verify: `npm run build && npm start`, open http://localhost:3000. Focus trap and return in dialogs need a real browser (manual list in docs/DEMO_SCRIPT.md, S6).
- Known issues: layouts are wired to the router in S1.

S0 committed: 444b457. Check: 35 files, 412 tests, build ok.

## S1 Authentication, centers, accounts (budget 4 h)

Plan:
1. Packages: bcryptjs 3.0.3, jose 6.2.13 (server); zod 4.6.7 in shared (same version as the server).
2. Data: centers, users, parent_profiles; migration; seed 28 centers and the Admin.
3. env.ts: JWT_SECRET, COOKIE_SECURE, SESSION_HOURS, ADMIN_USERNAME, ADMIN_PASSWORD, BCRYPT_COST: dev and test defaults, production must set them.
4. Tests first: password, token, login rules, lockout, status messages, identical 429s, matrix, scoping, no hash in responses.
5. Core: authenticate, requireRole, scope, validate; Retry-After in the error handler.
6. Modules: auth, public centers, centers, teachers, parents. API mounts listed in one place so the matrix test fails on an unlisted route.
7. Client: useZodForm, session query, guards, 401 redirect with return path, forced change-password.
8. Screens: Login (Figma 241:1732), sign-up, Request sent, change password, Centers, Teachers, Parent requests, homes.
9. npm run check, commit.
10. CUT if late: parent disable and reset UI, Admin center rename UI.

S1 status (in progress, not committed):
- Done and passing: S1 API. DB tests auth, accounts and permission matrix: 3 files, 115 tests; unit tests env, token, scope: 3 files, 37 tests. They were seen failing (404) before the routers were mounted. Migration 20261106120950_auth_centers_users applied to the dev database; seed gives 28 centers and the Admin.
- Written, NOT yet run: S1 client (use-zod-form, guards, Login, Sign-up, Request sent, Change password, Centers, Teachers, Parent Requests, Home, router) and its tests. `tsc -b` result for them is unknown.
- Stopped: the run of `tsc -b` plus the client tests was stopped by the system because memory was critically low. Not a code failure.
- Next on resume: run `npx tsc -b`, then `npx vitest run --project client client/src/lib/use-zod-form client/src/features/auth`, then `npm run check`, then commit "feat(sprint): S1 auth, centers, accounts". Then S2.

Resume note (2026-11-06): the system stopped a run for low memory. Developer set memory rules (DEC-035): 2 test workers, one foreground command at a time, targeted checks, full check only at the end of S2, S4 and S6. CUT lists of S2 to S5 apply from the start (docs/SPRINT_SHORTCUTS.md). Demo path step 10 is now an API-only check.

Summary (S1):
- Done: login, logout, me, change password, sign-up, public centers, centers, teachers, parents; lockout with identical 429s; permission matrix over every route; Login, Sign-up, Request sent, forced change password, Centers, Teachers, Parent Requests, Home, route guards, 401 redirect with return path.
- Commits: 0ed8f36 (API); the client commit follows this entry.
- Checks at the client commit: tsc -b clean; client tests for form, auth and layouts 3 files, 23 tests; eslint on changed files clean. No full npm run check since S0 (next at the end of S2, DEC-035).
- Not checked: the screens have not been opened in a real browser yet.
- How to verify: `npm run db:seed`, `npm run dev`, then log in as admin / Admin2026!, add a RIC Teacher for Sibujo, log in with the temporary password, change it, sign up as a Parent, approve, log in as the Parent.

## S2 Students (budget 4 h)

Plan (CUT list applied from the start: no Progress tab UI, no previous school year view, no Admin by-center screen; their APIs stay):
1. Shared: dates (computeAge, ageBucket, manilaToday) and student and Child's Record schemas.
2. Tests first: age vectors, summary with 18 children, duplicate rule, scoping, Admin read-only, soft delete, PDF pages.
3. Data: students, conference_notes, home_visits, child_progress; migration.
4. modules/settings (current school year), modules/students, modules/child-records.
5. modules/pdf: pdfmake with built-in fonts, concurrency limit 2; Enrollment Form.
6. Matrix entries for every new route.
7. UI: student list, add and edit form with age preview, profile with tabs Profile, Conferences, Home visits, Enrollment Form dialog.
8. Targeted checks during work; full npm run check at the end (DEC-035).
9. Commit. Log.
10. Figma: labels from saved metadata for 78:260 and 258:5447, no new reads so far.

Test note (S2): the student and PDF tests were seen failing first (21 database tests failed, the PDF test file could not load). The age tests in shared/test/dates.test.ts were written together with the helper in one step and were not seen failing first.
PDF check: a sample with 18 children was rendered and read by eye: 30 rows with blanks, summary with an Other row, signature lines, and the letters n-tilde, e-acute and an apostrophe render. The human comparison with the official form photo (phase 2 gate) is still for the Developer.
Flaky test (S2): `health.test.ts` "returns 503 within the timeout" failed once under full-suite load (1450 ms against a 1000 ms wall-clock limit) and passed alone. Limit raised to 1900 ms for that test only.
Lint (S2): the first full lint since S0 ran fine with the 3072 MB heap. It found 33 unbound-method errors from my controller method shorthand (S1 and S2), fixed by using arrow properties like the health controller.

Summary (S2):
- Done: students (list, add, edit, archive, restore, search, filter), computed age with preview and warning, summary, Child's Record API (conferences, home visits, progress), Enrollment Form PDF, screens for the list, form, profile with Profile, Conferences and Home Visits tabs, and the Enrollment Form dialog.
- Cut (from the start): Progress tab UI, previous school year view, Admin by-center screen. APIs stay (docs/SPRINT_SHORTCUTS.md).
- Check: full npm run check green: 46 files, 693 tests, build ok, 7 min 12 s.
- Not checked: screens have not been opened in a real browser. The PDF was read by eye but not compared with the official form photo.
- Verify by hand: log in as a Teacher, add a student with a birthdate 6 years ago (warning shows), open the profile, add a conference note and a home visit, open the Enrollment Form.

## S3 Menu import and calendar (budget 4 h)

Plan (CUT list applied from the start: overlapping dates are rejected with a clear message, no week view):
1. Fixture copied to the plan's name (DEC-032). Bad fixtures are built in the tests with exceljs.
2. Packages: multer 2.5.0, exceljs 4.4.0; @fullcalendar/react, core, daygrid, list 6.1.22 (version 7 needs packages outside the approved list).
3. Tests first: parser on the real file, bad files, both time zones; import and calendar API; matrix rows.
4. Data: menu_batches, menu_days (the uploaded file is not stored).
5. modules/menu: pure parser and validation, preview held in memory for 30 minutes, confirm in one transaction.
6. modules/calendar: range of at most 62 days.
7. Upload: multer memory storage, 5 MB, .xlsx and the ZIP signature; errors in the standard shape.
8. UI: Menu Imports, FeedingCalendar (month on desktop, list on phones), day panel in a Drawer, formatMenuName.
9. Targeted checks (DEC-035). No full check at the end of S3; next at the end of S4.
10. Commit, log.

Summary (S3):
- Done: parser and validation for the DSWD file, preview and confirm, history, calendar API; Menu Imports page; FeedingCalendar with month and list views; day panel; formatMenuName.
- Cut (from the start): replacing overlapping dates, week view.
- Checks: parser 13 tests (real file in TZ=UTC and TZ=Asia/Manila, bad files); database 15 menu and calendar tests, matrix updated; client format and calendar logic; tsc -b clean; eslint on changed files clean. No full check this stage (DEC-035).
- Not checked: FullCalendar has not been seen in a real browser. It has no jsdom render test, only its pure helpers are tested.
- Verify by hand: as Admin upload server/test/fixtures/SF_MENU_for_30_days.xlsx, see 2 sheets with 42 days, confirm, open Calendar in September 2026.

## S4 Assignments and Purchase Requests (budget 5 h)

Plan (CUT list applied from the start: no rate setting screen, no Today's Feeding card, simple Retry):
1. Tests first: money vectors, budget, state machine table, field rights by role, version conflict, assignment rules, Parent filter, no budget fields for Parents, scope, matrix rows.
2. Data: feeding_assignments, purchase_requests, purchase_items; migration.
3. core/money.ts on Prisma Decimal; strings out, half-up to 2 decimals.
4. modules/assignments and modules/purchase-requests.
5. UI: weekly assignment board; day panel tabs Details, Assigned Parents, Purchase Request; LedgerTable; editor with 600 ms autosave and per-row state.
6. Admin: center selector on the calendar and a read-only Purchase Request view.
7. Parent: My Schedule calendar (Figma 393:1133) and day screen S-P5-04.
8. Targeted checks, then the full npm run check at the end of S4 (DEC-035).
9. Commit, log.
10. Not needed: the replace-import guard, because overlapping dates are refused outright in S3.

Test note (S4): the money and Purchase Request API tests were seen failing first (43 of 44 database tests failed, the money test file could not load). The autosave hook tests, LedgerTable tests and ParentDayScreen tests were written with their code in the same step and were not seen failing first.
Flaky test (S4): `server/test/startup.test.ts` timed out at 15 s under full-suite load and passed alone in 8 s. The server now imports exceljs and pdfmake, so tsx takes longer to start it. Limit raised to 30 s for that test only, matching its child process timeout (amends DEC-027).

Summary (S4):
- Done: assignments, Parent schedule, Purchase Requests, items with field rights and version conflict, budget with freeze on lock, state machine; weekly board; Teacher day panel with tabs and the editor with 600 ms autosave; Admin center selector and read-only view; Parent My Schedule and day screen; LedgerTable.
- Cut (from the start): rate setting screen, Today's Feeding card, retry polish. Other simplifications are in docs/SPRINT_SHORTCUTS.md.
- Check at the end of S4: the single `npm run check` run passed typecheck, lint and format, but Vitest could not start 2 workers ("Timeout waiting for worker to respond") with the machine under heavy load (625 s). One retry of the remaining steps, separately in the foreground: tests 55 files, 880 tests, exit 0; build ok.
- Not checked: none of the screens has been opened in a real browser yet. The two-browser concurrency check (phase 5 gate) is for the Developer.
- Verify by hand: as a Teacher open Assignments and assign a Parent; open Calendar, a day, Purchase Request; add Rice; as the Parent open the day and enter 2, 38.00; the total shows PHP 76.00; lock as the Teacher; the Parent sees the banner.

S4 committed: c4b3b5c.

## S5 Liquidation, submit, review (budget 4 h)

Plan (CUT list applied from the start: Transmittal is the placeholder page, no Admin queue filters):
1. Tests first: totals across PR PDF, Summary and snapshot; submit lists open days; rollback; Need Revision unlocks; snapshot immutable; PDF smoke tests; scope; matrix rows.
2. Data (additive): reports (LIQUIDATION only), report_reviews, liquidation_snapshots, submitted_report_id on purchase_requests.
3. builder.ts: one typed structure feeds the preview, the PDFs and the snapshot.
4. PDFs per phase 6: Purchase Request, Summary of Disbursement, Transmittal placeholder (A-09). Signatories from settings, blank by default.
5. Submit in one transaction; resubmission after Need Revision is a new version of the same report.
6. Review: Admin Approve or Need Revision with required feedback.
7. Submitted days cannot be unlocked (BR-12).
8. UI: Liquidation Forms overlay on the calendar, Submit Report with blocking days, Reports list, report detail with Stamp and review actions.
9. Targeted checks only (DEC-035). Next full check at the end of S6.
10. Commit, log.

Summary (S5):
- Done: liquidation builder, Purchase Request and Summary PDFs, Transmittal placeholder, submit with one transaction, resubmit as a new version, Admin review, unlock guard for submitted days, reports list and detail, Stamp, Liquidation Forms overlay.
- Cut (from the start): Transmittal beyond the placeholder, Admin queue filters. Others are in docs/SPRINT_SHORTCUTS.md.
- Tests were seen failing first (both new test files could not load). The Stamp test was written with its component. Checks: 10 PDF tests; database liquidation, purchase and permissions 332 tests; tsc -b clean; eslint on changed files clean. Sample PDFs read by eye. No full check this stage (DEC-035).
- Not checked: the screens in a real browser; PDFs against the official form photos.
- Verify by hand: as a Teacher lock the days of a month, open Calendar, Liquidation Forms, Submit Report; as the Admin open Reports, send it back with feedback; the days unlock; fix, lock, resubmit; approve.
