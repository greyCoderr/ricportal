# RICPortal Plan 5: Finish Objective 2 (audit, fidelity, Parent pass, cut items, hardening, docs)

Created Sat 2026-11-14. There is no fixed demo date; the goal is a finished, polished Objective 2.
Objective 3 does NOT start until the Developer says so. Branch demo-polish-5 (from demo-polish-4).
Fallback tag v0.9.7-demo. Never move tags. New tags: v0.9.8-demo after J1, v0.10.0-obj2 after J6.
MODEL PLAN: J1 runs on Claude Fable 5.2 (included in the Pro plan until Tue 2026-11-17 15:59
Asia/Manila). J2 to J6 run on Opus 5.5. If Fable stops being available (limit reached, "Requires usage
credits", or declined requests), do NOT enable usage credits: write where you stopped in
docs/POLISH_LOG.md and stop; the Developer continues on Opus.

## 0. Process
Same rules as docs/POLISH_PLAN_4.md section 0 and the memory rules DEC-035, DEC-042, DEC-047: ONE
command at a time in the foreground; tests per project on one worker, in batches; before browser checks
build once and start the API with the node line that npm start runs on port 3100 with RATE_LIMIT_MAX set
only in the shell; ONE browser at a time; stop every server you start; never touch port 3000 or unknown
processes; never use npm run dev. Do not ask questions; use these defaults; record decisions as DEC-054
and up; log in docs/POLISH_LOG.md under "Plan 5"; commit per finding or page group by file name; never
push; check git log -1 --format=%B after commits. Never read or edit .env files, private/ or real
personal data; PDF and form references are only redacted copies the Developer places in
docs/feedback/forms/. Figma: at most 60 calls in this plan (check docs/components.md for the count), at
most 10 per minute, one design-context read plus at most one screenshot per frame; record node ids.
Cut line: PDF extras (J6), then CI (J4), then Admin queue filters (J3). Never cut J1 or the tests.

## 1. Stages

### J1 Code audit, critical fixes, Objective 3 plan (Fable; budget 6 h)
J1a Read-only audit. Write docs/AUDIT_REPORT.md with a findings table (id, area, severity critical,
high, medium or low, evidence file and line, why it matters, proposed fix, size). Read the code against
docs/blueprint/03-blueprint.md, docs/phases/*.md, docs/SPRINT_SHORTCUTS.md and every DEC. Cover:
1 every route: authenticate, requireRole, center scope, Zod validation, standard errors, and the
permission matrix test completeness; 2 access by id across centers (students, child records,
purchase requests, items, reports, snapshots, feedback, PDFs, profiles); 3 mass assignment on every
PATCH; 4 passwords, reset, default password, token_version, cookie flags, lockout and rate-limit
bypass (forwarded headers, usernames, timing); 5 races and transactions: week assignment PUT,
purchase item PATCH with version, lock versus edit, submit liquidation, import confirm, resubmit,
double click; find the root cause of the intermittent 404 in "a Parent adds a row" (assignments-week
test) or explain why it cannot happen; 6 money and dates: Decimal everywhere, rounding, Asia/Manila
boundaries for today, school year and periods, leap days; 7 uploads: size, type, zip signature,
memory, errors; 8 PDF generation: injection of text, large inputs, concurrency; 9 leaks in errors and
logs; 10 layering violations, duplicated or unused code, N+1 queries, unbounded queries and pagination
limits; 11 tests missing for each business rule BR-01 to BR-22 and each assumption; 12 accessibility
of screens; 13 docs that do not match the code; 14 dependency versions and licenses.
J1b Fix every critical and high finding: a failing test first (seen failing), the smallest fix, targeted
tests, one commit per finding. Medium and low go to docs/BACKLOG.md with their ids. Tag v0.9.8-demo.
J1c Write docs/OBJ3_PLAN.md (docs only, no code): Objective 3 scope from Annex A (report file uploads,
Accomplishment and Enrollment reports, versions and files, review flow reuse, Teacher Submit Report,
Report Status, Admin Feedback, Admin Reports for all types, real dashboard counts), data model changes
(additive), endpoints, rules BR-06, BR-07, BR-20, upload security design, UI mapping to the Figma frames
in docs/figma-inventory.md, task list with ids, tests per task, risks, and an estimate in working days.

### J2 Fidelity audit by frames and Parent pass (Opus; budget 6 h)
For every page of Admin, Teacher and Parent: read its Figma frame once (design context plus one
screenshot, saved in docs/feedback/figma/), screenshot ours at the same width (1440x900, plus 390x844
where a phone frame exists), compare by measurement, write docs/FIDELITY_REPORT.md (page, frame id,
differences, fixed yes or no), and fix differences in layout, spacing, sizes, colors and texts. Respect
the documented decisions (numeric dates, our status words, .xlsx-only upload, no unbuilt features).
Parent: read PARENT LOGIN 393:1102, PARENT CALENDAR 393:1133 and every other Parent frame found by name
in the Figma metadata (sign-up, request sent, day or ingredients screen, profile); compare and fix; for
screens Figma lacks keep the Developer-designed specs and list them in the report as "client approval
needed". Tests for any logic you touch; commit per page group.

### J3 Restore the cut items (Opus; budget 4 h)
From docs/SPRINT_SHORTCUTS.md, except the Transmittal layout (waiting for the official copy) and
anything in Objective 3: (a) replace-on-import with explicit confirmation, refused when Purchase
Requests exist on the overlapping dates (BR-08), listing those dates; (b) an Admin "System settings"
screen reached from the Admin Profile (not a new sidebar item): per-child daily rate (0 to 1000, two
decimals, affects only OPEN days), current school year (YYYY-YYYY), and form signatory names and titles;
(c) previous school years: a school year selector on Enrolled Students, past years read-only; (d) the
budget progress bar and Retry polish on the Purchase Request editor; (e) Admin Reports filters (status,
center, month). Tests first for logic; browser check.

### J4 Hardening without deployment (Opus; budget 3 h)
(a) The global rate limit applies to /api only (not static assets) with a stricter limiter on the login
endpoints in addition to the lockout; tests. (b) upgrade-insecure-requests only when NODE_ENV is
production; test. (c) Fix the npm run dev hang under tsx watch: find the root cause within 45 minutes,
otherwise document it and add a working dev script for the API. (d) ESLint heap and a memory-lite
sequential check script (check:lite, one test worker) that npm run check uses. (e) Code splitting with
lazy routes so the main script is under 500 kB. (f) pdfmake URL access policy set to deny, silencing the
notices. (g) npm audit: resolve the uuid advisory through exceljs with an override if safe, else
document. (h) A GitHub Actions workflow file (install, typecheck, lint, test with a MySQL service,
build): mark it UNVERIFIED because it cannot run locally. No deployment configuration.

### J5 Documentation and Annex A (Opus; budget 3 h)
Update docs/API.md (every endpoint, generated from the routers and checked against the matrix test),
docs/DATA_MODEL.md (from schema.prisma, with a Mermaid erDiagram), docs/UI_MAP.md (screens, Figma ids,
status), docs/BUSINESS_RULES.md and the blueprint rows that changed (A-06, A-14, A-16, A-17, A-18 and the
DEC list), CHANGELOG and README. Create docs/ANNEX_A_CHANGES.md: a table comparing the Annex A scope in
docs/blueprint/01-context.md with what was built (weekly team of up to 4 Parents, Parent row editing,
default password reset, profile pages, Child's Record page, Export List, dashboard cards, numeric dates,
settings screen and so on) with a column "client approval needed". Create docs/PAPER_CHANGES.md (what
the clients must change in their paper) and docs/OPEN_QUESTIONS.md (questions for the clients). Do not
write the final ERD and DFD yet (Phase 8).

### J6 PDF check and final verification (Opus; budget 3 h)
Generate sample PDFs with fake data (Enrollment Form with 18 and 45 students, Purchase Request, Summary
of Disbursement, Transmittal placeholder) into docs/feedback/pdf-samples/. Write docs/PDF_CHECKLIST.md:
each element of the official forms from docs/phases/phase-2.md and phase-6.md (header texts, columns,
widths, rows per page, summary table, signature lines, totals) with an automated check where possible
(page counts, text content) and a "Developer compares by eye" column. If redacted official photos exist
in docs/feedback/forms/, compare layout only. Then the final verification: tests per project in
batches, build, browser audit of every page for the three roles at 1440x900, 1366x768 and 390x844 on
the built app on port 3100, smoke test, update docs/DEMO_SCRIPT.md, tag v0.10.0-obj2, and write the Plan
5 summary in docs/POLISH_LOG.md including what is NOT verified.

## 2. Playbook additions
- Audit findings need evidence (file and line) and a way to reproduce; do not report style opinions as
  high severity.
- A fix without a test that failed first does not count for critical and high findings.
- Sessions can end at any time: update docs/POLISH_LOG.md after every finding and every stage.