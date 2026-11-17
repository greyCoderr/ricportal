# Annex A changes

What was built compared with the Annex A scope in docs/blueprint/01-context.md (sections 2.2 to 2.4).
Written in Plan 5 J5 (2026-11-18) from the code and the decision records. Only Objective 2 work is
built so far; Objective 3 (report file uploads) is planned in docs/OBJ3_PLAN.md and not started.

"Client approval needed" means the build differs from, or adds to, what Annex A or the clients' paper
says, and the clients should agree in writing before the defense. Questions to ask them are in
docs/OPEN_QUESTIONS.md; changes their paper needs are in docs/PAPER_CHANGES.md.

## Built differently from, or beyond, Annex A

| Area | Annex A or the paper says | What was built | Decision | Client approval needed |
| --- | --- | --- | --- | --- |
| Weekly Parent assignment | Teachers assign Parents weekly | A week (Monday to Sunday) has a team of at most 4 approved Parents of the center; each feeding day gets 0 to 4 of them; the whole week is saved at once | D4, DEC-037 | Yes: the limit of 4 |
| Parent view of the calendar | Parent sees assigned feeding days (D-09, A-06) | A Parent sees the whole calendar of the center (menu names and assigned Parents' names); Purchase Request details only on assigned days | D2, DEC-037 | Yes |
| Parent row editing | Parent enters unit, quantity and unit cost on assigned open days | A Parent may also add rows, edit the description and delete rows they created; budget, child count and rate stay hidden | D3, DEC-037 | Yes |
| Password reset | Admin resets Teacher passwords; no email | The approver resets to a default password set on the server; a change is forced at next login; no password is shown | D6, DEC-037, BR-05 | Yes: the default password approach (AUD-011) |
| Login protection | Not stated | 5 wrong passwords lock an account for 15 minutes; 30 failed logins from one address in 15 minutes are refused; logout ends the session on every device | BR-19, DEC-055 | No (security) |
| Profile pages | Not in Annex A | Every role has a Profile page (name, mobile, extra personal fields, change password); the Teacher's shows report counts and activity; the Admin has a RIC Teacher Profile page | D11, DEC-045, DEC-049, DEC-052 | Yes |
| Child's Record page | Teachers keep the Child's Record | A separate Child's Record list and detail with Conferences, Home Visits and Progress tabs; entries are soft-deleted; earlier years are read-only | DEC-050, BR-22, AUD-014 | No |
| Extra student fields | The paper's ERD fields | The Figma "add enroll" form's extra fields are stored in one JSON text column | D9, DEC-037, A-17 | Yes: the field list (docs/ui-specs/student-form.md) |
| Export List | Not in Annex A (a Figma button) | A dialog that picks the school year and date started, then makes the same Enrollment Form PDF | DEC-050 D9 | Yes |
| Previous school year | Teachers can view the previous year's list | Year cards on Enrolled Students; earlier rows are read-only. A selector (J3 c) is still to come | DEC-039 | No |
| Admin access to students | Read-only (A-16) | Read-only Enrolled Students and Child's Record pages for any center | DEC-051, A-16 | Confirm with the MAO |
| Dashboard cards | Number of RIC Teachers, total enrolled students, report status | Five cards from the Figma frame 267:9689 (Teachers, enrolled students and report counts), Quick Actions, Recent Reports and a mini calendar; Accomplishment and Enrollment counts stay 0 until Objective 3 | DEC-045, DEC-051 | No |
| Teacher home | "Today's Feeding" card (D-13, A-18) | The Figma RIC dashboard 175:1023: stat cards, Quick Actions, mini calendar with today marked, Report Tracking, Admin Feedback; no separate Today's Feeding card | DEC-053, A-18 | Yes |
| Dates | Not stated; Figma shows long dates | Every date in tables, forms and PDFs is numeric MM/DD/YYYY; long dates only in headings | D7, DEC-037 | Yes |
| Report status words | Paper: On Process, Need Revision, Submitted (D-02) | Submitted, Need Revision, Approved | BR-07 | Yes (paper change) |
| Menu upload | The DSWD Excel file | `.xlsx` only, at most 5 MB; a file with dates already imported is refused (replacing them with confirmation is J3 a) | DEC-045, BR-08 | Yes: `.xls` files must be saved as `.xlsx` |
| Settings screen | Admin sets the per-child daily rate and form signatory names | Not built yet: the rate is seeded at PHP 25.00 (A-03). J3 (b) adds a System settings screen reached from the Admin Profile (rate, current school year, signatories) | A-03, A-10, A-12 | Yes: the values |
| Transmittal Checklist | A generated PDF | A placeholder page "layout pending the official copy" | A-09 | Waiting for a clear copy |
| Parent sign-up and Request sent | Parents sign up and need approval | Built; no Figma frame exists, so the screens were designed by the Developer | DEC-025 | Yes: the screens |
| Calendar week view | Not stated | Month on desktop, list on phones; no week view | Sprint shortcut | No |

## Annex A scope not built yet

| Item | Where it is planned |
| --- | --- |
| Report file uploads (Accomplishment, Enrollment), versions, Teacher Submit Report, Admin review of all report types | Objective 3, docs/OBJ3_PLAN.md |
| Replacing overlapping menu dates with confirmation | Plan 5 J3 (a) |
| System settings screen | Plan 5 J3 (b) |
| Admin Reports filters by center and month | Plan 5 J3 (e) |
| Transmittal Checklist layout | After the clients send a clear copy (A-09) |

## Out of scope, unchanged (Annex A section 2.4)

Nothing on the out-of-scope list was built: no AI, no custom calendar activities, no receipt uploads, no
ingredient database, no mobile app, no DSWD integration, no notifications, no offline mode, no extra roles.
