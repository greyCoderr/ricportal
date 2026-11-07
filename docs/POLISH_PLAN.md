# RICPortal Demo Polish Plan (Figma fidelity, Parent flow, fixes)

Created Sat 2026-11-07. Demo Tue 2026-11-10 on localhost. CODE FREEZE Mon 2026-11-09 18:00.
Branch demo-polish (from demo-sprint). Fallback: tag v0.9.0-demo.

## 0. Process
Same rules as docs/SPRINT_PLAN.md sections 2, 3 and 6, plus the memory rules DEC-035 (one foreground
command at a time, 2 test workers, targeted checks, full check only at the end of F2, F4 and F6).
Do not ask me questions; use the documented defaults and record decisions as DEC-037 and up. Log in
docs/POLISH_LOG.md (plan at the top of each stage, summary at the end). Commit per stage with git add
by file name; never push; check git log -1 --format=%B after commits. STOP only for the blockers in
SPRINT_PLAN section 2. Figma: at most 120 calls in total, at most 10 per minute; one design-context
read per frame plus at most one screenshot per frame; record every node id in docs/components.md and
docs/figma-inventory.md. The client allowed using the images, logos and layouts from the Figma file:
export the assets (logo, emblem, login photo, icons) with the Figma tools into client/src/assets with
clear names, keep each under 300 KB, and record this permission as a decision. Only assets from the
client's own Figma file.
Method for "same as Figma", for every page: (1) read the desktop and mobile frames; (2) write layout
notes in docs/ui-specs/<page>.md (structure, sizes, texts exactly as in Figma); (3) build with the
existing components and tokens; add a token only when Figma shows a value that tokens.css lacks and
record it in docs/tokens.md; (4) use the exact labels and texts from Figma with real data;
(5) responsive like the client's mobile frames; where no mobile frame exists, stack columns under
768 px; (6) if the Playwright tool works (check once, at most 3 minutes), take screenshots at
1440x900 and 390x844 and compare them with the Figma screenshot, otherwise list what the Developer
must compare. Where Figma and an earlier decision differ: Figma wins on layout and labels, the
decisions below win on business rules.

## 1. Decisions (record in docs/DECISIONS.md and update the blueprint rows they change)
D1 Image permission granted by the client (see above).
D2 A Parent sees the WHOLE calendar of their own center (menu names and the assigned parents' names
   on every day) but sees purchase request details and can edit only on days they are assigned to.
   Replaces A-06 and DEC-024 for visibility.
D3 Parents may add, edit and delete ingredient rows on their assigned days while the day is OPEN:
   edit unit, quantity, unit cost and description of any row; delete only rows they created. The
   Teacher may edit or delete any row. Rows keep created_by (add an additive column if missing).
   Budget, child count and rate stay hidden from Parents. Replaces A-14 and BR-12 for Parents.
D4 Weekly assignment: a week (Monday to Sunday) has a team of at most 4 distinct approved parents of
   the Teacher's center; each feeding day gets zero to four parents from that team. One endpoint saves
   the whole week in one transaction (PUT /api/assignments/week).
D5 The Summary of Disbursement table (date, particular, statement of market purchase no., total)
   moves into the Liquidation Forms overlay (Summary tab). The calendar page keeps the Figma layout
   with a one-line month summary linking to the overlay.
D6 Default password: setting DEFAULT_PASSWORD, default RICPortal2026! for development and the demo
   (production must set its own). Reset by the Admin (Teachers) or the Teacher (Parents) sets it and
   forces a change at next login; no password is logged or returned except the message that it was
   reset. When creating an account the password field is optional; blank means the default.
D7 Numeric dates: every birthdate and every date in tables, forms and PDFs is MM/DD/YYYY; long dates
   only in headings. One shared formatter. Inputs use a masked text field MM/DD/YYYY (valid dates
   only); the API keeps YYYY-MM-DD.
D8 Disabled users: red "Disabled" badge with a muted row, the action button reads Enable; never color
   alone. Applies to Teachers and Parents lists.
D9 Student form: copy the Figma "add enroll" layout and all its sections and tables. Fields that
   already exist keep their columns; the extra Figma fields (family members, disabilities and so on)
   go in one nullable TEXT column profile_extra holding JSON validated by a Zod schema. Record the
   field mapping in docs/ui-specs/student-form.md and flag it for client confirmation (A-17).
D10 Navigation labels, exactly as in Figma. Admin: DASHBOARD (HOME), CALENDAR, REPORTS, RIC TEACHERS,
   PROFILE, LOGOUT. Teacher: HOME, ENROLLED STUDENTS, CALENDAR, SUBMIT REPORT, REPORT STATUS, ADMIN
   FEEDBACK, PARENT REQUESTS, PROFILE, LOGOUT. Parent: use the Figma Parent frames; at least CALENDAR,
   PROFILE, LOGOUT. Pages for unbuilt Objective 3 features: Admin DASHBOARD shows real counts (RIC
   Teachers, enrolled students, reports by status) using the Figma cards; Admin REPORTS shows the
   liquidation queue; Teacher REPORT STATUS shows own liquidation submissions with status; ADMIN
   FEEDBACK lists Admin feedback on returned reports; SUBMIT REPORT is a clear "Coming soon" page
   (Objective 3). Mark each in docs/SPRINT_SHORTCUTS.md.
D11 Every role has a Profile page (name, username, role, center, mobile; edit name and mobile; change
   password), in the Figma Profile layout, or the same layout for roles without a frame.
D12 Sidebar: client logo, organization name and address from Figma; the sidebar is fixed to the
   viewport height (sticky, full height), the menu scrolls inside it, and LOGOUT is pinned to the
   bottom of the viewport, not the page.
D13 Desktop pages have the footer from Figma (read it). If Figma has none, use "Municipal Agriculture
   Office, Libmanan, Camarines Sur. RICPortal 2026.". The footer sits at the bottom of the page
   (page is a column with min height 100 dvh).

## 2. Stages (in order)

### F1 Shell (budget 3 h)
Assets and tokens; Login restored with the Figma photo and emblem; role sidebars with logo, name,
address and the exact labels; pinned logout; footer; Profile page for all roles; mobile shell like
the Figma mobile frames (top bar plus menu drawer under 1024 px); 403 and 404 pages consistent.
Tests: nav items per role (exact labels and order); a Parent cannot see Teacher or Admin links; the
Profile page edit and password change; layout classes for the pinned logout.

### F2 Calendar, assignment, Parent flow (budget 6 h)
Read the Figma calendar frames for Admin, Teacher (desktop and mobile) and Parent (393:1133). Build
the calendar page like Figma: calendar plus the Today's Menu, Assigned Parents and Purchase Request
panels exactly as designed. Add the Assign Parents icon button and modal: Step 1 pick the week team
(up to 4, dropdowns of approved parents shown as "Full name (username)"), Step 2 a day-by-parent
checkbox grid with the dish names, an "Apply to all days" action, a count per day, a warning for days
with no parent, and one Save. On phones one card per day. Parent calendar shows the whole center;
Parent day screen lets Parents add, edit and delete rows per D3. Move the Summary table into the
overlay (D5).
API and rules: PUT /api/assignments/week and the week GET; parent purchase request visibility and
edit rules; assigned parents' names visible to the Parents of the center.
Tests first: a 5th team member is rejected; parents must be approved and from the same center; day
parents must belong to the team; week boundaries Monday to Sunday; non-feeding dates rejected;
Parent sees all menus but a Parent response for an unassigned day's purchase request is 403 or 404;
Parent adds a row, edits any row on an assigned day, deletes only own rows; Teacher can delete any
row; locked or submitted days block Parent changes; budget fields never in Parent responses;
version conflict 409; transaction rollback leaves no partial week; permission matrix rows.

### F3 Students (budget 5 h)
Enrolled Students page like Figma (columns, search, filters, actions, pagination, mobile cards).
Add and Edit Student form like Figma "add enroll" (all sections and tables) with profile_extra.
Numeric birthdate everywhere including the Enrollment Form PDF. Update the profile page to show the
new fields.
Tests first: profile_extra validation (valid, wrong types, too large); birthdate parsing and
formatting MM/DD/YYYY (invalid dates such as 02/30/2020, leap day 02/29/2024, year boundaries);
the PDF shows numeric dates; scoping unchanged.

### F4 Admin pages and passwords (budget 4 h)
RIC Teachers page like Figma (table, search, add, disabled indicator, reset to default). Reports page
like Figma (liquidation queue, detail with the Stamp, filters by status). Admin Home dashboard like
Figma with real counts (small endpoint GET /api/dashboard/summary, Admin only, grouped queries).
Default password per D6 for Teachers and Parents.
Tests first: reset sets the default and forces a change; create with a blank password uses the
default; Admin resets only Teachers, a Teacher only Parents of their center; no password in logs or
responses beyond the confirmation; the dashboard counts match the database (disabled teachers and
archived students excluded); permission matrix rows.

### F5 Teacher pages (budget 2 h)
Teacher Home, Report Status, Admin Feedback and Parent Requests like Figma; Submit Report placeholder.
Tests: Report Status shows only own submissions; Admin Feedback shows only own center's feedback.

### F6 Responsive pass, fixes, demo readiness (budget 4 h)
Check every page at 360, 390, 768, 1024, 1280, 1440 and 1920 px: no horizontal page scroll, tap
targets at least 44 px, tables become cards or scroll inside their own container, drawers become
bottom sheets, the sidebar becomes the mobile menu. Fix every item the checks find. Update the demo
seed (4 parents for one center, a week team, partly filled rows by both roles) and docs/DEMO_SCRIPT.md.
Run the full check in foreground steps. Tag v0.9.1-demo.

CUT LINE if time runs out: cut F5 first (keep functional pages, plain style), then the Admin Reports
restyle, then the Admin dashboard counts. Never cut F2 or the tests for F2 and F4.

## 3. Bug and error playbook (additions)
- Images: import assets from client/src/assets through Vite, always with alt text; CSP img-src allows
  'self' and data:; keep each file small (export at 2x, under 300 KB).
- Sticky sidebar: aside with height 100 dvh, sticky top 0, flex column; the nav list scrolls
  (overflow-y auto); logout has margin-top auto. Footer: the layout is a flex column with min-height
  100 dvh and the footer last with margin-top auto.
- FullCalendar: style through tokens and CSS classes, no inline colors; allDay events with date-only
  strings; keep editable false.
- Dates: one formatter module (numeric MM/DD/YYYY); never new Date(string); tests in TZ=UTC and
  TZ=Asia/Manila.
- MariaDB: store profile_extra as TEXT, parse and validate with Zod at the edge; do not use the Json
  type.
- Migrations additive only; if a column already exists do not duplicate it.
- Responsive: test at the widths listed in F6; use min-w-0 and overflow-x auto containers for tables.
- Keep every endpoint on the standard response and error shapes with scope and role checks.