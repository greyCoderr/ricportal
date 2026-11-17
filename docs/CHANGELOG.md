# Changelog

Added, changed and fixed items for each tagged version, updated at every gate.

## v0.9.1-demo (2026-11-07)

Added: client images from Figma; Profile for all roles; footer; calendar day panels; Assign Parents modal and `PUT /api/assignments/week`; `GET /api/dashboard/summary`; `GET /api/reports/feedback`; Admin Dashboard, Teacher Home, Admin Feedback; the full student form with `profile_extra`; masked MM/DD/YYYY date fields; DEFAULT_PASSWORD.

Changed: navigation labels (D10); a Parent sees the whole center calendar (D2) and may add, edit and delete rows on assigned days (D3); a password reset sets the default and returns no password (D6); disabled users are marked per D8; every date in tables, forms and PDFs is MM/DD/YYYY (D7); the Summary table moved into the Liquidation Forms overlay (D5).

Removed: the `/assignments` page, ParentLayout, TemporaryPasswordDialog.

Migrations (additive): `20261107085701_polish_week_team_created_by`, `20261107093727_polish_student_profile_extra`.

## After v0.9.1-demo (2026-11-07)

Fixed, from the browser check: dark background on the login page and the footer logos; sideways scroll on Enrolled Students on phones; the day button and the today fill on the calendar; focus after closing a modal or drawer; wrapping in the sidebar; the family table at 1440 px; the dashboard cards.

Fixed, from the save-flow check: dates on the report detail and Menu Imports pages now read MM/DD/YYYY; the Reports table keeps Status and Actions in view from 1366 px; the report link is a full tap target at 768 px.

## v0.9.8-demo (2026-11-14)

Added: docs/AUDIT_REPORT.md (code audit, 42 findings) and docs/OBJ3_PLAN.md (plan for Objective 3, no code).

Fixed, from the audit: the login lock now counts wrong passwords sent at the same moment (AUD-001);
change-password refuses the current password and the default password (AUD-002); rows added to a Purchase
Request at the same moment keep the numbers 1 to n, a day opens once, and a row cannot be added or deleted
after the lock (AUD-003).

No migration.

## v0.9.9-demo (2026-11-17)

Added: a limit on failed logins per client address (30 in 15 minutes); docs/OBJ3_PLAN_REVIEW.md.

Changed: the server refuses to start without NODE_ENV unless every secret is set, and uses the built-in
local values only with NODE_ENV development or test (see `.env.example`); logout ends the session on the
server, on every device; the global rate limit covers `/api` only; database connections use UTC;
transactions may wait 10 s for a connection and run 20 s.

Fixed, from the audit: unlock and submit at the same moment can no longer leave an open day in a
submitted report (AUD-004); a doubled request answers 409 instead of 500 (AUD-005); two active Teachers in
one center (AUD-006); menu file values that do not fit are preview errors (AUD-007); liquidation submit no
longer hides errors as 409 (AUD-008); Child's Record entries of an earlier school year are read-only
(AUD-014); a busy database answers 503, and the week save waits instead of failing (AUD-015); database
errors are logged without their values (AUD-019); a moved Teacher sees only the current center's reports
on the Profile (AUD-021).

No migration.


## Unreleased, after v0.9.8-demo (to 2026-11-18)

Fixed, from the audit's medium findings (J1d, DEC-055): built-in secrets only with NODE_ENV development or
test, unset means production (AUD-009); lock, unlock, No feeding and submit check the day's state in the
write itself (AUD-004); a write that loses to a parallel request answers 409, not 500 (AUD-005); one active
Teacher per center holds for parallel requests (AUD-006); menu values that do not fit the database are
preview errors (AUD-007); only the known submit race is a 409 (AUD-008); failed logins are limited per
client address (AUD-010); logout ends the session on the server (AUD-012); Child's Record entries of an
earlier school year are read-only (AUD-014); transaction time limits, a timeout answers 503 (AUD-015); the
global rate limit covers `/api` only (AUD-016); database errors are logged by name, code and stack lines
only (AUD-019); the Teacher Profile shows reports of the current center only (AUD-021); every database
connection uses UTC (AUD-022).

Changed, fidelity to the Figma frames (J2): Login sizes and colors (241:1732, 393:1102); the day panels on
phones (393:1133); Teacher Calendar panels, Enrolled Students and Report Status (166:1553, 78:260, 78:284);
Admin calendar day panels in two columns and dark green dashboard numbers (268:11404, 267:9689). The demo
seed adds four children of the previous school year and three reviewed liquidation reports.

Added: `.github/workflows/ci.yml` (typecheck, lint, format, the three test projects with a MariaDB
service, build), UNVERIFIED until its first run on GitHub (DEC-057). Documentation: endpoint index, whole
schema erDiagram, screen map, docs/ANNEX_A_CHANGES.md, docs/PAPER_CHANGES.md, docs/OPEN_QUESTIONS.md.

No migration.
