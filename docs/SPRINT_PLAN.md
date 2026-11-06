# RICPortal Demo Sprint Plan (Objectives 1 and 2)

Created Fri 2026-11-06. Demo: Tue 2026-11-10 on localhost only. CODE FREEZE: Mon 2026-11-09 18:00
Asia/Manila. After the freeze only bug fixes that the Developer asks for.

## 0. What this file is
This plan overrides the slow-process rules in CLAUDE.md and docs/blueprint/02-rules.md for this
sprint only (no per-task approvals). Everything else still applies: CLAUDE.md architecture rules,
the business rules (BR-xx) and assumptions (A-xx) in docs/blueprint/03-blueprint.md,
docs/DESIGN_LANGUAGE.md, docs/tokens.md, docs/components.md, docs/ui-specs/*.md, DECISIONS.md.
If this file and another document conflict: this file wins on scope and process, the blueprint
wins on business rules. Read the phase files named in each stage; do not reread everything.

## 1. Scope
IN, Objective 1 (Student Registration and Management): students list, add, edit, archive, search;
age auto-computed; Child's Record (conference notes, home visits, progress); Enrollment Form PDF;
Admin read-only view per center.
IN, Objective 2 (Feeding Program and Liquidation): DSWD Excel import and calendar; weekly Parent
assignment; Purchase Request with ingredients, unit, quantity, unit cost; budget; lock; Parent day
screen; Purchase Request PDF; Summary of Disbursement PDF; Transmittal Checklist PDF (placeholder
layout); Submit Report; Admin review (approve or need revision).
IN, foundations: login, roles, 28 centers, Teacher accounts, Parent sign-up and approval, layouts.
OUT (do not build): report file uploads and report tracking screens, Admin dashboard, settings
screens (use the seeded settings), file_assets table, CI, the /__ui gallery, deployment, TiDB,
Hostinger, email, anything not in Annex A. Do NOT start Objective 3.

## 2. Process rules (autonomy)
- Do not ask me questions and do not wait for approval. Write a 10-line plan for each stage at the
  top of that stage's entry in docs/SPRINT_LOG.md, then work.
- When something is unclear, use the documented default, record it as DEC-030 and up in
  docs/DECISIONS.md, and continue.
- STOP and tell me only for these blockers: (1) XAMPP MySQL is not reachable on port 3306;
  (2) a required file is missing (for example the Excel fixture); (3) you would need to read or
  edit .env files or any secret; (4) a destructive or irreversible operation; (5) the Figma
  limit; (6) a package outside the approved list; (7) a test you cannot make pass after 3 honest
  attempts: mark the task BLOCKED in the log, skip it and continue with the next task.
- Git: work on branch demo-sprint. Commit at the end of each stage (git add with file names, never
  git add -A). The commit-msg hook strips attribution; check git log -1 --format=%B after each
  commit. Never push, never use --no-verify.
- Time-box each stage. If a stage passes 150 percent of its budget, apply that stage's CUT list,
  log it, and move on.
- Keep context small: read only the docs a stage needs. After each stage write a summary in
  docs/SPRINT_LOG.md (what is done, what is cut, how to verify, known issues) so work survives a
  context reset.
- Dev-only defaults so nothing blocks on .env: env.ts gives safe development and test defaults
  for JWT_SECRET (min 32 chars), COOKIE_SECURE=false, SESSION_HOURS=8, ADMIN_USERNAME=admin and
  ADMIN_PASSWORD=Admin2026!; production must set them explicitly. Document the new variables in
  .env.example. Demo accounts (fake, local only): password Demo2026! for teacher.sibujo,
  parent1, parent2, parent3.
- Approved new packages (exact versions, latest stable at least 14 days old, no release candidates,
  check peer ranges, use the Context7 connector for current docs): bcryptjs, jose, multer,
  exceljs, pdfmake with its types, @fullcalendar/react, @fullcalendar/core, @fullcalendar/daygrid,
  @fullcalendar/list. Nothing else without a blocker report.
- Figma: at most 25 get_design_context or screenshot calls in total, one read per node, ids
  recorded in docs/components.md. Use docs/figma-inventory.md and docs/components.md first. Parent
  frames PARENT LOGIN 393:1102 and PARENT CALENDAR 393:1133 may now be read (once each). Anything
  not in Figma: build it from docs/ui-specs/ and docs/DESIGN_LANGUAGE.md without waiting
  (Developer-designed screens are pre-approved for this sprint).

## 3. Testing policy
- Tests first, then code, for business rules and API: money, status machines, permissions, center
  scoping, lockout, age, importer, budget, assignments, snapshots. Show them failing once, then
  passing.
- UI: build, typecheck and component tests only where there is logic (forms, autosave, locking).
- While working run targeted tests (npx vitest run --project client or unit or db, plus a file
  name). Run the full npm run check at the end of each stage; if it fails, fix before the commit.
- Never delete, skip or weaken a test. A flaky timeout: run the file alone first, then raise the
  timeout for that one test only and log it.
- Final stage adds one API-level end-to-end test of the whole demo path (section 7).
- Every endpoint: standard response shapes, authenticate, requireRole, center scope, Zod
  validation from shared, a negative test for wrong role and wrong center.

## 4. Stages (do them in order)

### S0 Foundation minimum (budget 2 h)
- Lint script memory: run ESLint with a larger heap using a cross-platform command in package.json
  (node --max-old-space-size=4096 on the eslint binary).
- UI kit rest (DEC-028 decisions): Modal and ConfirmDialog (native dialog), Drawer (right on
  desktop, bottom sheet under 768 px), Table (scope on headers, tokens only), simple Pagination.
- Layouts: AppShell for Admin and Teacher (sidebar from docs/components.md and Figma nav labels),
  top bar layout for Parent, role-aware nav, 403 and 404 pages.
- Production run: Express serves client/dist with the SPA fallback written /{*splat} for non-/api
  paths; scripts build and start work on one port.
- Done: npm run check green; commit "chore(sprint): S0 foundation".
- CUT: Pagination polish, Drawer animation.

### S1 Authentication, centers, accounts (budget 4 h) - read docs/phases/phase-1.md
- Data: centers, users, parent_profiles. Seed: 28 centers from docs/seed-centers.md, the Admin,
  settings. Use bcryptjs (cost from config: 12 in production, 4 in tests) and jose (HS256) in an
  httpOnly SameSite=Lax cookie named rp_session, 8 hours, Secure only in production, with
  token_version invalidation.
- API: login, logout, me, change-password, parent-signup, public centers, centers list/create/edit,
  teachers list/create/edit/disable/reset-password, parents list/approve/decline/disable/enable/
  reset-password. Rules BR-02, BR-03, BR-04, BR-05, BR-19 and DEC-026 (a locked account gets HTTP
  429 with Retry-After for every attempt, and the same for unknown usernames).
- Middleware: authenticate, requireRole, scopeToCenter (core/scope.ts), validate.
- UI: Login with the four messages (S-P1-07), Parent sign-up S-P1-02 and Request sent, forced
  change-password, Admin Centers list and Teachers (create with temp password shown once, reset),
  Teacher parent requests (approve, decline, disable, reset), Parent placeholder home, route
  guards, 401 redirect to login with return path.
- Tests: login success, wrong password, lockout, pending, declined, disabled; token invalidation
  after password change; table-driven permission matrix over every route and role; Teacher A cannot
  see center B; no password hash in any response; locked and unknown-user responses identical.
- Developer check: admin logs in, creates a teacher, teacher changes the password, a parent signs
  up, the teacher approves, the parent logs in.
- CUT: parent disable and reset UI, Admin center rename UI.

### S2 Students (budget 4 h) - read docs/phases/phase-2.md and docs/ui-specs/parent-screens.md only if needed
- Data: students (with the optional Child's Record fields), conference_notes, home_visits,
  child_progress. School year from the seeded currentSchoolYear setting.
- API per phase-2.md: students list/create/get/patch/archive/restore, conferences, home visits,
  progress (create, edit, soft delete), summary by age and gender, Enrollment Form PDF (Teacher own
  center, Admin any center). Admin reads students and Child's Records only.
- PDF base in modules/pdf using pdfmake (check Context7 for the current Node API and fonts). Print
  the currency as the letters PHP, never a peso sign. Enrollment Form layout exactly as in
  phase-2.md: 30 rows per page, header repeated, blank rows, age summary 2 3 4 and Other.
- UI (Figma Teacher frames 258:5447 add enroll and the student list frame from the inventory):
  student list (search, status filter, pagination), add and edit form with all validation messages
  and age preview, profile with tabs (Profile, Conferences, Home visits, Progress), Enrollment Form
  dialog that opens the PDF in a new tab, Admin students-by-center page (read only).
- Tests: computeAge (birthday today, day before, 29 February, year end, future date), summary
  buckets with an 18-child fixture, duplicate rule, scoping, Admin cannot write, soft delete, PDF
  starts with %PDF and has 1 page for 18 students and 2 pages for 45.
- CUT: Progress tab UI, previous school year view, Admin by-center screen (keep the API).

### S3 Menu import and calendar (budget 4 h) - read docs/phases/phase-4.md (it holds the exact file layout)
- Fixture: server/test/fixtures/SF_MENU_for_30_days.xlsx must exist (blocker if missing).
- Data: menu_batches, menu_days (do not store the uploaded file). Parser exactly as phase-4.md:
  header detection, left-most column pair, PR number normalization, PR date mm/dd/yyyy, Date cells
  read with UTC getters, stop at the first empty date, ignore the duplicate right-hand block.
- API: import preview (multer memory storage, 5 MB, .xlsx only, check the ZIP signature), confirm
  (one transaction), batches list, calendar range (max 62 days).
- UI: Admin Menu Imports (upload, preview table with warnings, confirm), FeedingCalendar with
  FullCalendar (month on desktop, list on phones, read-only, no drag), day panel (Drawer),
  formatMenuName, Teacher and Admin calendar pages.
- Tests: the real fixture gives 2 batches of 42 days, first day 2026-09-17 EGG CALDERETA, last day
  2026-12-09 SINIGANG NA BABOY, PR SF-2026-003 and SF-2026-004, PR dates 2026-09-11 and
  2026-10-23; bad fixtures (no header, text dates, duplicate dates, wrong type); run date tests with
  TZ=UTC and TZ=Asia/Manila; month boundaries; role access.
- CUT: replacing overlapping dates (reject with a clear message), week view.

### S4 Assignments and Purchase Requests (budget 5 h) - read docs/phases/phase-5.md, docs/ui-specs/parent-screens.md, docs/ui-specs/ui-kit.md
- Data: feeding_assignments, purchase_requests, purchase_items. Rules BR-10 to BR-15, DEC-026
  (a Parent response never contains budget, enrolled count or rate; a Teacher response does).
- Money: Prisma Decimal, never Number or float, half-up to 2 decimals, strings in the API; version
  column with 409 on stale edits.
- API per phase-5.md including open, items add/edit/delete, lock, unlock, no-feeding, assignments
  by week, parent schedule, approved parents.
- UI: Teacher weekly assignment board; day panel tabs (Details, Assigned Parents, Purchase
  Request); Purchase Request editor as a ledger table (build LedgerTable from docs/ui-specs/ui-kit.md:
  ruled lines, right-aligned tabular numbers, total row with a double rule) with 600 ms autosave,
  per-row Saving, Saved, Failed with Retry, budget line, Lock, Unlock, No feeding; Today's Feeding
  card on the Teacher home; Admin calendar with a center selector and read-only Purchase Request
  view; Parent: My Schedule calendar (Figma PARENT CALENDAR 393:1133) showing only assigned days,
  and the day screen S-P5-04 with unit, quantity and unit cost entry, subtotal, locked and empty
  states. The Parent home is this calendar.
- Tests: money vectors (2 x 38.00 = 76.00, 0.5 x 340.00 = 170.00, 0.25 x 80.00 = 20.00, subtotal
  266.00); budget 18 x 25.00 = 450.00; state machine; field rights by role (Parent cannot add or
  delete rows or edit descriptions); version conflict; assignment rules; Parent calendar filter;
  no budget fields for Parents; scoping.
- CUT: rate setting screen (use the seed), Today's card, retry polish.

### S5 Liquidation, submit, review (budget 4 h) - read docs/phases/phase-6.md
- Data (additive, matching the blueprint): reports (type LIQUIDATION only for now), report_reviews,
  liquidation_snapshots, plus submitted_report_id on purchase_requests. Skip report_versions and
  file_assets.
- API: liquidation preview, PDFs (Purchase Request per day, Summary of Disbursement, Transmittal
  Checklist), submit (all days LOCKED or NO_FEEDING, one transaction, immutable snapshot), review
  (Admin approve or need revision with required feedback; need revision unlocks the days), list for
  Teacher (own) and Admin (all), snapshot.
- PDFs follow the layouts in phase-6.md. The Transmittal Checklist is a clean placeholder page
  titled "layout pending the official copy" (A-09). Signatory names from settings, blank by default.
- UI: calendar page button opens the Liquidation overlay (tabs Purchase Requests, Summary with a
  period picker defaulting to this month, Transmittal) with Submit Report and a confirm dialog that
  lists blocking days; Teacher sees status and feedback; Admin queue and detail with Approve and
  Need Revision (use the Stamp spec from docs/ui-specs/ui-kit.md for the decision, built now).
- Tests: totals identical across PR PDFs, Summary and snapshot; submit validation lists open days;
  rollback leaves no partial data; need revision unlocks; snapshot immutable after later edits;
  PDF smoke tests; scoping and permission rows.
- CUT: Transmittal beyond the placeholder, Admin queue filters.

### S6 Demo readiness and QA (budget 3 h)
- Script db:seed:demo (refuses to run unless NODE_ENV is not production, the host is local and the
  database is ricportal): teacher.sibujo for Sibujo, parent1 to parent3 approved, 18 fake
  Filipino-named students, the menu imported from the fixture through the real service,
  assignments for the current week, some Purchase Requests partly filled, one locked day.
  Idempotent: re-running restores the demo state and unlocks demo accounts.
- docs/DEMO_SCRIPT.md: how to start (XAMPP, npm run dev), accounts, and a 10 minute click path for
  Objective 1 and 2, plus a list of what is not built.
- API-level end-to-end test (demo-flow.test.ts) through the real app and test database that walks
  the whole demo path in section 7.
- Full npm run check, then fix. Update PHASE_LOG and BACKLOG for cut items. Write the final
  summary in docs/SPRINT_LOG.md. Do not touch Objective 3.

## 5. UI rules
Use components in client/src/components/ui and tokens only (the color scan must pass). Every screen
has loading, empty, error and forbidden states. Errors: field messages under inputs; 401 redirects
to login; 403 shows the 403 page; 409 shows "Updated by someone else. Your change was not saved.";
422 shows the server message; network failures show ErrorState with Retry; no unhandled promise.
Mobile first at 360 px. Plain words with real center and dish names (DESIGN_LANGUAGE.md).

## 6. Bug and error playbook (apply before debugging for long)
- Cannot find module @ricportal/shared or the Prisma client: run npm run codegen.
- Prisma 7 needs the adapter: create clients only through core/db.ts.
- Migrations: create with npm run db:migrate -- --name x; never edit applied migrations; if drift
  appears on the local dev database, log it and stop that task (reset is not allowed).
- XAMPP stopped: tests fail with a clear message; blocker, tell me.
- Dates: only YYYY-MM-DD strings for calendar days; Excel dates via UTC getters; never convert
  with new Date(string); run date tests with TZ=UTC and TZ=Asia/Manila.
- Money: never Number; Decimal in, string out; test the vectors.
- Express 5: SPA fallback is /{*splat}; req.query is read-only.
- Vite proxy: /api goes to port 3000; same origin, so no CORS; cookies Secure false in development.
- Rate limit or lockout trips during manual testing: the demo seed resets lockouts; RATE_LIMIT_MAX
  is set in .env.
- Case-insensitive usernames: store lowercase.
- FullCalendar: allDay events with date-only strings, editable false, height auto; it injects
  inline styles, which the CSP already allows.
- pdfmake: use the built-in fonts, no peso sign (write PHP), headerRows for repeated headers,
  dontBreakRows, verify with %PDF and a page-count helper.
- Autosave races: one request in flight per row; send version; on 409 refresh the row.
- React Query: invalidate the right keys after every mutation.
- Windows: no rm or cp in scripts; use node. Line endings LF (.gitattributes).
- Vitest on this slow machine: client project timeout is 15 s; run a flaky test alone first.
- ESLint out of memory: larger heap (S0).
- jsdom has no showModal: the test stub exists in client/test/setup.ts.
- Tailwind default palette is removed: tokens only.
- N+1 queries: use include or one grouped query.
- Multer errors (too large, wrong type): map to the standard error shape, never leak parser text.

## 7. Demo path (acceptance, also the end-to-end test)
1 Admin logs in. 2 Admin creates teacher.sibujo for Sibujo. 3 A Parent signs up for Sibujo, the
Teacher approves, the Parent logs in. 4 Teacher adds 5 students, opens a profile, adds a conference
note and a home visit, downloads the Enrollment Form PDF. 5 Admin uploads the DSWD Excel file,
previews, confirms; the calendar shows menus from 17 Sep to 9 Dec 2026. 6 Teacher assigns Parents to
this week, opens a Purchase Request, lists ingredients. 7 Parent opens an assigned day and enters
unit, quantity and unit cost; totals and subtotal update; the Parent response has no budget.
8 Teacher locks the day; the Parent can no longer edit. 9 Teacher downloads the Purchase Request and
Summary PDFs, submits the month; Admin sees the submission, sends it back, the days unlock, the
Teacher resubmits, the Admin approves. 10 API-only check (the screen is cut, docs/SPRINT_SHORTCUTS.md):
the Admin reads GET /api/students?centerId= and a Child's Record, and every write by the Admin is refused.

## 8. Logging and resume
Keep docs/SPRINT_LOG.md up to date after every stage. If the session restarts or you hit a usage
limit, a new session reads this file and the log, runs git status and git log, runs npm run check
once, and continues from the first unfinished stage.