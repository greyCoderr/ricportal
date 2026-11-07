# Changelog

Added, changed and fixed items for each tagged version, updated at every gate.

## v0.9.1-demo (2026-11-07)

Added: client images from Figma; Profile for all roles; footer; calendar day panels; Assign Parents modal and `PUT /api/assignments/week`; `GET /api/dashboard/summary`; `GET /api/reports/feedback`; Admin Dashboard, Teacher Home, Admin Feedback; the full student form with `profile_extra`; masked MM/DD/YYYY date fields; DEFAULT_PASSWORD.

Changed: navigation labels (D10); a Parent sees the whole center calendar (D2) and may add, edit and delete rows on assigned days (D3); a password reset sets the default and returns no password (D6); disabled users are marked per D8; every date in tables, forms and PDFs is MM/DD/YYYY (D7); the Summary table moved into the Liquidation Forms overlay (D5).

Removed: the `/assignments` page, ParentLayout, TemporaryPasswordDialog.

Migrations (additive): `20261107085701_polish_week_team_created_by`, `20261107093727_polish_student_profile_extra`.
