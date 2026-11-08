# RICPortal Polish Plan Round 3 (Admin and Teacher fidelity, Profiles, Child Records)

Created Sun 2026-11-08. Demo Tue 2026-11-10, localhost. CODE FREEZE Mon 2026-11-09 18:00.
Branch demo-polish-3 (from demo-polish-2). Fallback tag v0.9.4-demo. Do not move any tag.
New tag at the end: v0.9.5-demo.

## 0. Process
Same rules as docs/POLISH_PLAN_2.md section 0 and the memory rules DEC-035, DEC-042 and DEC-047 (one
foreground command at a time, one test worker, tests per project, full check only at the end of H2 and
H4). Do not ask questions; use these defaults; record decisions as DEC-048 and up; log in
docs/POLISH_LOG.md under "Round 3". Commit per stage by file name; never push; never move tags; check
git log -1 --format=%B after each commit. Figma: at most 60 more calls in this round (check
docs/components.md for the count used), at most 10 per minute, one design-context read and at most one
screenshot per frame; record node ids in docs/components.md. Use the Playwright tool for browser checks:
screenshots and getBoundingClientRect measurements compared with the Figma frame at the same width.
Do not touch Objective 3. Cut line: Parent profile extras first, then Teacher Home polish, then the
Progress tab. Never cut H1 or the tests.
Reference image: docs/feedback/admin-profile-figma.png (the Admin Profile frame). Read it first.

## 1. Decisions (record in docs/DECISIONS.md; update docs they change)
D1 Footer: the last child inside the scrolling content area; not fixed, not sticky; margin-top auto so a
   short page keeps it at the bottom of the content area; on long pages it is visible only after
   scrolling to the end. Dashboards still fit the screen without compressing them to show the footer.
D2 Login fields (username and password): larger; height about 3rem, text 15 to 16 px at desktop, matching
   the proportions in Figma 241:1732 (measure the frame); the Login frame spacing otherwise unchanged.
D3 Top bar: the avatar and user name keep at least 12 px from the top and right edges and stay vertically
   centered, as in the Figma header proportions.
D4 Admin Dashboard: clean up to match Figma 267:9689 by measurement (card sizes, gaps, alignment, fewer
   competing borders and shadows). The six cards and their order stay as in DEC for Round 2.
D5 Calendar (Admin and Teacher): the whole month visible without scrolling inside the calendar at 1366x768
   and larger (rows share the height equally, including 6-week months); the CALENDAR sub-heading aligns to
   the left edge of the page header; dish names use up to two lines with an ellipsis, font size 11 to 13 px
   by cell width and never below 11 px, full name in the title tooltip, on focus and in the day panel; no
   horizontal scroll; layout and spacing from Figma 166:1553 and 268:11404.
D6 RIC Teachers: separate icons for Total, Active and Disabled cards exported from Figma; table columns as
   in Figma: replace Last Login with Date Approved (the Teacher account created_at date, MM/DD/YYYY); Last
   Login appears inside View Profile; the status toggle is icon only (check icon light when active, dark
   when disabled) with aria-label, aria-pressed and a tooltip ("Active, click to disable" or "Disabled,
   click to enable"); no visible words on the toggle; disabled rows stay muted.
D7 Profile pages for all roles follow the Figma Profile frames: Admin = the reference image; find the
   Teacher and Parent Profile frames by name in the Figma metadata (one read each; if a role has no frame
   reuse the same layout). Content for Admin: header card (avatar, name, role chip, email, contact number,
   Joined date, Account Status chip); Account Summary (short text, Role, Permissions); System Activity
   (Teachers Managed, Enrolled Students Monitored, Reports Generated = liquidation reports, Logins This
   Month; View All Activity opens the login history); Personal Information with Edit Profile as a modal
   (Full Name, Date of Birth, Email Address, Gender, Contact Number, Address); Account Security (Change
   Password, Password dots with "Last changed N days ago", Two-Factor Authentication and Active Sessions
   shown disabled with "Not available in this version", Login History with View History = last 10 logins).
   Teacher: same layout with Children Enrolled, Parents Approved, Reports Submitted, Logins This Month and
   center details. Parent: a smaller version of the same layout. Dates are numeric MM/DD/YYYY everywhere.
   Footer text from Figma with the year 2026. The notification bell stays omitted (no feature).
   Data, additive migration only: users.email (nullable), gender, date_of_birth, address, password_changed_at
   (nullable); table login_events (id, user_id, created_at, index on user_id and created_at). Insert a login
   event on every successful login; set password_changed_at on every password change or reset. Extend
   GET and PATCH /api/auth/profile (own profile only, Zod-validated, email never used for login or sent
   to), add GET /api/auth/profile/activity (counts scoped to the caller's role and center) and
   GET /api/auth/logins (last 10 of the caller). Admin can view a Teacher's profile through the existing
   View Profile endpoint including last login and Date Approved.
D8 Teacher Home follows Figma 175:1023 exactly: same rows, order and positions; the Report Tracking and
   Admin Feedback cards replace "Recent Reports" (real data: own liquidation submissions with their status,
   Admin feedback entries); the Enrolled Students preview sits below the calendar row as in Figma, not beside
   it; the mini calendar shows the whole month (all 28 to 31 days, 5 to 6 weeks); cleaner spacing.
D9 Enrolled Students: the button is "Export List" as in Figma and downloads the official Enrollment Form PDF of
   the current school year (the school year and date started stay as options inside it); remove the separate
   "Enrollment Form" button.
D10 CHILD RECORDS: new Teacher sidebar item at the position and with the label in Figma; page(s) from the
   Figma Child Records frames: the center's children with their record counts, and the Child's Record detail
   with tabs Conferences, Home Visits and Progress (build the Progress tab UI that was cut earlier), add,
   edit and delete entries through the existing child-records API; Teacher only (Admin keeps read access
   through the student pages). Update nav tests (labels and order per role).
D11 All earlier decisions and every business-rule and permission test keep passing.

## 2. Stages
### H1 Shell fixes, Admin pages (budget 3 h)
D1 to D6. Tests first where logic exists: nav and footer structure (the footer is inside the scrolling
container and has no fixed or sticky classes), login field size tokens, header spacing, calendar title
clamp class, RIC Teachers columns (Date Approved from created_at; Last Login not in the table), the status
toggle accessible name and aria-pressed, no visible status words. Browser: compare Admin Dashboard,
Calendar and RIC Teachers with Figma at 1366x768, 1440x900, 1920x1080 and 390x844. Commit.
### H2 Profiles and data (budget 3 h)
D7. Tests first: migration additive; profile fields validation; only the owner edits their profile; email is
not accepted as a login; password_changed_at set on change and reset; login_events recorded on login only on
success; activity counts match the database and are scoped; the last 10 logins; Admin sees a Teacher's
Date Approved and Last Login; permission matrix rows. Browser: Admin, Teacher and Parent Profile against
Figma. Full check in foreground steps. Commit.
### H3 Teacher pages (budget 4 h)
D8, D9, D10. Tests first: Home cards use real scoped data; Export List returns a PDF for the current school
year; Child Records scoping (own center only) and the Progress tab; nav labels and order per role. Browser
compare with Figma at 1440x900, 1920x1080 and 390x844. Commit per page group.
### H4 Verify and tag (budget 2 h)
Browser audit of every page for all three roles at the seven sizes from Plan 2 (no page-level scroll on
dashboards, no sideways scroll, no clipped text, dialogs centered in the content area); fix findings, one
fix per commit. Update docs/DEMO_SCRIPT.md. Tests per project, the build, a smoke test of the built app on
port 3000 started from the current build (stop any old server first). Tag v0.9.5-demo. Write the Round 3
summary in docs/POLISH_LOG.md including what is NOT verified.

## 3. Playbook additions
- Footer inside the scroll container: the content area is a flex column with min-h-0 and overflow-y auto;
  the page body inside it is flex-1; the footer last. Never position the footer fixed or sticky.
- Line clamping: -webkit-line-clamp 2 with display -webkit-box and overflow hidden; give FullCalendar event
  elements the full text in the title attribute; test at 6-week months (for example Aug 2026 and Nov 2026).
- Icons: export from Figma as small PNG or SVG, under 30 KB each; always alt text or aria-hidden.
- Icon-only buttons need aria-label and a tooltip, min 44 px target on touch.
- Migrations additive and nullable; stop and report on drift; never edit applied migrations.
- Profile edits: ignore unknown fields, trim strings, validate lengths and formats with shared Zod schemas.