# RICPortal Polish Plan Round 2 (density, Admin fidelity, Teacher fidelity)

Created Sun 2026-11-08. Demo Tue 2026-11-10 on localhost. CODE FREEZE Mon 2026-11-09 18:00.
Branch demo-polish-2 (from demo-polish). Fallback tag v0.9.3-demo. Do not move any tag.

## 0. Process
Same rules as docs/POLISH_PLAN.md section 0 and docs/SPRINT_PLAN.md sections 2, 3 and 6, and the memory
rules DEC-035 and DEC-042 (one foreground command at a time, one test worker, tests per project, full
check only at the end of G2 and G4). Do not ask questions; use the defaults here; record decisions as
DEC-043 and up; log in docs/POLISH_LOG.md under "Round 2". Commit per stage by file name; never push;
never move tags; check git log -1 --format=%B after each commit. Figma: 89 calls remain, at most 10
per minute, one design-context read plus at most one screenshot per frame; record node ids in
docs/components.md. Use the Playwright tool for browser checks (it works); at each stage take
screenshots and numeric measurements (getBoundingClientRect) and compare with the Figma frame
screenshot at the same width. Do not touch Objective 3. Cut line: G3 (Teacher pages other than
Calendar and Students), then the Admin profile extras, then dashboard polish. Never cut G1 or the tests.

## 1. Decisions (record and update docs)
D1 Two density modes. COMPACT applies at (min-width: 1024px) and (pointer: fine): sizes follow the
   Figma desktop frames (controls 32 to 40 px high, body text 12 to 13 px, labels 12 px, table text 12 px,
   captions 11 px, page titles 20 to 24 px, smaller icons and card padding). COMFORTABLE (touch, or under
   1024 px) keeps the current sizes: tap targets 44 px, inputs 16 px. Implement with CSS variables in
   tokens.css and the components reading them; no per-page hacks. Update client/test/responsive-scan.test.ts
   to allow compact sizes only inside the desktop-fine media block, and record it in DECISIONS.md.
D2 Fluid scale: the reference is the Figma frame scaled to the viewport width. Set the root font size on
   desktop from the viewport width (start with clamp(12px, 0.75vw, 16px) and adjust by measurement) so
   proportions match Figma at 1280, 1366, 1440, 1536 and 1920 px wide. Never let effective body text drop
   below 12 px or captions below 11 px; if the scale would go lower, hold the text size and shrink spacing
   and component sizes instead. Record the final formula and the measurements in docs/tokens.md.
D3 Viewport fit: the shell is 100 dvh (sidebar fixed, content area flex column, footer last). Dashboard
   pages must fit without any scrolling (page or content area) at 1366x768 and larger; below that height
   only the content area scrolls, never the page. Other pages scroll inside the content area, never the
   page, so the sidebar and footer stay put.
D4 Modals and ConfirmDialogs on desktop are centered in the CONTENT area (right of the sidebar), with at
   least 24 px between the dialog and the sidebar and the screen edge. Expose --sidebar-w on :root and use
   it for the dialog inset. Drawers stay on the right. Under 1024 px dialogs are centered on the screen or
   bottom sheets as before.
D5 One SidebarBrand component for every role: the Teacher header proportions are the reference (logo size,
   name and address sizes and spacing); Admin uses the same component and values.
D6 Admin dashboard cards, exactly these labels and this order (use the Figma spelling where it differs only
   by an obvious typo): REGISTER RIC TEACHER, TOTAL ENROLLED STUDENT, REPORT SUBMITTED, ENROLLMENT REPORT
   SUBMITTED, ACCOMPLISHMENT REPORTS SUBMITTED, REPORT FOR REVISION. Counts from the database via
   GET /api/dashboard/summary: registered active Teachers; enrolled students (current school year,
   ACTIVE); reports with status SUBMITTED; reports of type ENROLLMENT with status SUBMITTED; reports of type
   ACCOMPLISHMENT with status SUBMITTED; reports with status NEED_REVISION. If the report type enum lacks
   ENROLLMENT or ACCOMPLISHMENT, add them with an additive migration (no other code uses them). Their
   counts are 0 until Objective 3; list this in docs/SPRINT_SHORTCUTS.md and docs/DEMO_SCRIPT.md. Smaller
   icons and card content; the layout (cards and calendar) follows Figma 267:9689 and fits the screen.
D7 Admin Calendar shows the Upload Menu / Food Rotation control exactly as in the Figma frame (268:11404),
   always visible to the Admin (not only when empty): button opens the import flow (choose file, preview,
   confirm) and links to the import history.
D8 RIC Teachers action column follows Figma: a View Profile button and a status toggle button. The status
   toggle uses the check icon: light when active, dark when disabled, with aria-pressed, a visible word
   (Active or Disabled) and a tooltip ("Active, click to disable"); a disabled row is muted. Edit and
   Reset to default password move inside the View Profile screen for the Teacher (Admin only; reset asks
   for confirmation; default password per D6 of POLISH_PLAN). The View Profile screen follows the Profile
   layout (Developer-designed if Figma has no teacher profile frame).
D9 Profile pages (all roles) follow Figma 88:695 completely: map every field and section to real data
   (name, user id, role, center, address, contact number, username, created date, last login, status and
   similar). For fields with no data source add nullable columns (additive migration) editable by the user
   (for example position and address) when they are plain contact or profile data; skip widgets with no data
   (report cards, tips) and list them in docs/SPRINT_SHORTCUTS.md.
D10 Teacher pages get the same compact density and the Figma content: Home 175:1023, Enrolled Students
   78:260, Add Student 258:5447, Calendar 166:1553 with Today's Menu, Assigned Parents and Purchase Request
   panels exactly as designed, Report Status 78:284, Admin Feedback 78:276, Parent Requests, Profile.

## 2. Stages

### G1 Density, viewport and shared pieces (budget 3 h)
D1, D2, D3, D4, D5. Update tokens.css and components to the density variables; AppShell 100 dvh; footer
last; --sidebar-w; the Modal and ConfirmDialog inset; SidebarBrand shared. Tests: the responsive scan rule
(compact only in the desktop-fine block, 44 px in the touch block), SidebarBrand renders the same values
for Admin and Teacher, dialog CSS uses the sidebar offset. Browser checks at 1280x720, 1366x768,
1440x900, 1536x864, 1920x1080, 768x1024 and 390x844: no page-level scroll on dashboard pages at 1366x768
and up, no sideways scroll anywhere, the Assign Parents modal horizontally centered in the content area
(center x within 2 px of the content area center) with at least 24 px to the sidebar. Commit.

### G2 Admin (budget 5 h)
D6, D7, D8, D9 (Admin) and the dashboard layout. Tests first: summary counts for all six cards against
the database (disabled Teachers and archived students excluded; a NEED_REVISION report counts only in
REPORT FOR REVISION; an APPROVED report counts nowhere); the status toggle (enable and disable) and
reset only through the Admin, with the default password and forced change; Teacher View Profile
permissions; matrix rows; profile column validation. Browser: dashboard at the five desktop sizes fits
without scroll and matches the Figma proportions; teacher status toggle states; upload menu control
works with the fixture; compare each Admin page with its Figma screenshot. Full check in foreground steps.
Commit.

### G3 Teacher (budget 4 h)
D10 in this order: Calendar (with the Assign Parents modal check), Enrolled Students, Add Student, Home,
Report Status, Admin Feedback, Parent Requests, Profile. Compare each with Figma at 1440x900 and 1920x1080
and at 390x844 with the client's mobile frames where they exist; fix differences in layout, density and
content. Tests for any logic you touch. Commit per page group.

### G4 Verify and tag (budget 2 h)
Browser audit of every page for all three roles at the seven sizes: no page scroll on dashboards,
no sideways scroll, no clipped text, no overlapping elements, dialogs centered in the content area,
focus returns after closing dialogs. Fix what you find (one fix per commit). Update
docs/DEMO_SCRIPT.md (new dashboard cards, upload menu, teacher status toggle, View Profile). Run the
tests per project and the build; smoke test the built app on port 3000. Tag v0.9.4-demo. Write the
Round 2 summary in docs/POLISH_LOG.md, including what is NOT verified.

## 3. Bug and error playbook (additions)
- Root font size on html only; components use rem and the density variables; avoid fixed px sizes except
  borders and hairlines.
- 100 dvh layouts need min-h-0 on every flex or grid child that must shrink, and overflow-y auto on the
  content area, not the body.
- Native dialog centered in the content area: dialog with inset: 0 0 0 var(--sidebar-w), margin auto,
  max-width and max-height reduced by the margins; check ::backdrop still covers the screen.
- Do not use vh for heights on mobile; use dvh. Test with the browser window resized, not only at fixed sizes.
- Dashboard fit: grid rows minmax(0, 1fr); card content may shrink (smaller icon) but not overflow.
- Keep contrast tokens, the color scan and the date scan passing; add a token only when Figma shows a value
  that tokens.css lacks and record it in docs/tokens.md.
- Playwright: close the browser at the end of every check; one browser at a time (memory).
- Migrations additive only; never edit applied migrations; stop and report if drift appears.