# RICPortal Polish Plan Round 4 (fidelity fixes from the client Figma comparison)

Created Wed 2026-11-11. Presentation moved to next week; no code freeze today. Branch demo-polish-4
(from demo-polish-3). Fallback tag v0.9.6-demo. Do not move tags. New tag at the end: v0.9.7-demo.

## 0. Process
Same rules as docs/POLISH_PLAN_3.md section 0 and the memory rules DEC-035, DEC-042, DEC-047 and the
Round 3 browser rules: ONE command at a time in the foreground; tests per project on one worker; before a
browser check build once, start the API with the node line that npm start runs on port 3100 with
RATE_LIMIT_MAX set only in the shell, open ONE browser at a time, stop every server you start, never touch
port 3000 or unknown processes, never use npm run dev. Do not ask questions; record decisions as DEC-051
and up; log in docs/POLISH_LOG.md under "Round 4"; commit per stage by file name; never push; never move
tags; check git log -1 --format=%B after commits. Figma: at most 40 more calls (see docs/components.md for
the count), at most 10 per minute, one design-context read plus at most one screenshot per frame, record
node ids. Reference images in docs/feedback/: figma-admin-dashboard.png, ours-admin-dashboard.png,
figma-admin-calendar.png, ours-admin-calendar.png, figma-teacher-profile.png. Read them first. Compare in
the browser at 1440x900, 1366x768 and 390x844 using screenshots and getBoundingClientRect, and fix every
difference in layout, spacing, sizes, colors and texts. Do not touch Objective 3. Cut line: Teacher Home
polish first, then the Recent Reports tabs. Never cut the tests.

## 1. Decisions (record in docs/DECISIONS.md)
D1 Admin Dashboard follows Figma 267:9689 (figma-admin-dashboard.png): FIVE cards in this order:
   Registered RIC Teacher, Total Enrolled Students, Enrollment Reports Submitted, Accomplishment Reports
   Submitted, Reports for Revision (red). The "Reports Submitted" card is removed (this reverses the six-card
   list of Round 2 D6; GET /api/dashboard/summary keeps returning the total). Card look as in Figma: icon
   circle, big number, label, bottom border (green, red for revision).
D2 Mini calendar on the Admin Dashboard and on Teacher Home: a plain custom MiniCalendar component (CSS
   grid, no FullCalendar): month heading with arrows and the year at the right, green weekday header, day
   NUMBERS only, today's cell light green, a small dot on days that have a menu, grey numbers for other
   months; clicking a day opens the Calendar page at that date. No dish names (this fixes the overlapping
   text seen in ours-admin-dashboard.png). The full Calendar page keeps FullCalendar.
D3 Quick Actions on the Admin Dashboard: four tiles as Figma (three green, the fourth yellow): Send Feedback
   (opens Reports; "Review reports and send feedback to teachers"), Monitor Enrolled Students (opens the
   Admin Students page; "View and monitor student records by center"), RIC Teachers ("Add teachers and reset
   their passwords", replaces Review Applications because the system has no applications), View Reports
   ("Check the liquidation reports", yellow). Centers management moves into the RIC Teachers page as a
   "Manage Centers" button.
D4 Admin Students page (a cut item restored): read-only; center select, search, table (#, Student Name, Date
   Enrolled, Age, Center), a link to the student's read-only Child's Record; uses the existing API; table
   header row style as D9; reachable from the dashboard tile and a back link.
D5 Recent Reports card as Figma: tabs (Liquidation Reports live; Enrollment Reports and Accomplishment
   Reports show "No reports yet."), columns Teacher Name, Report Type, Date Submitted (MM/DD/YYYY), Status
   badge (our statuses), a "View All Reports >" link, fixed height so the dashboard fits the screen at
   1366x768 and larger.
D6 Admin Calendar follows Figma 268:11404 (figma-admin-calendar.png): page title "Calendar" in the top bar
   row aligned with the header; a notice banner when the selected month has no menu ("No Menu/Food Rotation
   Upload for {Month Year}", "Please upload a document containing the menu/food rotation for this month.",
   Upload Document button that opens the upload card); month heading with arrows beside the month name and
   the year at the right; green weekday header; today's cell light green; the upload card at the right,
   aligned with the calendar top: title, helper text, drag and drop zone, a "Selected File" chip (name, size,
   remove x), a dark green button Upload & Process (accent token, not the red primary), enabled only when a
   file is selected, the helper text, and the "View import history" link. Texts say ".xlsx" (the importer
   reads only the DSWD Excel file). The RIC Children Center selector stays as a compact control in the header
   row. Calendar cells keep the two-line clamp from Round 3 and the whole month visible at 1366x768 and up.
D7 Teacher Home follows Figma 175:1023: read the frame again, list its cards, order and positions, and make
   ours identical (which cards sit side by side, their widths and heights, the Recent Reports and Enrolled
   Students cards exactly where Figma puts them). Report the differences found in the log before fixing.
D8 Table header bands: the header row of the Enrolled Students card and the Recent Reports card on Teacher
   Home, and every table where Figma shows a gray header band, has a gray background (measure the Figma
   node; use the existing header token if the value matches, else add a token and document it), bold 12 px
   text and row separators.
D9 Teacher Profile follows figma-teacher-profile.png: header card (avatar, name, "Active Teacher" chip,
   email, contact number, address; right columns Teacher ID, Sex, Date Registered, BirthDate, Barangay,
   Qualification); four stat cards (Total Enrolled Students with "View all students", Submitted Reports with
   "View all reports", Pending Reports with "For approval", Return for Revision with "Review and Revise");
   Recent Submitted Reports table (Report ID, Report Type, Date and Time, Status) with numbered pagination
   (5 per page); Recent Status Activity timeline (date, time, text such as "Report submitted.", "Returned for
   revision.", "Report resubmitted.", "Admin approved the report.") from report versions and reviews. Below
   that layout keep the Round 3 Edit Profile and Account Security sections (compact). Mapping: Teacher ID is a
   display code RIC-{year of created_at}-{id padded to 3}; Report ID is {year}-{id padded to 3}; Barangay is
   the center's name; Date Registered is created_at as MM/DD/YYYY; time as h:mm AM/PM in Asia/Manila;
   Qualification is a new nullable users.qualification column (additive migration, editable in Edit
   Profile); Submitted = the teacher's liquidation reports (any status); Pending = SUBMITTED; Return for
   Revision = NEED_REVISION. Endpoint GET /api/auth/profile/teacher-summary (Teacher only, own data, paginated
   reports and activity). Admin and Parent profiles stay as they are.
D10 Every earlier decision and every business-rule and permission test keep passing.

## 2. Stages
### I1 Admin (budget 4 h)
D1 to D6. Tests first for logic: MiniCalendar (numbers only, no dish text, dot on menu days, today class,
month navigation, click target), dashboard cards (five, order, labels, counts), Quick Actions labels and
targets, Admin Students page (read-only, scoping, search), Recent Reports tabs and empty states, upload card
(button disabled without a file, enabled with a file, chip with remove, .xlsx only), banner shown only when
the month has no menu. Browser: compare Dashboard and Calendar with the Figma images at the three sizes;
no overlapping text and no page-level scroll on the dashboard at 1366x768. Commit.
### I2 Teacher (budget 4 h)
D7 to D9. Tests first: teacher-summary scoping (own data only), counts match the database, pagination,
activity order and texts, ID display codes, Qualification validation and the migration being additive;
header band style class on the tables; Teacher Home cards per the frame. Browser: Teacher Home and Profile
against Figma. Full check in foreground steps. Commit per page.
### I3 Verify and tag (budget 2 h)
Browser audit of every page for the three roles at 1440x900, 1366x768 and 390x844 (no overlap, no sideways
scroll, dashboards fit). Update docs/DEMO_SCRIPT.md and docs/UI_MAP.md. Tests per project, build, smoke test
of the built app on port 3100 (not 3000). Tag v0.9.7-demo. Round 4 summary in docs/POLISH_LOG.md including
what is not verified.

## 3. Playbook additions
- MiniCalendar: a pure function builds the 6-week grid for a month (Sunday first); no external library;
  unit tests for months starting on each weekday and for February in a leap year.
- Do not put FullCalendar inside any card shorter than 400 px.
- File chip: show name and size; remove clears the selection; never upload without the button.
- Pagination: server-side page and pageSize on the teacher-summary reports list; numbered buttons with
  aria-current on the active page.
- Migrations additive and nullable; never edit applied migrations; stop on drift.
- Keep numeric dates MM/DD/YYYY everywhere; times h:mm AM/PM Asia/Manila through the shared formatter.