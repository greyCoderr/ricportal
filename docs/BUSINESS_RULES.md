# Business Rules

The register of business rules (BR-xx) is in docs/blueprint/03-blueprint.md section 4.6, and the assumptions (A-xx) are in section 4.7. Keep changes and new decisions here.

| Date | Rule | Change | Decision |
| --- | --- | --- | --- |
| 2026-11-04 | A-18 | Parents get no "Today's Feeding" card. The Parent home is the My Schedule calendar with today highlighted; the Teacher home keeps the card. Phase 1 Parent home is a placeholder | DEC-024 |
| 2026-11-07 | BR-05, BR-12, BR-14, A-06, A-14, A-17 | Default password on reset; Parents add, edit and delete rows on assigned days; Parents see the whole center calendar; `profile_extra` for extra student fields | DEC-037 |
| 2026-11-12 | A-16, BR-22 | The Admin's read-only Enrolled Students and Child's Record pages are built (`/admin/students`, `/admin/students/:id`); active students only | DEC-051 |
| 2026-11-14 | A-18 | The Teacher home follows frame 175:1023 (stat cards, Quick Actions, mini calendar with today marked, Report Tracking, Admin Feedback, Recent Reports, Enrolled Students); the separate "Today's Feeding" card is gone | DEC-053 |
| 2026-11-15 | BR-19 | Each login attempt is counted before the password check, so parallel attempts cannot pass the 5-failure lock (AUD-001) | DEC-054 |
| 2026-11-15 | BR-05 | Change password refuses the current password and the default password (AUD-002) | DEC-054 |
| 2026-11-15 | BR-11, BR-12 | Adding or deleting a Purchase Request row locks the day's request row first, so item numbers stay 1 to n under parallel requests (AUD-003) | DEC-054 |
| 2026-11-17 | BR-19 | Also 30 failed logins per client address in 15 minutes answer 429; logout ends the session on every device (AUD-010, AUD-012) | DEC-055 |
| 2026-11-17 | BR-21 | Database errors are logged by name, code and stack lines only (AUD-019) | DEC-055 |
| 2026-11-17 | A-12 | Child's Record entries of an earlier school year are read-only (AUD-014) | DEC-055 |
