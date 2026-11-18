# RICPortal Demo Polish Log

Plan: docs/POLISH_PLAN.md. Branch demo-polish. Fallback tag v0.9.0-demo. Code freeze Mon 2026-11-09 18:00.

Environment check, 2026-11-07: on branch demo-polish; MySQL listening on 3306. The Developer's
uncommitted .claude/settings.json and "server/test/fixtures/SF MENU for 30 days.xlsx" are not part of
this work and stay out of every commit. Playwright MCP failed to connect at session start (30 s
timeout), so the screenshot comparison goes to the Developer's hand-check list unless it comes back.

## F1 Shell

Plan:
1. Open a Figma session; read Login, the sidebars (Admin, Teacher, Parent), Profile, footer, mobile shell.
2. Write layout notes in docs/ui-specs/shell.md and record every node id.
3. Export the logo, emblem and login photo into client/src/assets (under 300 KB each).
4. Record decisions D1 to D13 as DEC-037 and up; update the blueprint rows they change.
5. Tests first: nav labels and order per role, Parent sees no Teacher or Admin links, pinned logout classes.
6. Nav per D10 and sidebar per D12 (sticky, 100 dvh, scrolling menu, pinned logout).
7. Footer per D13; mobile shell (top bar and drawer under 1024 px).
8. Login restored with the photo and emblem (D1 replaces the DEC-034 photo and emblem removals).
9. Profile page for all roles (D11), with its API and tests; consistent 403 and 404 pages.
10. Targeted checks (DEC-035), docs, commit by file name.

Summary (F1 done, 2026-11-07):

- Built: 19 client assets from Figma, role sidebars with the exact D10 labels, pinned logout, footer, mobile top bar and drawer, Login with photo, emblem and waves, Profile for all roles with `GET` and `PATCH /api/auth/profile`, one layout for 403 and 404, Submit Report and Admin Feedback placeholders.
- Tests: 7 new profile API tests were seen failing first, then passing. New shell and Profile page tests. Targeted runs: 305 database tests (profile, permissions, auth) pass, the client shell, auth and scan tests pass, and typecheck and changed-file lint are clean. The full check is next at the end of F2 (DEC-035).
- Tests changed because the requirement changed, not to make them pass: `layouts.test.tsx` used the old menu (Centers, title-case labels, "Log out") and is rewritten to D10's exact labels and order. The ParentLayout test went with the component, and Parent menu tests replace it (DEC-037).
- Decisions: DEC-037. Blueprint rows BR-05, BR-12, BR-14, A-06, A-14, A-17 updated.
- Not seen in a browser: the Playwright tool is not connected, and this session has no other browser check. Developer, please compare at 1440x900 and 390x844: Login against 241:1732 and 393:1102; sidebars against 166:910 and 267:9689; Profile against 88:695; footer against 268:10479. Check that LOGOUT stays at the bottom while the page scrolls.
- Known issue to check by eye: the waves image may need its position adjusted on wide screens.

## F2 Calendar, assignment, Parent flow

Plan:
1. Additive migration: `purchase_items.created_by` and a table for the week team.
2. Tests first: week rules (5th member, approved, same center, team membership, Monday to Sunday, non-feeding dates, rollback), Parent row rules, Parent visibility, matrix rows.
3. `GET` and `PUT /api/assignments/week`; the old per-day PUT stays but cannot break the limit of 4.
4. `/api/parent-schedule` returns the whole center (D2), with status only on assigned days.
5. Parent add, edit, delete per D3; `canDelete` on each row, computed on the server.
6. Calendar like Figma: month title, weekday bar, today fill, grid on phones too, selected day panels (Today's Menu, Assigned Parents, Purchase Request).
7. Assign Parents modal: Step 1 team of up to 4, Step 2 day by parent grid, Apply to all days, counts, warnings, one Save, cards on phones.
8. Parent calendar and Parent day screen with add, edit, delete.
9. Summary one-liner on the calendar linking to the overlay (D5); correct the DEC-037 note on the phone top bar and rebuild it from 378:15722.
10. Full check in foreground steps, docs, commit.

Summary (F2, 2026-11-07):

- Built: `GET` and `PUT /api/assignments/week` with the week team table; the per-day PUT keeps to D4; the Parent schedule returns the whole center (D2); Parents add, edit and delete rows (D3) with `canDelete` from the server; the calendar like Figma with day panels; the Assign Parents modal (two steps, Apply to all days, counts, warnings, one SAVE); the shared Purchase Request table; the D5 summary line; the phone top bar from 378:15722.
- Tests first: 31 week and Parent tests, 27 seen failing before the code, then all passing, including rollback. Client tests for the modal, Parent screen and calendar helpers.
- Tests changed because D2 and D3 replace the old rule, not to make them pass: in `purchase.db.test.ts`, the Parent rename test now expects 200 and the rename to stick; "a Parent cannot add or delete" keeps the delete, open, lock and unlock refusals, and adding moved to the new D3 tests; the schedule test now filters on `assigned`. In `demo-flow.test.ts`, the schedule check filters on `assigned`. `ParentDayScreen.test.tsx` is rewritten for the table and the D3 actions. The matrix now allows a Parent on item add and delete.
- Removed: the `/assignments` page and AssignParentsDialog, replaced by the modal.
- Decisions: DEC-038. The DEC-037 note on the phone top bar was wrong and is corrected.
- Not seen in a browser: FullCalendar needs a real browser, so the jsdom tests cover only its helpers. Developer, please check at 1440x900 and 390x844: the calendar against 166:1553, 393:1133 and 378:15722; tapping a day; the check mark on a Parent's days; the modal on a phone.
- Full check at the end of F2: typecheck, lint and format clean, 1070 tests pass in 65 files, build succeeds. The build warns that the main script is over 500 kB (759 kB, 225 kB gzipped). Harmless on localhost for the demo.

## F3 Students

Plan:
1. Tests first: MM/DD/YYYY parsing and formatting (02/30/2020, leap day, year ends, mask), `profile_extra` validation (valid, wrong types, unknown keys, too large), API round trip and scoping, numeric dates in the PDF.
2. Additive migration: `students.profile_extra` TEXT, validated with Zod at the edge.
3. One shared date module in `shared`; the PDF helper and all screens use it.
4. DateInput: masked MM/DD/YYYY text field; replaces every `type="date"` input.
5. Student form as a page like Figma 258:5447, with all sections and tables.
6. Enrolled Students like 78:260: columns, search, status filter, actions, year cards, phone cards.
7. Profile page shows the new fields.
8. docs/ui-specs/student-form.md with the field mapping, flagged for the client (A-17).
9. Targeted checks, docs, commit. Full check is at the end of F4 (DEC-035).

Summary (F3, 2026-11-07):

- Built: `profile_extra` with its Zod schema; one shared date module (format, parse, mask) used by screens and PDFs; DateInput replaces every date picker; the student form as a page with all Figma sections and tables; Enrolled Students like 78:260 (columns, search, status filter, edit and archive, year cards, phone cards); the profile shows the new fields.
- Tests first: 55 date and `profile_extra` tests, 49 seen failing before the code, then all passing. The date tests also passed with TZ=UTC and TZ=Asia/Manila. 11 API tests for the round trip and scoping, client tests for DateInput and the form helpers. Targeted runs are green; full check is at the end of F4.
- Test timeout raised for two tests only: "a server duplicate lands under the field" and "closes after a successful save" in `StudentForm.test.tsx`, to 120 s, with their waits at 15 s. Run alone they pass in 19 to 27 s because the page has about 100 fields and each `getByLabelText` scans them all. They failed at 15 s only on time. Nothing in them was weakened.
- Tests changed for the new layout: `StudentForm.test.tsx` now clicks the Female radio and types MM/DD/YYYY into "5a. Date of Birth".
- Decisions: DEC-039. Field mapping for the client: docs/ui-specs/student-form.md.
- Not seen in a browser. Developer, please compare at 1440x900 and 390x844: the list against 78:260, the form against 258:5447. The family table is the tightest part at desktop widths.

## F4 Admin pages and passwords

Plan:
1. Tests first: reset sets the default and forces a change; blank password on create uses the default; Admin resets only Teachers, a Teacher only Parents of their center; no password in logs or responses; dashboard counts against the database; matrix rows.
2. DEFAULT_PASSWORD setting (required in production, default for development and the demo).
3. Reset and create stop returning passwords; a plain confirmation instead.
4. `GET /api/dashboard/summary` (Admin only, grouped queries).
5. Filters on `GET /api/teachers` (q, status, centerId) and `GET /api/reports` (status).
6. RIC Teachers like 267:9862: cards, search, filters, disabled rows per D8, reset to default.
7. Reports like 268:12661: status cards, queue table, filter panel; the detail keeps the Stamp.
8. Admin dashboard like 267:9689 with real counts; Calendar upload banner like 268:11404.
9. Table renders cards on phones, so all these lists follow the phone frames.
10. Full check in foreground steps, docs, commit.

Summary (F4, 2026-11-07):

- Built: DEFAULT_PASSWORD; reset and create no longer return any password (D6); `GET /api/dashboard/summary`; filters on teachers and reports; RIC Teachers like 267:9862 with disabled rows per D8; Reports like 268:12661; Admin Dashboard like 267:9689; the Calendar upload banner like 268:11404; `cardsOnPhone` on Table.
- Tests first: 25 password and dashboard tests, 20 seen failing before the code, then all passing. They include a log capture proving no password reaches the logs, the reset rights for each role, and dashboard counts checked against the database. Client tests for the Teachers page and the dashboard.
- Tests changed because D6 replaces the old rule, not to make them pass: in `accounts.db.test.ts` and `demo-flow.test.ts` the login now uses the default password in place of the temporary one from the response. `env.test.ts` adds DEFAULT_PASSWORD to the production list. The matrix adds the dashboard row.
- Removed: TemporaryPasswordDialog.
- Decisions: DEC-040. **Set your own DEFAULT_PASSWORD before any real deployment.**
- Not seen in a browser. Developer, please compare at 1440x900 and 390x844: Teachers against 267:9862 and 378:16285, Reports against 268:12661 and 378:15917, Dashboard against 267:9689.
- Full check at the end of F4: typecheck, lint and format clean, 1189 tests pass in 74 files, build succeeds. The test run took 610 s, past the 600 s foreground limit, so it finished as a background task with nothing else running.

## F5 Teacher pages

Plan:
1. Tests first: Report Status shows only own submissions; Admin Feedback shows only the own center's feedback.
2. `GET /api/reports/feedback` (Teacher, own center, paginated).
3. Teacher Home like 175:1023 with real counts, quick actions, calendar, recent reports and students.
4. Report Status like 78:284: list and Selected Report Details with the status steps and feedback.
5. Admin Feedback like 78:276: cards, records, selected details.
6. Submit Report stays the clear "Coming soon" page; Parent Requests was done in F4.
7. Targeted checks, docs, commit. Full check is at the end of F6.

Summary (F5, 2026-11-07):

- Built: `GET /api/reports/feedback`; Teacher Home like 175:1023; Report Status with Selected Report Details like 78:284; Admin Feedback like 78:276. Submit Report stays "Coming soon".
- Tests first: 7 scoping tests, 5 seen failing before the code and all passing after. The 2 that passed at once cover own-center report scoping, which already worked, and lock it in. Targeted runs are green; full check is at the end of F6.
- Decisions: DEC-041.
- Not seen in a browser. Developer, please compare at 1440x900 and 390x844 against 175:1023, 78:284 and 78:276.

## F6 Responsive pass, fixes, demo readiness

Plan:
1. Check once for Playwright (not connected, so no browser checks) and log it.
2. Source audit for the failure patterns the plan lists; fix each finding; add scan tests so they stay fixed.
3. Demo seed: 4 parents, a week team, rows by both roles.
4. docs/DEMO_SCRIPT.md for everything F1 to F5 changed, with the hand-check list.
5. Full check in foreground steps, docs, commit, tag v0.9.1-demo.

Findings fixed:

| Finding | Where | Fix |
| --- | --- | --- |
| Buttons 32 px high, under the 44 px tap target | Pagination, Centers, SaveState Retry, Liquidation overlay, report detail, Child's Record rows | Default 44 px size. The `sm` variant stays in the kit (DEC-028 and its test) but no screen uses it |
| Back links and report links too small to tap | Report detail, student profile, reports list | `min-h-11` |
| "Welcome Back" had a -100 px margin inside a clipped column, so it would be cut off near 1024 px | Login | Removed the margin; the heading stays at the column's left and the form is centered |
| Nine family columns from 768 px, about 75 px each | Student form | Cards until 1280 px; address rows get five columns from 1024 px |

Already in place from F1 to F5: tables are cards under 768 px or scroll inside their own region, drawers are bottom sheets under 768 px, the sidebar is the menu under 1024 px, `min-w-0` on page columns.

New guard: `client/test/responsive-scan.test.ts` (no 32 px buttons on screens, no native date pickers, no fixed width over 360 px, a capped phone drawer, no clipped negative margins). It failed on 3 of 5 rules before the fixes, and passes now.

**Not done as the plan asked:** the width-by-width check in a browser (360 to 1920 px). The Playwright server failed to connect at session start and no other browser tool is available here. The source audit above is a substitute and can miss visual problems. docs/DEMO_SCRIPT.md has the list for the Developer.

Summary (F6, 2026-11-07):

- The first final test run was stopped by the system for low memory and gave no result. It was then run per project on one worker (DEC-042).
- Checks: unit 297 of 297 in 55 s; db 519 of 519 in 273 s; client 396 of 396 in 328 s; 1212 tests in all. Typecheck, lint and format clean. Build succeeds; the main script is over 500 kB, which is harmless on localhost.
- **One intermittent failure, cause not proven.** The first db run failed 1 of 519: "a Parent adds a row, which keeps who created it" in `assignments-week.db.test.ts` got 404 where it expected 201. The file passed alone (31 of 31), and the whole db project passed on the rerun. That group's `beforeEach` did not check its own save, so a failed save would look exactly like this 404, but this was not observed. The setup now asserts that the save returned 200 and prints the answer, so a repeat will show the real cause. Nothing was weakened and no timeout changed.
- Smoke test of the built app on port 3000 (`npm start`), read-only apart from login times, 14 of 14: `/`, the built script, the SPA fallback, `/api/health` (db up), login as admin, teacher.sibujo and parent1, the calendar API for November as Admin and Teacher (30 days), the Parent schedule (30 days, 5 assigned, no budget fields), the Enrollment Form PDF (starts with %PDF, 8760 bytes), the dashboard summary, and 403 for a Parent on the dashboard.
- The smoke test used the demo data already in the local database. **The new seed was not run on it**, because it clears Sibujo's data. The seed itself is tested on the test database. Run `npm run db:seed:demo` on demo morning.
- The server logs two notices from the PDF library when a PDF is made: no URL or local access policy is defined. This was not looked into. BACKLOG item for hardening.
- Docs: DEMO_SCRIPT has the new pages, the Assign Parents flow, the Parent flow, the default password reset and a short visual checklist. DEC-042.
- The browser check was not part of the tag v0.9.1-demo. It ran afterwards; see below.

## Polish summary

F1 to F6 done on branch demo-polish, tag v0.9.1-demo, not pushed. 31 of 120 Figma calls used. Decisions DEC-037 to DEC-042. Nothing was started on Objective 3 beyond the placeholders D10 asks for.

## Browser check after the tag (2026-11-07)

Asked for by the Developer. Playwright against the built app on port 3000, with the demo data already in the local database. Nothing was saved: no write requests other than login and logout were sent.

Audit: 18 pages across the three roles at 360, 390, 768, 1024, 1280, 1440 and 1920 px, measuring sideways page scroll, tap targets under 44 px up to 768 px, and page errors. 31 scripted interactions.

Bugs found that the tests could not see, all fixed:

| Bug | Cause | Fix |
| --- | --- | --- |
| Login page dark gray, with unreadable text | The Figma export of the waves had an opaque background | Background removed. In F1 the asset was viewed and the dark color was wrongly taken for how transparency displays |
| Dark boxes behind the footer logos | Same, on three logos | Background removed |
| Page scrolled 68 px sideways on Enrolled Students at 360 and 390 px | The hidden hover label of the row icons stuck out | Label removed under 768 px |
| Day button only 8 px wide, so cells were hard to tap and the selection ring was tiny | FullCalendar's number link is position relative | Number link made static; the button fills the cell (154x90 on desktop, 48x61 on a 390 px phone) |
| Today not filled | FullCalendar's rule won | More specific rule |
| Focus lost after closing a modal or drawer | Screens remove the dialog without closing it | Restored in useNativeDialog; test seen failing first |
| Organization name and ENROLLED STUDENTS wrapped in the sidebar | Too little room | Spacing changed, no wrapping |
| MM/DD/YYYY clipped in the family table at 1440 px | Nine columns | Cards until 1536 px |
| Dashboard cards wrapped to two rows | Breakpoint | One row from 1280 px |

Also a bug in my own first fix: the day number sat on top of the dish, because a button centers its content. Fixed and rechecked.

Confirmed working in the browser: LOGOUT stays at the bottom while scrolling, and the menu scrolls inside the sidebar on a short window; the phone menu opens, and closes on a choice, Escape or a backdrop tap; the Assign Parents modal (four dropdowns, no parent offered twice, Step 2, CANCEL, Escape) fits a phone and SAVE can be reached; the masked date field refuses 02/30/2020 and accepts 02/29/2024; a Parent sees check marks on their own days and "not assigned" on others, with no budget text; clicking a cell or a dish, and Enter on a dish, select the day.

Results of the final run: no page scroll and no small tap target in the audit of 126 views. One thing to know about that run: it hit the server's limit of 5000 requests in 15 minutes on its last view, because every image counts. Only Parent Profile at 1440 and 1920 px were affected. They were rechecked and pass. After the later fixes, Calendar, Enrolled Students and the student form were audited again at all seven widths, with no findings and no 429. A demo will not come near this limit.

The 16 px gap at the calendar's right edge in the first screenshots was an artifact of full-page capture, where the scrollbar goes away. The grid is correct in the real viewport.

Checks after the fixes: typecheck and lint clean, client project 398 of 398 on one worker, build succeeds. The unit and db projects were not rerun, because only client files changed since they passed.

Not checked:

- Saving in the browser. Done afterwards; see "Save flows and report pages" below.
- Pages with report data. Done afterwards; see "Save flows and report pages" below.
- The new demo seed on the local database.
- Figma was compared by eye from screenshots, not measured.
- Real phones, and browsers other than Chromium.
- The PDFs next to the official forms.

Open: port 3000 was still held by a server after the last `npm start` was stopped, probably that session's node process surviving. A check that would identify it was refused by the permission system, so it was left running. It serves the current build. Close it, or restart the laptop, before `npm start` on demo day.

## Save flows and report pages (2026-11-07)

Asked for by the Developer. Playwright against the built app on port 3000, saving to the local database through the real screens.

Passed:

- Accounts: add a Teacher with a blank password, disable and enable, reset to the default password, forced change on login. Parent sign-up, the pending message, approval, login, reset and disable.
- Students: the full form with a family row, profile fields, edit, conference note, archive and restore, Enrollment PDF, Profile edit.
- Feeding: Assign Parents SAVE, Apply to all days, autosave, Price and Total, the budget warning, the bad number message. Teacher deletes a Parent's row. A Parent adds, edits and deletes only their own row, and sees no budget. An unassigned Parent gets 404. Two browsers on one row: the second save is refused and the row refreshes. Lock, the Parent's banner, No feeding, Unlock.
- Reports: a refused submit shows its message. PR, Summary and Transmittal PDFs. Submit, the 409 on unlock after submit, Report Status, Home counts, dashboard, filters. Need Revision refuses blank feedback. Admin Feedback, resubmit as version 2, Approve, the Admin's 403 on day edits, the 409 on an approved day.

Three checks in the first report run failed because the script searched for uppercase stamp text, which is uppercase only through CSS. Two earlier failures were also script mistakes: a wrong button label, and a check that ran behind an open modal. All were rerun or confirmed from later steps and the API.

Bugs found and fixed:

| Bug | Fix |
| --- | --- |
| Report detail showed YYYY-MM-DD | formatDate. A new source scan fails on raw period dates; it was seen failing first |
| Menu Imports showed YYYY-MM-DD in the preview, the overlap warning and History | formatDate. The overlap warning line was changed but not seen in the browser |
| Reports hid Status and Actions at 1440 px, because the filter panel squeezed the table | The panel sits beside the table only from 1720 px. The first attempt, 1536 px, still cut off Status when rechecked |
| Report link only 20 px tall at 768 px | 44 px until 1024 px |

Reports after the fix: the table fits for both roles from 1366 px up, and for the Teacher from 1280 px. It still scrolls inside its own box for the Admin at 1024 px (333 px) and 1280 px (77 px), and for the Teacher at 1024 px (159 px). The page itself does not scroll sideways. The Admin can open a report from its title when the eye icon is out of view. Measured with one report row.

Re-seeding: a new test on the test database runs a whole rehearsal (new Teacher, new Parent, assignment, a row, submit, Need Revision, resubmit, Approve), then seeds, and confirms the demo state is back. The seed was not re-run on the local database.

Checks: typecheck and lint clean before the last layout change, which only changed class names. Client project 399 of 399 on one worker after it, demo-seed test file 7 of 7, build succeeds. The full unit and db projects were not rerun, because only this test file changed on the server side.

Local database after this check: it holds practice data (teacher.bahay, rosa.demo, student Delos Reyes, an approved report, locked days). `npm run db:seed:demo` clears the data of the demo center and teacher.bahay; rosa.demo belongs to Sibujo and goes with it.

## The intermittent 404 in assignments-week.db.test.ts (2026-11-07)

Eight separate runs of the file in a row, on one worker, after v0.9.3-demo. Each run: 31 of 31 passed.

Result: not reproduced in 8 runs; assertion kept.

The cause of the one failure seen in F6 is still unknown. The assertion in the setup prints the real answer if it comes back.

# Round 2 (docs/POLISH_PLAN_2.md)

Branch demo-polish-2, confirmed with git status and git branch before starting. `.claude/settings.json` and the untracked `server/test/fixtures/SF MENU for 30 days.xlsx` were already there and are not committed by this round.

Setup notes:
- The plan says to number decisions from DEC-043, but DEC-043 already exists. This round starts at DEC-044.
- The Playwright MCP server timed out on connect in this session (CONNECT_TIMEOUT, 30 s). Browser checks run through the same Playwright package from the local npx cache, driven by a script outside the repository. Nothing is added to the project.

## G1 Density, viewport and shared pieces

Plan:
1. Root font size only on html, inside one desktop-fine media block. Figma frames are 1920 x 1080.
2. Text tokens get rem values with floors in that block; comfortable values stay as they are.
3. A `compact` variant for the same media query, so no page repeats it.
4. `--control-h` drives Tailwind's spacing 11, so every h-11, size-11 and min-h-11 reads it.
5. `--sidebar-w` on :root, fluid in compact.
6. AppShell 100 dvh; the content area scrolls, the document never does.
7. Modal centered in the content area with at least 24 px of margin.
8. One SidebarBrand for every role, Teacher proportions.
9. Tests: the responsive scan, SidebarBrand, the dialog CSS.
10. Browser check at the seven sizes, then commit.


Summary of G1, done:
- Tests written first and seen failing (11), then passing. Client tests in client/test, the layouts and the UI kit: all pass.
- Browser, seven sizes, all three roles on their home pages: document scroll 0, sideways scroll 0.
- Assign Parents modal, seven sizes: 0 px off the content-area center, at least 232 px to the sidebar on desktop and 16 px to the screen edges under 1024 px, focus returns to the button after closing.
- Dashboards still scroll inside the content area at every desktop size. G2 and G3 fix their layouts, as the plan orders.

Figma calls used so far: 2 of 89.

Port 3000: another server was already running and I did not start it (my own start failed with EADDRINUSE). The automatic permission check refused my attempt to look up which process it is, so I left it alone. It serves the fresh client build from disk, so G1's measurements are valid, but its API code is older than any server change in this round.

## G2 Admin

Plan:
1. Additive migration: two report types, six nullable profile columns.
2. DB tests first: the six counts, the toggle, reset, View Profile, column validation, matrix row.
3. Summary and GET /api/teachers/:id.
4. Dashboard layout and six cards that fit the screen.
5. Upload panel on the Admin Calendar, one shared import hook.
6. Status toggle and View Profile. Edit and reset move inside it.
7. Profile page with every field that has a data source.
8. Browser check, compare with Figma, full check in foreground steps.

Summary of G2:
- Migration created and applied to the local database. It is additive, and no drift appeared.
- Browser, Admin dashboard at 1280x720, 1366x768, 1440x900, 1536x864 and 1920x1080: page scroll 0, content-area scroll 0, sideways scroll 0.
- Toggle in a real browser: light with aria-pressed true and Active, dark with aria-pressed false and Disabled, tooltips right, row muted. Put back to Active afterwards.
- Reset dialog: 0 px off the content-area center, focus returns to the button. Cancel only, so the demo Teacher's password did not change. Reset itself is verified by the DB and component tests.
- Upload panel with the fixture `SF MENU for 30 days.xlsx`: the file parses (Sheet1 SF-2026-003 and Sheet2 SF-2026-004, 42 days each), and the preview opens centered.
- NOT verified in a browser: the Confirm step of the panel. All 84 dates of the fixture are already in the local database, so the app refuses the file and offers no Confirm button. I did not clear menus to get past this. The confirm path is covered by the component test with a mocked API.
- Fixed along the way: the selected day's ring and tap target now cover the whole calendar cell.
- Compared with Figma: cards, calendar and upload panel follow the frames. Known differences are listed in docs/SPRINT_SHORTCUTS.md (Polish Round 2).
- A console error on calendar pages, FullCalendar's icon font blocked by the Content Security Policy, is in docs/BACKLOG.md.

Figma calls used so far: 6 of 89.

Full check for G2, in foreground steps: typecheck clean; lint clean after one fix (the import hook's methods became arrow functions); format clean; unit 297 of 297, client 428 of 428, db 549 of 549, each on one worker; build succeeds.

## G3 Teacher

Done, in the plan's order:
- Calendar: the day-panel tags point at the Purchase Request from 1024 px, as 166:1553 shows. The selected day's ring covers the whole cell (fixed in G2). The Assign Parents modal was measured in G1, before these changes; the shell and the dialog CSS have not changed since.
- Enrolled Students: denser rows, table text 12 to 13 px, names in black. The hidden hover labels no longer add false sideways scroll.
- Add Student, Admin Feedback, Parent Requests, Profile: density only. Compared with the frames at 1440x900 only: Add Student and Admin Feedback by eye; Parent Requests and Profile through the numbers and the audit.
- Home: same content in three columns, with Report Tracking back and new tests (DEC-046).
- Report Status: the details column beside the list from 1360 px.
- Cards until 1024 px on Reports and RIC Teachers, cards on phones on Centers and Menu Imports.

Figma calls used so far: 12 of 89.

## G4 Verify and tag

The first G4 attempt stopped when the system ran low on memory (DEC-035). It resumed on 2026-11-08 at the Developer's request, after memory was freed.

Full check, one command at a time, after the last code change: `npx tsc -b`, `npm run lint`, `npm run format:check`, vitest unit 297/297, client 434/434 and db 549/549 (each with `--maxWorkers=1`), `npm run build`. All passed.

Audit (scratchpad Playwright script, every page for the three roles, mocked report rows): document scroll, sideways scroll, clipped text, and fit with no scroll on dashboards from 1366 x 768.
- First run of the missing items: Teacher Home with the Admin Feedback box overflowed by 98 px at 1366 x 768 and 28 px at 1536 x 864. The touch pass (comfortable mode, 16 px root, coarse pointer confirmed) found the Reports and RIC Teachers tables too wide at 1024 px and on Reports at 1280 and 1366 px, the Admin dashboard's Recent Reports 43 px too wide at 1280 px, the Student list 9 px too wide at 1024 px, and dish names cut off in the calendar. A mouse at 1024 x 768, never audited before, found Teacher Home's two tables too wide. A screenshot showed Recent Reports cards clipped without a scrollbar at 1024 x 768.
- Fixed as DEC-047. Then, with the fixes:
  - Mouse, eight sizes (1024x768, 1280x720, 1366x768, 1440x900, 1536x864, 1920x1080, 768x1024, 390x844): Admin 56/56, Teacher 72/72, Parent 16/16.
  - Teacher pages with the feedback box, the same eight sizes: 72/72.
  - Touch, 1024x768, 1280x800, 1366x768, 1920x1080, all roles: 72/72.
  - The Admin dashboard at six desktop sizes: nothing scrolls from 1280 px; at 1024 x 768 the Recent Reports cards scroll inside their section.
- The login rate limit (300 requests in 15 minutes) refused requests partway through the audits. All the numbers above come from a fresh run on a test server started with RATE_LIMIT_MAX=100000 in the shell (DEC-047).
- Screenshots read: Teacher Home with feedback at 1366 x 768, Admin dashboard at 1024 x 768 and 1280 x 800 (touch), Students at 1024 x 768 (touch), Admin Calendar at 1024 x 768 (touch), Admin Reports at 1366 x 768 (touch).

API smoke test on port 3100, built app: the three roles log in; the Admin gets the dashboard summary, the teacher list, GET /api/teachers/2 and the profile; a Teacher gets 403 on GET /api/teachers/2 and their own profile; the Parent gets /api/auth/me.

NOT verified:
- The smoke test on port 3000. That port still runs a server I did not start, with older API code: GET /api/teachers/2 without login returns 404 there, where this round's code returns 401. **Restart it before the demo, or View Profile and the new dashboard counts will fail.**
- Every dialog: only Assign Parents (G1), the reset confirmation and the menu preview (G2) were measured.
- Overlapping elements: the audit does not measure them; only the screenshots named in this log were read.
- Report pages with real data: the rows were mocked, because the local database has no reports.
- The Upload panel's Confirm step in a browser (see G2).
- On a touch screen of 1024 to about 1366 px, long dish names in the calendar break in the middle of a word ("Picadill / o"). Every name can be read; before, they were cut off. Cosmetic, and only in comfortable mode.
- The footer's 10 px lines on tablets and phones are reported by the audit as small text; they were not changed in this round.

Tag: v0.9.4-demo on the G4 commit. v0.9.3-demo stays as the fallback. Nothing pushed.

# Round 3 (docs/POLISH_PLAN_3.md)

Branch demo-polish-3, confirmed with git status and git branch before starting (2026-11-08). The
Developer's `.claude/settings.json`, `docs/POLISH_PLAN_3.md`, `docs/feedback/` and the untracked
fixture `server/test/fixtures/SF MENU for 30 days.xlsx` were already there; only the plan and the
reference image are committed by this round (the plan is the round's source).

Setup notes:
- Decisions start at DEC-048, as the plan says (DEC-047 is the last one).
- The reference image is saved as `docs/feedback/admin-profile-figma.png.png` (double extension). Read first.
- The Playwright MCP server timed out on connect (CONNECT_TIMEOUT, 30 s). Browser checks use the same
  Playwright package from the local npx cache, driven by scripts in the session scratchpad, as in Round 2.
- Figma: at most 60 calls this round, counted in docs/components.md under "Polish Round 3".
- The users table already has email, address, sex and birth_date (Round 2, DEC-045). D7's email, gender,
  date_of_birth and address map onto them; only password_changed_at and login_events are new (DEC-048).

## H1 Shell fixes, Admin pages

Plan:
1. Figma: Login 241:1732 metadata (fields 479 x 50 in a 1280 frame), RIC Teachers 267:9862 screenshot
   (its content is one flat image), Admin dashboard 267:9689 and calendar frames by metadata.
2. Tests first: footer inside the scroll container, login field tokens, header spacing, calendar clamp
   class, Date Approved column, icon-only toggle.
3. D1 footer, D2 login fields, D3 header, D4 dashboard, D5 calendar, D6 RIC Teachers.
4. Browser at 1366x768, 1440x900, 1920x1080, 390x844. Commit.

Summary of H1, done:
- Tests written first and seen failing: 11 client tests and 1 db test. Then client tests for the shell, accounts, auth, dashboard, calendar, UI kit and the token, color and responsive scans: 300 of 300 on one worker; db polish3, accounts and polish2-admin: 43 of 43. Typecheck and lint of the changed files clean.
- Browser (Playwright from the npx cache, dev server on 5174 with the API on 3100):
  - Login fields: 50 px at 1280 x 720 (Figma 50), 53 at 1366, 56 at 1920, 44 at 390; text 16 px.
  - Top bar: user block 12 px from the top and 18 to 22 px from the right at 1366, 1440, 1920 and 390.
  - Footer: last in the content area; the dashboards fit and the footer comes after a scroll equal to its height (42 to 48 px Admin, about 290 px Teacher).
  - Calendar, Admin and Teacher: the whole month visible at 1366 x 768, 1440 x 900 and 1920 x 1080, 18 to 22 px to spare; six equal weeks (84, 130 px); August 2026 (six weeks, 07/26 to 09/05) also fits with equal rows; no sideways scroll; dish names 11 to 13 px, two lines with an ellipsis.
  - RIC Teachers: columns as Figma with Date Approved, three separate icons, toggle icon only with aria-pressed, name and tooltip, 33 to 40 px with a mouse and 44 px on a phone. No sideways scroll at 390 x 844.
  - Compared by eye with the Figma screenshots of 267:9689 and 267:9862 at 1920.
- Port 3000 is still held by an API process started earlier in this session that survived its stop, with code older than H1. The process lookup was refused by the permission system, so it was left alone. Restart the laptop or close it before `npm start`.

Stopped after H1 (2026-11-08): the system stopped the dev API (3100) and Vite (5174) because memory was critically low. Per DEC-035 and the system notice, they were not restarted and work stops here, reported to the Developer. H2 to H4 are not started.

Resumed on 2026-11-08 at the Developer's request from H2, with stricter memory rules for this run: one foreground command at a time; before a browser check, list Node processes and report leftovers rather than kill them; the built server only on port 3100 with RATE_LIMIT_MAX set for that process; one browser at a time, closed after each check; screenshots at 1440x900, 1366x768 and 390x844 only until H4. Git state and `tsc -b` were clean at the start.

## H2 Profiles and data

Plan:
1. Tests first: migration additive, profile fields, owner only, email not a login, password_changed_at, login events, activity counts and scope, last 10 logins, View Profile, matrix rows.
2. Additive migration, then the service, repository and two routes.
3. Client tests, then the Profile page for all roles in the layout of the Admin frame.
4. Browser check, full check in foreground steps, commit.

Summary of H2, done:
- Migration `20261108073559_polish3_login_events` created with `--create-only`, read, then applied to the local database. It is additive, and no drift appeared.
- Built: `GET /api/auth/profile/activity`, `GET /api/auth/logins`, login events, password_changed_at, the Profile page with Account Summary, System Activity, Personal Information and Account Security, the Login History dialog, Date Approved on View Profile. Decisions: DEC-049.
- Tests first: the new db file was seen with 18 of 26 failing before the code (the other 8 lock rules that already worked: validation, owner only, email not a login), then all passing. Client: 15 of 20 Profile tests failed before the page, then all passing.
- Tests changed because D7 replaces the old content, not to make them pass: listed in DEC-049.
- Browser (Playwright from the npx cache, the built server on port 3100, no other Node process running; one browser per role, each closed afterwards; the server stopped by its process id and confirmed gone after the first run): Admin, Teacher and Parent at 1440x900, 1366x768 and 390x844: document scroll 0, sideways scroll 0, no wide element, no page error. Login History opens with the real login. The edit dialog is centered in the content area with the right fields per role. Read: Admin at 1440 against the reference image, Teacher at 390.
- The first browser run stopped at login because my script used the wrong Admin password. That was one failed login on the local admin account, cleared by the next successful login. The rerun passed.
- The check server was started with the same `node` line that `npm start` runs, so that it could be stopped by its own process id.
- Local database: logging in for the check added one login event for each of admin, teacher.sibujo and parent1. Nothing else was saved: the dialogs were opened and closed without saving.
- Full check, foreground steps: `npx tsc -b`, lint and format clean; unit 297 of 297, client 468 of 468 (467 in the full run, then the changed footer test with its file, 17 of 17), db 584 of 584, each on one worker; the build succeeds.

NOT verified in H2:
- Saving the edit form and changing a password in a real browser. Both are covered by client tests with a mocked API and by db tests.
- 1920x1080 and the other sizes (left for the H4 audit, per the memory rules for this run).
- Figma was compared by eye for Admin only. Teacher follows D7, so it does not match 88:695. Parent has no frame.
- For H4: on the 390 px screenshot the top bar's avatar looks narrower than it is tall. It was not caused by H2 and was not changed.

Figma calls used so far: 10 of 60.

## H3 Teacher pages

Plan:
1. Figma: one screenshot each of 175:1023, 169:3189 and 254:4572.
2. Tests first: Child Records scoping and counts, Progress tab, Export List, Home order and real data, menu order.
3. `GET /api/child-records`, then the two pages, Progress tab, Export List and Home.
4. Browser check, commit per page group.

Summary of H3, done:
- Built: the CHILD'S RECORD menu item, the list with record counts, the detail with Conferences, Home Visits and Progress; Export List replaces Enrollment Form; Teacher Home follows D8. Decisions: DEC-050.
- Tests first: db 4 of 6 seen failing before the code (the other 2 lock Progress scoping and the PDF, which already worked), then all passing with the permission matrix, 316 of 316. Client: child records, Students page, Home and layouts, 35 of 35. Typecheck and lint of the changed files clean. The full check is at the end of H4.
- Two test files needed the toast provider the real app has. That was the tests' setup, not a weakened check.
- Browser (the built server on port 3100, no other Node process before or after; one browser, closed afterwards), Teacher at 1440x900, 1366x768 and 390x844: document scroll 0 and sideways scroll 0 on Home and Child's Record. Home: November (six weeks, 42 cells) with no scrolling inside the calendar, the last row 19 to 20 px inside the content area at both desktop sizes, Enrolled Students just below it. Detail tabs in order, Add progress note dialog centered, Export List dialog with School Year and Date Started, the old button gone, the PDF answers 200 and starts with %PDF. No page errors. Read: Home at 1366, Child's Record at 1440 and 390.
- The browser check opened the forms without saving, so no record was added. Teacher login added one login event for teacher.sibujo.

NOT verified in H3:
- 1920x1080 (the plan's size; left for H4 by the memory rules for this run).
- Saving a Progress note, editing and deleting it in a real browser. Covered by client tests with a mocked API and db tests.
- Home with real reports and feedback in the browser: the local database has none, so the two cards showed their empty states.

Figma calls used so far: 13 of 60.

## H4 Verify and tag

Finding fixed, in its own commit: on a phone the top bar's avatar was squeezed into an oval, because its block could shrink and the image follows the block's width. New test in `layouts.test.tsx`.

Audit (scratchpad Playwright script, the built server on port 3100 with RATE_LIMIT_MAX set for that process only, one browser per role, each closed afterwards): 21 pages for the three roles at 1280x720, 1366x768, 1440x900, 1536x864, 1920x1080, 768x1024 and 390x844, 147 views, 0 findings. It measures document scroll, sideways scroll in the content area, elements past the right edge, text clipped without an ellipsis, and the Admin dashboard fitting from 1366 px apart from its footer. The Profile edit dialog, for each role at 1440, 1280 and 390 px: 0 px off the content-area center, with equal space above and below. No page errors and no 500 answers.

The first audit run reported 47 "clipped" findings: 1 px screen-reader labels, counted by mistake, which also made the dialog measure read the backdrop. The script was corrected and the whole audit run again.

Full check, one command at a time, after the last code change: `npx tsc -b`, lint and format clean; unit 297 of 297, client 482 of 482, db 594 of 594, each on one worker; the build succeeds.

Smoke test on port 3000, the built app from that build, port free before and after, 19 of 19: the app and SPA fallback, health, 401 with no login, the three logins, activity, the dashboard, View Profile, login history, Child Records with counts, the Export List PDF, and 403 for the Admin and the Parent on Child Records and for the Teacher on the dashboard.

## Round 3 summary

H1 to H4 done on branch demo-polish-3, tag v0.9.5-demo, not pushed. v0.9.4-demo stays as the fallback. Decisions DEC-048 to DEC-050. 13 of 60 Figma calls. Nothing was cut. Objective 3 was not touched. No leftover process: Node was listed before each browser check, and none was running after.

**NOT verified:**
- Saving in a real browser for the new forms: Edit Profile, Change Password from the new page, and adding, editing or deleting a Progress note. They are covered by client tests with a mocked API and by db tests. Every browser check opened forms and closed them without saving.
- Report Tracking and Admin Feedback on Teacher Home with real rows: the local database has no reports, so the browser showed their empty states. The filled states are covered by client tests.
- Touch screens: this audit used a mouse. Round 2's touch pass was not repeated for the new pages.
- Screenshots read in Round 3 after H1: Admin Profile at 1440, Teacher Profile at 390, Teacher Home at 1366, Child's Record at 1440 and 390. Other views were measured only, so overlaps were not checked on them.
- Figma was compared by eye. Teacher Profile follows D7, so it does not match 88:695 (DEC-049). The record detail has no frame (DEC-050).
- 1024x768 was not in this audit (it is not one of the plan's seven sizes). Round 2 measured it.
- `npm run db:seed:demo` was not run on the local database. Its test passes on the test database.
- Real phones and browsers other than Chromium.

**For the Developer:**
- The local database has the new migration. Production (TiDB) does not, and it needs `migrate deploy` from your side when deployment resumes.
- Before the demo, run `npm run db:seed:demo` and start the app with `npm start` from this build.

## Demo seed and save flows after the tag (2026-11-08)

Asked for by the Developer. Seed on the local database, then Playwright against the built app on port 3100, then the seed again and the smoke test on port 3000.

- `npm run db:seed:demo` ran twice on the local database: 18 children, 14 assigned days. This closes the "seed not run" item above.
- Save flows, 24 of 24 in a real browser: Edit Profile (a bad email keeps the dialog with its message; values save, survive a reload and clear again); Change Password (wrong current password, confirmation, "Last changed today" with no reload, the session stays valid, the old password refused, the new one accepted); login history; Progress add, edit and delete with the list count going 0, 1, 0; a Parent cannot clear the mobile and can save; the Admin's View Profile shows Date Approved and Last Login. This closes the "saving in a real browser" item above.
- The first run was 12 of 16. Causes: my script tried to pick the blank Gender option, which left a dialog open and blocked Change Password; and a locator matched every card. Nothing in the app was changed.
- Finding, fixed afterwards at the Developer's request: once Gender was set, the form could not blank it again, because the shared Select's placeholder option is disabled. The Gender field now has its own "Not set" option; the shared Select is unchanged. The new test was seen failing first. Profile tests 21 of 21, lint and build clean; in the browser Gender went null, Female, null. The full test projects were not rerun for this one-field change. This commit is after the tag v0.9.5-demo, which was not moved.
- State afterwards: the smoke test on port 3000 passes 19 of 19 on the seeded data. The seed does not reset `password_changed_at`, so `teacher.sibujo` shows "Last changed today" (then N days ago) instead of "Not changed yet". The seed also keeps login events of Admin and Teacher, so their Logins This Month include these checks.

Still not verified: Report Tracking and Admin Feedback with real rows in the browser, touch screens, real phones.

# Round 4 (docs/POLISH_PLAN_4.md)

Branch demo-polish-4, confirmed with git status and git branch before starting (2026-11-12). The
Developer's `.claude/settings.json`, `docs/POLISH_PLAN_4.md` and the untracked fixture
`server/test/fixtures/SF MENU for 30 days.xlsx` were already there; only the plan is committed by this
round. The five reference images in `docs/feedback/` were read first.

Setup notes:
- Decisions start at DEC-051, as the plan says (DEC-050 is the last one).
- The Figma MCP server did not connect (ENOTFOUND for mcp.figma.com) and was still unavailable when
  checked again. No Figma call was made this round (0 of 40). Comparisons use the reference images in
  `docs/feedback/` and the measurements recorded in docs/components.md in Rounds 2 and 3.
- The Playwright MCP server timed out on connect. Browser checks use the Playwright package from the
  local npx cache, driven by scripts in the session scratchpad, as in Rounds 2 and 3.
- The memory directory named in the session has no MEMORY.md; the memory rules are the ones recorded
  as DEC-035, DEC-042 and DEC-047 in docs/DECISIONS.md, and the Round 3 browser rules in this log.

## I1 Admin

Plan:
1. Tests first: MiniCalendar grid (pure function) and component, dashboard cards and Quick Actions,
   Recent Reports tabs, Admin Students page, upload card and the no-menu banner.
2. D1 to D6, with the RIC Teachers page getting a "Manage Centers" button.
3. Browser: Dashboard and Calendar at 1440x900, 1366x768 and 390x844. Commit.

Summary of I1, done:
- Built: five Figma cards (D1), `MiniCalendar` on the dashboard (D2), Figma's four Quick Actions and "Manage Centers" on RIC Teachers (D3), the read-only Admin Students page and record at `/admin/students` (D4), Recent Reports with three pill tabs (D5), the Admin Calendar's header-row title and center control, per-month banner, accent Upload & Process and .xlsx check in the browser (D6). `Table` gained `band` for D8. Decisions: DEC-051.
- Tests first: 14 client tests failed and 3 new files could not load before the code; then all passed. The touched client folders: 289 of 289 on one worker. Typecheck, lint and format of the changed files clean.
- Two new tests passed alone but timed out in group runs under load (a page and its queries took more than Testing Library's 1 s wait). The client setup now waits up to 5 s (DEC-051); no assertion changed.
- Browser (the built server on port 3100 with RATE_LIMIT_MAX set in that shell only; one Chromium at a time, closed after each script; the server stopped by its process id afterwards and no Node process left): Admin at 1440x900, 1366x768 and 390x844 on Dashboard, Calendar, Admin Students and a student record: document scroll 0, sideways scroll 0, no element past the right edge, no overlapping text, no page errors or 500s. The dashboard fits with 0 to 1 px to spare at both desktop sizes. On the Calendar the whole month shows at 1366x768 (20 px to spare, 42 cells). Flows: a mini-calendar click opens `/calendar?date=2026-11-18` with that day selected; March 2027 shows "No Menu/Food Rotation Upload for March 2027"; Upload Document focuses the file input; Upload & Process is disabled without a file and rgb(2, 91, 2); November 2026 shows no banner.
- Compared by eye with figma-admin-dashboard.png and figma-admin-calendar.png at 1440 and 1366. Fixed after the first look: the month headings were 24 px (the compact `text-40` caps at 24 px; now `text-48`), the title class `text-32` does not exist (now `text-42`), the center control moved into the header row and was widened so "All centers (menus only)" fits.
- The first audit flagged one overlap on the Calendar at 1366: the measuring range included the hidden third line of a two-line-clamped dish name. The script now clips each text box to its element, and the rerun found none.
- Process note: once, a typecheck was started while a background test run was finishing, so two commands overlapped for a moment. Nothing failed.

NOT verified in I1:
- Figma nodes could not be read (no Figma connection); card icons are not Figma's (DEC-051).
- Recent Reports with real rows in the browser: the local database has no reports, so the empty state showed.
- Uploading and confirming a file through the new card in a real browser (covered by client tests; the browser check chose no file).

## I2 Teacher

Plan:
1. Tests first: teacher-summary scoping, counts, pages, activity order and texts, display codes, Qualification; Teacher Home per the frame; header bands.
2. `GET /api/auth/profile/teacher-summary`, Teacher Home, the Teacher Profile.
3. Browser: Teacher Home and Profile at the three sizes. Full check in foreground steps. Commit per page.

Teacher Home against 175:1023, before fixing. The frame could not be read again (no Figma connection), so the list comes from what Rounds 2 and 3 recorded about it (DEC-046, DEC-050, docs/components.md: 1920 x 1671, screenshots of 2026-11-07 and 2026-11-08):
- Figma: header, four summary cards, then Quick Actions on the left, the calendar, and Report Tracking with Admin Feedback on the right. Ours: the same. No change.
- Figma has a Recent Reports box; ours had none since Round 3 (DEC-050 removed it). Fix: restore it.
- Figma stacks Recent Reports and Enrolled Students under the calendar; ours had Enrolled Students across the full width below the row. Fix: both cards in the calendar's column, Recent Reports first.
- Figma's tables have a gray header band; ours had a plain header with a black rule. Fix: `band` (D8).
- Ours used FullCalendar with dish names in the calendar box; D2 asks for the mini calendar on Teacher Home too. Fix: `MiniCalendar`.
- Not checkable without the frame: card widths and heights in pixels. Ours keep the Round 3 sizes.

Summary of I2, done:
- Built: `GET /api/auth/profile/teacher-summary` (Teacher only, own data, paged reports, latest 10 activity entries), display codes in `shared/src/display-codes.ts`, the Teacher Profile of 88:695 above the Round 3 sections, Teacher Home with the mini calendar and Recent Reports restored under the calendar, header bands. No migration: `users.qualification` already existed (DEC-052).
- Tests: the client tests for Home and Profile were written before the code but first run after it, and the endpoint's code was written before its db test's first run. So these were not seen failing first; the honest order is recorded here. The db test's migration check failed once on my test (it read `migration_lock.toml`, then was too strict about Round 2's enum MODIFY) and was corrected to check the `users` statement and that Round 4 adds no migration.
- Results: db `polish4-teacher-summary` 11 of 11 and the permission matrix with the new row (325 of 325 for the two files); unit display codes 3 of 3; client Home 10 of 10 and auth 39 of 39 (two Profile tests timed out once at 15 s in a group run and passed alone). Typecheck clean.
- Browser (the built server on port 3100, RATE_LIMIT_MAX in that shell; one Chromium at a time; the server stopped by its process id, no Node left): Teacher at 1440x900, 1366x768 and 390x844 on Home and Profile: document scroll 0, sideways scroll 0, nothing past the right edge, no overlapping or clipped text, no page errors or 500s. Home: Recent Reports then Enrolled Students start under the calendar, in its column (left edges equal), the header band is rgb(240, 240, 240) with bold 12 px text. Profile: teacher-summary answers 200, Teacher ID RIC-2026-002. Read: Home at 1366 (top and bottom), Profile at 1440 and 390, compared by eye with figma-teacher-profile.png.
- Process note: the stop command first matched no listener, because the server listened on a line my pattern missed; the server's own log named its process id (12368), which was then stopped and confirmed gone.

NOT verified in I2:
- Frame 175:1023 itself (no Figma connection): the Teacher Home layout follows what earlier rounds recorded, not a fresh reading. Pixel sizes of its cards were not compared.
- The Teacher Profile with real reports and activity in the browser: the local database has no reports, so the table, pages and timeline showed their empty states. They are covered by client tests with a mocked API and by db tests.

I2 full check, foreground steps (2026-11-14): `npm run typecheck` clean; full lint and format clean; unit 300 of 300 on one worker. The client project run (one worker) was stopped by the system because memory was critically low. Per DEC-035 and the system notice it was not restarted, and work stops here, reported to the Developer. The client and db projects of the full check, and I3, are not done. No tag was made.

## I2 full check resumed in batches (2026-11-14)

After the memory stop above, the client and db projects were run in small batches, one command at a
time in the foreground, one worker each (`--maxWorkers=1`), with a JSON report per batch to list the
files that ran.

Client (8 batches): features/auth 2 files 39/39; features/accounts and calendar 6 files 53/53;
child-records, dashboard, health, home and menu 5 files 45/45; purchase and reports 4 files 34/34;
students 4 files 23/23; components 13 files 175/175; lib and app 5 files 47/47; client/test 7 files
113/113. Total 46 files, 529 of 529. The batch file lists, joined and sorted, equal the full list of 46
client test files (diff empty), so every client file ran exactly once. No batch was killed for memory.

Db (5 batches of 3 to 5 files): 5 files 78/78; 5 files 57/57; permissions, polish2-admin and polish3
340/340; polish3-profile, polish3-teacher, polish4-teacher-summary and profile 50/50; purchase, reset,
students, students-extra and teacher-pages 84/84. Total 22 files, 609 of 609; the lists match the 22 db
files exactly. Unit was already clean (300 of 300, above).

Proof that the I2 tests can fail (each a one-line change, run alone, then `git restore` on that file):
- Scoping: `auth.repository.ts` `listOwnLiquidation` without `teacherId` in its `where`. The
  teacher-summary file failed 10 of 11: "never shows another teacher's reports or activity" (expected
  another teacher's report list to be empty, got one row). Restored: 11 of 11. Note: the summary is
  scoped by the teacher's own id, not by center; the center filter applies only to the enrolled count.
- Pagination: `auth.service.ts` `const skip = 0;`. Failed 10 of 11: "pages the reports on the server,
  newest first, 5 by default" (page 2 returned page 1's ids). Restored: 11 of 11.
- `git status` after each restore showed only the Developer's `.claude/settings.json` and the untracked
  fixture.

## D7 again, with frame 175:1023 (2026-11-14)

Figma connected this time (tried once): `whoami`, `create_session`, `get_metadata` and one
`get_screenshot` of 175:1023 (4 of 40; docs/feedback/figma-teacher-home.png).

The frame at 1920 (content from x 290): header and location; four stat cards 346 x 133 at x 310, 714,
1125, 1535; Quick Actions title at y 408 and three tiles 375 x 126 at y 461, 638, 810; the calendar 690 x
523 at x 809, y 397 (weekday row at y 506); Report Tracking 322 x 213 at x 1572, y 507 and Admin Feedback
322 x 213 at y 754; then Recent Reports 593 x 213 at x 321, y 995 and Enrolled Students 759 x 222 at x 947,
y 991, side by side; the footer at y 1288. Recent Reports: Report Title (document icon), Date, Status,
three rows, "View all reports →". Enrolled Students: #, Student name, Date Enrolled, Age, edit and delete
icons, "View all →", "+ Add Student".

Ours at 1440x900, before fixing (Figma scaled to our content width, factor 0.74, in brackets):
- Recent Reports and Enrolled Students stacked in the calendar's column (frame: side by side in their own
  row, 439 and 562 px wide). The I2 reading of the old notes was wrong.
- Quick Actions 222 px wide [278], tiles 57 to 69 px tall with 6 px gaps [93, gaps 38].
- Calendar 707 x 641 [511 x 387]; gaps between the columns 16 px [80 and 54].
- Right column 209 px [238], starting at the row top [level with the weekday row]; boxes as tall as their
  text [158 each, gap 25].
- Stat cards 80 px tall with 12 px gaps [98, gaps 47].
- Recent Reports columns Report Type, Date Submitted; four rows; "View all" [Report Title, Date; three;
  "View all reports →"].

Fixed (DEC-053). Tests first: the column names and link, three rows, and both cards sharing one row
outside the calendar row failed 3 of 12, then passed 12 of 12. Ours after, at 1440x900: Quick Actions 278
wide, calendar 512 x 388, right column 239 with boxes 160 tall and a 25 px gap, the first box level with
the weekday row (336 and 337), Recent Reports 437 and Enrolled Students 560 side by side. At 1366x768 the
top rows end at y 665, inside the screen. At 390x844 everything stacks; document and sideways scroll 0 at
all three sizes. Home tests 12 of 12 and client/test 113 of 113; typecheck clean.

Not matched, on purpose (DEC-053): dates MM/DD/YYYY, no delete button, table rows at the 44 px touch
height, our shorter month heading.

## I3 Verify and tag (2026-11-14)

Browser audit (Playwright from the npx cache, scratchpad script; the built app with the API on port 3100,
started with `PORT=3100 RATE_LIMIT_MAX=100000` in that shell only; one Chromium per role, closed after
each run; two Node processes that were running before, 8952 and 5900, were not touched; the server,
process 14808, was stopped by its id afterwards and port 3100 confirmed free). Each view measures document
scroll, document and content-area sideways scroll, elements past the right edge (outside deliberate
scrollers), overlapping text (leaf text boxes clipped to their scroller), page errors and 5xx answers.
- Admin, 11 pages: Dashboard, Calendar, Admin Students, a student record, RIC Teachers, a Teacher, Centers,
  Reports, Menu Imports, Admin Feedback (the no-access page, as expected) and Profile.
- Teacher, 14 pages: Home, Enrolled Students, Add Student, a student, Edit Student, Calendar, Child's
  Record list and a record, Submit Report, Status, Report Status, Admin Feedback, Parent Requests, Profile.
- Parent, 4 pages: Home (the Calendar), /calendar (the no-access page, as expected), Status, Profile.
- At 1440x900, 1366x768 and 390x844: 87 views, 0 findings. Read by eye: Teacher Home at 1440 and 1366,
  Admin Dashboard at 1366 (fits one screen; the 42 px left to scroll is the footer).
- Script notes: the first Teacher run missed Edit Student (it opens from a button, not a link) and took
  `main` as the scroller; both fixed and all three roles rerun with the final script.

Smoke test of the built app on port 3100 (node fetch script): 21 of 21. `/` serves the built client,
health 200, `/api/auth/me` 401 without login; the three roles log in; the Admin reads me, the dashboard
summary, teachers, teacher 2 and the profile, and gets 403 on teacher-summary; the Teacher reads me, the
profile, teacher-summary, students and reports, and gets 403 on teacher 2; the Parent reads me and gets 403
on teacher-summary and teachers.

Checks: typecheck, full lint and full format clean; unit 300 of 300 (I2), client 46 files 529 of 529 and
db 22 files 609 of 609 in batches (above), then after D7 the Home file 12 of 12 and client/test 113 of 113;
`npm run build` and the client build after D7 clean. `npm run check` was not run as one command, on
purpose (memory, DEC-035).

## Round 4 summary

Done: I1 (Admin Dashboard, mini calendar, Quick Actions, Admin Students, Recent Reports tabs, Admin
Calendar), I2 (teacher-summary endpoint, Teacher Profile, Teacher Home, header bands), D7 again from the
real frame 175:1023 (DEC-053), the full check in batches, the proof that the I2 scoping and pagination
tests fail when the code is broken, the I3 audit and smoke test, DEMO_SCRIPT and UI_MAP. Tag v0.9.7-demo
on the commit that holds this summary. Decisions DEC-051 to DEC-053. Figma calls: 4 of 40.

NOT verified:
- Figma frames other than 175:1023 were not read this round (267:9689, 268:11404 and 88:695 were compared
  with the images in docs/feedback/ only). Card icons are not Figma's.
- Pixel-exact match: Teacher Home matches the frame's proportions within a few pixels at 1440, but our
  month heading is shorter than the frame's, table rows keep 44 px, and dates stay MM/DD/YYYY (DEC-053).
- Real report rows in the browser: the local database has no reports, so Recent Reports, Report Tracking,
  Admin Feedback, the Profile's report table, pages and timeline showed their empty states. They are
  covered by client tests with a mocked API and by db tests.
- Uploading a menu file through the new upload card in a real browser.
- The 390 px views were measured and screenshotted, but only the desktop screenshots listed above were
  read by eye.
- Content-area scroll heights from the audit depend on which scroller the script picks; they were used
  only as a hint, not as a pass or fail check.
- `npm run check` as a single command, and the whole client project in one run (memory).
- The demo date line in docs/DEMO_SCRIPT.md still says Tue 2026-11-10; the presentation moved to next week
  and its date is not in the plan.

# Plan 5 (docs/POLISH_PLAN_5.md)

Branch demo-polish-5, confirmed with git status and git branch before starting (Sat 2026-11-14).
`.claude/settings.json` (modified) and the untracked `server/test/fixtures/SF MENU for 30 days.xlsx` were
already there and are not committed by this plan. Model for J1: Claude Fable 5.2.

## J1a Read-only audit (2026-11-14)

Read: every file in `server/src` except the tests, `shared/src`, `schema.prisma`, the permission matrix
test, the test harness and the assignments-week test; the client by searches only.

Result: docs/AUDIT_REPORT.md. 0 critical, 3 high, 19 medium, 20 low.
- No access across centers by id and no mass assignment was found.
- High: AUD-001 the login lock can be passed with parallel requests; AUD-002 change-password accepts the
  same (default) password; AUD-003 two people adding a row at once get the same item number or a 500, and
  a row can be added just after a lock.
- The intermittent 404: the cause is narrowed to a failed week save in the test setup (a transaction
  over Prisma's default 2 s and 5 s limits on a loaded laptop). Most likely, not proven; AUD-015.
- Not verified: listed in section 5 of the report (client read by sampling, npm audit did not answer,
  two findings from reading only, TiDB).

After the report was committed, `npm audit` and the licence listing answered (they had taken over 3
minutes): 11 moderate, 0 high, 0 critical; details in AUD-039, and section 5 of the report is corrected.

## J1b Fixes for the high findings (2026-11-14)

AUD-001 Login lock passed by parallel requests (BR-19). Fixed.
- Test first: `server/test/db/audit-001-lockout.db.test.ts`. Seen failing before the fix: ten wrong
  passwords at once all answered 401 (expected five 401 and five 429). Its two other tests (right password
  on the fifth attempt, count restarts after the lock) passed before and after; they guard the old rules.
- Fix: each attempt is counted before its password is checked, with one conditional UPDATE
  (`takeLoginAttempt`); `lockWhenSpent` sets the lock when the fifth is taken; a request that gets no
  attempt answers the same 429 with Retry-After. `recordFailure` is removed. A right password still
  clears the count. Cost: two small UPDATEs per login instead of one on failure.
- Runs: the new file and `auth.db.test.ts` together 23 of 23; server typecheck, lint and format of the
  changed files clean.

AUD-002 change-password accepted the same or the default password (BR-05). Fixed.
- Test first: `server/test/db/audit-002-password.db.test.ts`. Seen failing before the fix: 3 of 5 answered
  200 where 400 is expected (keep the default after a reset; change to the same password; choose the
  default). The other two (wrong current password reported first; a new password accepted) passed before
  and after.
- Fix: in `auth.service.ts`, after the current password is confirmed, a new password equal to the current
  one or to `DEFAULT_PASSWORD` is refused with a `newPassword` field message. The forced-change flag and
  the session stay as they were. The service now receives `DEFAULT_PASSWORD` from the config it already had.
- Runs: the new file with `passwords`, `accounts` and `polish3-profile` db tests, 64 of 64; server
  typecheck, lint and format of the changed files clean.
- Not done: the same check in the shared Zod schema, so the form would refuse it before sending. The
  server message appears under the field instead.

AUD-003 Rows added at the same moment (BR-11, BR-12). Fixed.
- Test first: `server/test/db/audit-003-rows.db.test.ts`. Seen failing before the fix, 4 of 5: four adds
  at once on a day not opened yet answered 201, 500, 500, 500; six adds at once on an open day gave the
  item numbers 1, 2, 2, 2, 2, 5, 7; the repository added a row to a locked day and deleted one from it.
  The fifth test (a locked day answers 409 through the API) passed before and after.
- Fix, in `purchase-requests.repository.ts`: `lockOpenRequest` reads the request row with FOR UPDATE inside
  the transaction and returns its status and last item number in the same statement; `addItem` and
  `deleteItem` go through it and write nothing unless the day is OPEN; `open` reads the row again when its
  insert loses to another request. The service answers 409 STATE_INVALID when the repository refuses.
  The lock is on the request row only, not on item rows, so it cannot deadlock with a row being edited.
  `isUniqueViolation` moved from `menu.service.ts` to `core/db-errors.ts` and is used by both.
- Runs: the new file 5 of 5, then three more runs 5 of 5 each; `purchase`, `assignments-week`,
  `liquidation` and `menu` db tests 108 of 108; server typecheck, lint and format of the changed files
  clean. The assignments-week file passed again (31 of 31); no 404.
- NOT verified: TiDB Cloud. The statement uses FOR UPDATE with a subquery, which MariaDB and TiDB both
  accept, but it ran only on the local MariaDB (DEC-016). Run this test file against TiDB before go-live.
- Not part of this fix (AUD-004, medium, in BACKLOG): lock, unlock, no-feeding and submit still change the
  status without a condition.

AUD-022 (medium) checked with a throwaway db test, deleted afterwards: on the local MariaDB a row created
through Prisma has the right time; a row inserted with raw SQL using the column default is 8 hours ahead
(session time zone SYSTEM, +08:00). Nothing in the application inserts that way today. Report updated.

Medium and low findings (39) are in docs/BACKLOG.md under "From the code audit", each with its id, size
and the Plan 5 stage that could take it. Decisions: DEC-054. docs/API.md has the two changed answers of
login and change-password; docs/CHANGELOG.md, docs/INDEX.md and docs/PHASE_LOG.md are updated.

Checks after the three fixes (one command at a time, one worker):
- `npm run typecheck`, full lint and full format check: clean.
- unit: 25 files, 300 of 300.
- db in three batches: 9 files 98 of 98; 8 files 416 of 416; 8 files 108 of 108. 25 files, 622 of 622
  (609 before, plus 13 new).
- Batch 3 needed three runs. Run 1: 1 failure in 396 s; which test was not captured. Run 2: "LOCKED then
  unlock is 200 and ends OPEN" (`purchase.db.test.ts:242`) timed out at 15 s; that run reported a duration
  of 82,467 s, so the laptop slept during it. `purchase.db.test.ts` alone then passed 44 of 44, and run 3
  of the whole batch passed 108 of 108 in 175 s. That test opens, locks and unlocks a day without rows; it
  does not reach the changed add and delete code. I read the failure as the machine, not the code, but
  the first failure was not identified, so this is not proven.
- `npm run build`: succeeds (main script 855 kB, known, J4 e).
- Not run: the client test project (no client file changed), `npm run check` as one command (memory,
  DEC-035), and any browser or built-app check (no screen changed in J1).

## J1c Objective 3 plan (2026-11-14)

docs/OBJ3_PLAN.md, documents only: scope from Annex A, what is reused, additive data model
(`file_assets`, `report_versions`, BR-06 uniqueness in two possible ways), endpoints, BR-06, BR-07 and
BR-20 with their tests, the upload security design, screens mapped to the Figma frames of
docs/figma-inventory.md, 11 tasks (O3-T01 to O3-T11) with tests, risks, and an estimate of 12 to 15
working days. Six open questions for the Developer, each with a default. No Figma call was made (count in
docs/components.md unchanged): the frames are read when their tasks start.

## J1 summary

Found: 42 findings, 0 critical, 3 high, 19 medium, 20 low. No access across centers and no mass assignment.
Fixed: the 3 high ones, each with a test seen failing first and its own commit (AUD-001 login lock with
parallel requests, AUD-002 change-password to the same or default password, AUD-003 item numbers, opening a
day and the lock with parallel row adds). Tag v0.9.8-demo on the commit that holds this summary.
Remains: the 39 medium and low findings (docs/BACKLOG.md); the cause of the intermittent 404 is narrowed
to a failed week save in the test setup but not proven; AUD-003 is not verified on TiDB; J2 to J6.

## J1d Extra stage: medium findings on security and data integrity (2026-11-15)

Asked by the Developer after J1. Branch demo-polish-5, confirmed with git status and git branch. Same
rules as the plan. Nothing was written to any .env file; `.env.example` is the only env file changed.

AUD-009 Built-in secrets without NODE_ENV. Fixed.
- Test first, in `server/src/config/env.test.ts`: 6 of 11 new tests seen failing (NODE_ENV missing or
  empty started the server with the built-in JWT secret and passwords).
- Fix in `config/env.ts`: NODE_ENV has no default. Missing or empty counts as production: the server
  refuses to start unless JWT_SECRET (32 or more), COOKIE_SECURE, SESSION_HOURS, ADMIN_USERNAME,
  ADMIN_PASSWORD and DEFAULT_PASSWORD are all set, and the first line of the message says NODE_ENV is not
  set. Any other word is refused as before. The built-in values apply only with NODE_ENV=development or
  test, written out. This is stricter than asked in one way: three more settings are required, because a
  missing NODE_ENV is treated exactly as production.
- Tests changed because the requirement changed, not to make them pass: eight older tests in the same
  file called `parseEnv` with no NODE_ENV and expected the development defaults; they now pass
  NODE_ENV "development". One was renamed ("applies defaults when only DATABASE_URL and NODE_ENV are given").
- `.env.example` says this at the top and shows the six values. It already had NODE_ENV=development.
- FOR THE DEVELOPER: I did not read `.env`. If it has no NODE_ENV line, `npm start`, `npm run db:seed`
  and `npm run db:seed:demo` now stop with "NODE_ENV is not set"; add `NODE_ENV=development`. The demo
  seed's own guard reads NODE_ENV from the process as before.
- Runs: env tests 39 of 39 with demo-guard; `server/test/startup.test.ts` timed out once at its 30 s limit
  in the same run (it starts a process with tsx) and passed alone in 18 s. Typecheck and lint clean.

Tests for the other findings were written before any of their fixes and run once, all failing, then
split into one file per finding so each fix has its own commit. Unit: 18 failing. Db: 19 failing of 21
(the two passing ones only guard old behaviour). What each run showed is under its finding below.

AUD-004 Lock, unlock, No feeding and Submit without a condition. Fixed.
- Test first: `server/test/db/audit-004-transitions.db.test.ts`, 5 of 5 seen failing. With two requests at
  the same moment the race happened in the first round: unlock 200 and submit 201 together, a report
  holding an OPEN day. Directly on the repositories: `setOpen` reopened a submitted day, `lock` locked a
  No feeding day, `setNoFeeding` changed a locked day, and `submit` accepted an OPEN day.
- Fix: `lock`, `setOpen` and `setNoFeeding` are each one conditional UPDATE (expected status, and for
  unlock `submitted_report_id IS NULL`) and return null when nothing matched; the service answers 409.
  Submit and resubmit mark only days that are still LOCKED or NO_FEEDING; any other count rolls the
  transaction back. No explicit row lock was needed: the UPDATE waits for a submit that is marking the
  row and then sees the mark.
- Left: a Teacher who unlocks, edits and locks a day again in the few milliseconds between Submit's read
  and its transaction would get a snapshot from before the edit. It needs three more requests inside
  that gap; not closed.
- Runs: the new file, `purchase` and `liquidation` db tests, 67 of 67 (6 concurrent rounds pass).

AUD-005 A doubled request answered 500. Fixed (it also removes the 500 half of AUD-006).
- Test first: `error-handler-conflict.test.ts` (3 failing: 500 where 409 is expected) and
  `server/test/db/audit-005-conflicts.db.test.ts` (3 failing). Seen before the fix: the same week saved
  four times at once answered 500, 500, 200, 500 with Prisma P2034 in the log; three sign-ups with one
  username and three Add Student with one child each answered 201, 500, 500 with P2002.
- Fix: `isWriteConflict` in `core/db-errors.ts` (P2002, P2034, the driver's deadlock 1213); the error
  handler answers 409 CONFLICT "This was just saved by another request. Please refresh and try again."
  The losing transaction was already rolled back, so nothing is half saved. A 409 is not logged.
- Runs: unit 17 of 17 with the old error-handler tests; db 34 of 34 with `assignments-week`.

AUD-006 Two active Teachers in one center. Fixed.
- Test first: `server/test/db/audit-006-one-teacher.db.test.ts`, 2 of 2 seen failing: two Teachers created
  at once for one center both answered 201, and two disabled Teachers enabled at once both answered 200.
- Fix in `users.repository.ts`: creating a Teacher, and any change that leaves a Teacher active in a
  center, runs in a transaction that first locks the center row (`SELECT ... FOR UPDATE`) and counts its
  other active Teachers in the same statement. The service keeps its earlier check for a clear message
  and answers the same 409 when the repository refuses. No migration, no unique index.
- Runs: the new file and `accounts` db tests, 19 of 19 (4 rounds each). MariaDB only, not TiDB.

AUD-007 Menu file values that do not fit the database. Fixed.
- Test first: `parser-limits.test.ts` (7 of 9 failing: no error was reported) and
  `server/test/db/audit-007-file-name.db.test.ts` (a 260-character file name answered 200 at preview).
- Fix: the parser reports a menu over 200 characters, a day name over 20, a PR number over 30 and a day
  number that is not a whole number from 1 to 999 as preview errors, which block the import; the upload
  route refuses a file name over 255 characters with 400. A sheet name cannot be too long (Excel allows
  31). The real DSWD fixture still parses with no errors.
- Runs: menu unit tests 22 of 22; the new db file and `menu` db tests 16 of 16.

AUD-008 Liquidation submit hid every error as a 409. Fixed.
- Test first: `liquidation-submit.test.ts` (service with a stand-in repository), 2 of 2 failing: a
  database failure came back as "This period was just submitted".
- Fix: the repository throws `SubmitRaceError` for the expected race (a day or the report taken by
  another request); the service turns only that, and a write conflict, into the 409. Anything else
  reaches the error handler, is logged and answers 500 or 503.
- Runs: liquidation unit tests 2 of 2; `liquidation` and `audit-004` db tests 23 of 23.

AUD-010 No login limit per client address (BR-19, P1-T07). Fixed. This is the login part of J4 (a).
- Test first: `server/test/db/audit-010-login-limit.db.test.ts`, 1 of 3 failing: after 30 wrong passwords
  on 30 different usernames from one address, the next login answered 200.
- Fix: `createLoginRateLimit` in `core/middleware/rate-limit.ts`, on `POST /api/auth/login` only: 30 failed
  logins from one address in 15 minutes (`LOGIN_IP_MAX_FAILURES` in `config/limits.ts`); successful
  logins do not count; the answer is the same 429, text and Retry-After as a locked account. It is on
  when `RATE_LIMIT_ENABLED` is true, like the global limit, and off in the other tests.
- To know: it counts by `req.ip`. Behind a proxy with TRUST_PROXY 0 every user shares one address, so 30
  failed logins by anyone would stop logins for everyone for up to 15 minutes. TRUST_PROXY must be right
  on the host (AUD-016, docs/DEPLOY.md). The count is in memory, per server process.
- Not done: a limit on sign-up (AUD-042, low).
- Runs: the new file, `auth` and `permissions` db tests, 337 of 337.

AUD-012 Logout only cleared the cookie. Fixed.
- Test first: `server/test/db/audit-012-logout.db.test.ts`, failing: a cookie copied before logout still
  answered 200 on `/api/auth/me` after it.
- Fix: logout increments `token_version` (`endSessions`), then clears the cookie. A logout therefore ends
  the user's sessions on every device, as a password change already does.
- Runs: the new file, `auth` and `demo-flow` db tests, 22 of 22.

AUD-014 Child's Record entries of an earlier school year could be changed. Fixed.
- Test first: `server/test/db/audit-014-past-year.db.test.ts`, 2 of 2 failing: three entries were added
  (201) to a child of 2025-2026, and its entries could be edited and deleted (200).
- Fix in `child-records.service.ts`: adding an entry uses the students service's `loadForWrite`, and
  edit and delete go through `requireWritable`, which does the same for the entry's child. A child of an
  earlier school year answers 422 with the existing message; reading stays allowed.
- Runs: the new file with `students`, `students-extra` and `polish3-teacher` db tests, 38 of 38.

AUD-021 A moved Teacher still saw the old center's reports. Fixed.
- Test first: `server/test/db/audit-021-moved-teacher.db.test.ts`, failing: after the Admin moved the
  Teacher to another center, the Teacher Profile still counted 1 submitted report of the old center.
- Fix: the three Teacher Profile queries in `auth.repository.ts` filter by the Teacher's current center as
  well as the Teacher's id (BR-02). The old center keeps its reports; its next Teacher and the Admin see
  them through the normal report pages, as before.
- Runs: the new file with `polish4-teacher-summary` and `polish3-profile` db tests, 38 of 38.

AUD-015 Transaction limits, and the intermittent 404 in "a Parent adds a row". Fixed; cause shown, not proven.
- Reading: the 404 for a Parent on `POST /api/purchase-requests/:date/items` has two sources, "not
  assigned" and "no menu". Both Parent logins in that test succeeded and the menu days are inserted
  directly, so the assignment was missing, and only the week save of the group's `beforeEach` creates
  it. Its inputs are fixed, so 401 and 422 are ruled out; what remains is a 500 from its transaction.
  `saveWeek` is an interactive transaction of four statements and had Prisma's default limits: 2 seconds
  to get a connection, 5 seconds in all.
- Test first: `server/test/db/audit-015-week-save-wait.db.test.ts`. Another connection holds one row of the
  week for 6.5 seconds. Seen before the fix: `{ save: 500, add: 404 }`, the same pair as the failure
  seen on 2026-11-07 (a 500 that the old setup did not check, then the Parent's 404). The other test,
  that the limits are passed to the two assignment transactions, also failed (no such value).
- Fix: `TRANSACTION_OPTIONS` in `core/db.ts` (10 s to get a connection, 20 s in all), set as the default of
  the Prisma client for every transaction and passed explicitly, with a comment, to `saveWeek` and
  `replaceAssignments`. A transaction that still runs out (P2028) now answers 503 SERVICE_UNAVAILABLE,
  not 500 (`error-handler-timeout.test.ts`, seen failing with 500).
- After the fix the same test gives `{ save: 200, add: 201 }`.
- What this proves: a slow week save produces exactly the failure that was seen. What it does not prove:
  that this is what happened on 2026-11-07. That run was not recorded and has not happened again.
- Runs: unit 37 of 37 (`db.test`, both error-handler files); db 33 of 33 (the new file and
  `assignments-week`). This command took far longer than its tests (it passed the 590 s limit and
  finished in the background); the laptop appears to pause between commands. Noted for item 5 below.

AUD-016 The global rate limit counted the client's files. Fixed. This is the other half of J4 (a).
- Test first, in `pipeline.test.ts`: failing with 429 on a file outside `/api` after two requests.
- Fix: the global limiter is mounted on `/api` only. docs/DEPLOY.md now says what TRUST_PROXY must be on
  the host and why both limits depend on it. The proxy setting itself cannot be checked before deployment.
- Runs: `pipeline`, `app` and `spa` unit tests, 26 of 26.

AUD-019 Database errors could put personal data in the log (BR-21). Fixed.
- Test first: `error-handler-logging.test.ts`, 2 of 3 failing: the log held the child's name and birthdate
  from the error's message, stack and meta.
- Fix: for an error whose name starts with "PrismaClient" the log keeps the name, the code and the "at"
  lines of the stack; the message and meta are dropped. Every other error is logged whole, as before.
- Cost: a database error is harder to read in the log (no message). The code and the stack lines stay.
- Runs: all middleware unit tests and the logger tests, 38 of 38.

AUD-022 Column defaults used the machine's time zone. Fixed.
- Test first: `db-session.test.ts` (no such setting) and `server/test/db/audit-022-utc-session.db.test.ts`,
  failing: a row that took the column default was 480 minutes ahead of the application's time.
- Fix: every pooled connection runs `SET time_zone = '+00:00'` when it opens (`initSql` in
  `buildPoolConfig`). Times written by the application were already UTC and are not changed; no stored
  value is touched. Rows inserted earlier with raw SQL, if any exist in a local database, keep their old
  value.
- Runs: unit 23 of 23; db 31 of 31 (the new file, `health`, `polish3-profile`, `reset`).
- NOT verified: that TiDB Cloud accepts the same statement on connect (it should; DEC-016).

Not fixed in J1d, and why: AUD-011 (the shared default password is the client's decision, D6); AUD-013
(optional fields cannot be emptied: a form behaviour across the shared schemas and three client forms,
not a security or integrity fault); AUD-017 (PDF font: a new asset); AUD-018 (paging); AUD-020 (more
tests: J1d added 21 test files, but lock, unlock and submit are the only state changes with a concurrent
test).

### Checks after all J1d fixes (2026-11-16 and 2026-11-17, one command at a time, one worker)

- `npm run typecheck`, full lint, full format check: clean.
- unit: 31 files, 331 of 331 (300 before J1d).
- db batch 1 (19 files, all `audit-*` files with accounts, assignments-week, auth, dashboard, demo-flow,
  demo-seed): 119 of 119. One notice: "Timeout terminating forks worker" for
  `audit-005-conflicts.db.test.ts` (the worker process was slow to stop after its tests passed). The run
  reported a duration of 39,841 s: the laptop slept during it.
- db batch 2 (8 files): 416 of 416 in 223 s.
- `npm run build`: succeeds.
- Not run: the client test project (no client file changed in J1 or J1d); `npm run check` as one command
  (DEC-035); any browser or built-app check. `npm start` was not started, so the new NODE_ENV rule was
  not tried against the Developer's real `.env`.

### Item 5: db batch 3, three runs in a row, nothing retried silently

Same eight files each time (polish3-teacher, polish4-teacher-summary, profile, purchase, reset, students,
students-extra, teacher-pages), 108 tests, verbose reporter, full output kept in the session's
scratchpad as `batch3-run1.txt`, `batch3-run2.txt`, `batch3-run3.txt`.

| Run | Start | Result | Duration | The failure |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-17 10:31 | 8 files passed, 108 of 108 | 276 s (tests 67%, import 32%) | none |
| 2 | 10:36 | 1 file failed, 107 of 108 | 660 s (tests 60%, import 39%) | `profile.db.test.ts` > "admin.t reads their own profile": "Hook timed out in 60000ms" in `beforeEach` (line 32: reset, build the app, seed). The next tests of the file passed but took 37 s, 7 s, 6 s and 16 s; the whole file took 165 s (4 s in run 1), and `reset.test.ts` after it 20 s (0.9 s in run 1) |
| 3 | 10:50 | 1 file failed, 107 of 108 | 615 s (import 52%, tests 47%) | `teacher-pages.db.test.ts` > "the Admin still sees every center": "Test timed out in 15000ms" (it ran 27 s). Other tests of the same file took 11 to 17 s; one in `polish3-teacher` took 24 s and passed |

What this shows:
- The failure is real and comes back: 2 of 3 runs here, and the two runs on 2026-11-14.
- It is always a timeout, never a wrong value. No assertion failed in any of the five failing or passing
  runs. Each time it is a different test in a different file: the purchase state machine (2026-11-14),
  the profile setup hook, the Admin's report list.
- The time is lost everywhere at once for a few minutes: many tests in a row are 10 to 100 times slower,
  and in run 3 more than half of the run was spent loading modules, which uses no database at all. A
  lock left by another test would stop one statement and end in a lock error, not slow every test and
  the imports.
- So the tests fail when the laptop (or its MariaDB) stalls for a while. Why it stalls is NOT found. I
  could not look at the running processes or memory (the check was refused by the permission mode, and I
  did not work around it). Known facts that fit: the clock jumped by many hours inside single commands
  on 2026-11-14, 15, 16 and 17 (sleep), an earlier run was stopped for low memory (DEC-035), and batch 2
  took 223 s today against 137 s on 2026-11-14.
- I cannot rule out that J1 or J1d made the tests slower (run 1 took 276 s; the same batch took 175 s on
  2026-11-14 before J1d). Login now makes two small writes, and each new connection sets its time zone.
  Neither explains a stall of minutes.
- Not changed: no timeout was raised and no test was retried or weakened. If the Developer wants the runs
  stable on this laptop, the options are a longer `testTimeout` for the db project (15 s now) or running
  with the lid open and nothing else running; that is the Developer's choice.

### Item 6: docs/OBJ3_PLAN_REVIEW.md

One pass over docs/OBJ3_PLAN.md as an attacker and as a tester; the plan is unchanged. 20 gaps (G-01 to
G-20), 11 risky assumptions (R-01 to R-11), 31 tests the plan does not name. To decide before any
Objective 3 code: whether the host keeps files at all (R-01), one file per report against several phone
photos (R-02), no limit on how much a Teacher can store (G-01), no way to remove a wrong upload (G-13),
and the estimate, made before the Figma frames were read (R-03).

### J1d summary

Fixed, one commit each, each with a test seen failing first: AUD-009, 004, 005, 006, 007, 008, 010, 012,
014, 021, 015, 016, 019, 022. Tag v0.9.9-demo on the commit that holds this summary. Not pushed.
Decisions: DEC-055. Documents: AUDIT_REPORT (status), BACKLOG (rows marked), API (new answers), DEPLOY
(settings for the host), CHANGELOG, INDEX, PHASE_LOG, `.env.example`.

NOT verified:
- `npm start` and the seeds with the Developer's real `.env` (not read). They need `NODE_ENV=development`.
- Anything on TiDB Cloud: the row locks (AUD-003, AUD-006), the session time zone (AUD-022), P2034.
- TRUST_PROXY on a real host, which both rate limits depend on.
- The cause of the stalls behind the batch 3 timeouts.
- The client: no client test and no browser was run; the pages only receive new 409, 422, 429 and 503
  answers through the existing error display.

## J2 Fidelity audit by frames and Parent pass (started Tue 2026-11-17, Fable 5.2)

Branch demo-polish-5 confirmed with git status and git log (HEAD 23cda11, tag v0.9.9-demo). The
Developer's `.claude/settings.json` and the untracked fixture were already there and stay out.
The Playwright MCP server timed out on connect; browser checks use Playwright from the npx cache
(`_npx/e41f203b7505f1fb`) with a scratchpad script, as before. Figma connected.

### Page group 1: Login (241:1732 desktop, PARENT LOGIN 393:1102 phones)

- Figma calls, 8 of 60: `create_session`; `get_metadata` 393:1101 (the Parent page has only two
  frames: PARENT LOGIN 393:1102 and PARENT CALENDAR 393:1133; no sign-up, request sent, day or
  profile frame); design context and screenshot of 393:1102, 393:1133 (sparse answer) and 241:1732.
  Screenshots are in docs/feedback/figma/.
- Found: on phones our login was white with red waves where the frame is dark red (#570707) with
  white text; on a desktop the Round 2 density shrank every Login text and button below the frame
  (title 37 px where the frame scaled to 1440 gives 54, buttons 34 px high where it gives 56).
- Tests first: `client/test/plan5-login.test.ts` (7) and one new test in `auth.test.tsx`, all 8 seen
  failing, then passing with the client scan tests: 9 files, 138 of 138 on one worker (that run was
  before the last two small changes: the `--login-u` cap of 1.12 px with its test line, and the
  Regular weight of "Sign up").
- Changed: `tokens.css` (`--color-login-ground`, `--login-*` sizes, `--login-u`), `index.css`
  (`.ric-login` rules), `LoginPage.tsx`, `fields.tsx` (PasswordField takes a placeholder), new asset
  `client/src/assets/login-phone-art.svg` (5 KB, from the frame), `tokens.test.ts` and
  `contrast.test.ts` (the new token and two contrast pairs), `client/tsconfig.app.json` and
  `tsconfig.node.json` (the new node-side test file listed, as the others are).
- Browser, built app on port 3100: measured at 390x844, 360x640, 1280x720, 1366x768 and 1440x900.
  At 1440 the emblem is 129, "RICPORTAL" 47 px, title 54 px, fields and buttons 536 x 56, as the
  frame scaled; no page scroll at the three desktop sizes. Read by eye at 390 and 1440. Numbers are
  in docs/FIDELITY_REPORT.md.

The session stopped once here (usage limit; credits not enabled) and was resumed the same day.
After the resume: `npx tsc -b` clean, lint and format of the changed files clean, client scan tests
8 files 123 of 123 and the auth feature tests 2 files 40 of 40, each on one worker. Committed as
the Login group. The API on port 3100 (process 20484) had been stopped at the pause.

### Page group 2: Parent calendar (PARENT CALENDAR 393:1133) and the Parent screens without a frame

- Figma calls, 12 of 60 so far: design context and screenshot of 166:1553 (Teacher calendar, read
  now because the day panels are shared) and 378:15722 (phone calendar of the Admin page).
- Found by measurement at 390 px: the two arrow tags sat 16 px inside the page and were 44 px high
  (frame: at the screen edges, 52 px); "Assigned Parents" where the Parent frame says "Parents
  assigned"; the dish chip and the parents card had no hanging lines and were larger than drawn.
- Tests first: `DayPanels.test.tsx`, 4 of 5 seen failing (the fifth guards the Teacher's label),
  then 5 of 5. Calendar, purchase and scan tests: 10 files, 89 of 90 in the first run. The one
  failure, "shows day numbers only, never a dish name" in `MiniCalendar.test.tsx`, took 22.8 s (a
  timeout, on a file this change does not touch) and passed alone, 6 of 6. Not retried silently:
  recorded here. Same pattern as the stalls of J1d item 5.
- Changed: `DayPanels.tsx` (tags, `parentsLabel`, chip, card), `MySchedulePage.tsx` (the label),
  `index.css` (`.ric-hang`).
- Browser, built app on port 3100, parent1 with 11/13/2026 selected, 390 px wide: tags at x 0 and
  at the right edge, 52 px high; card 162 px wide; no sideways scroll. Read by eye once.
- Kept on purpose, listed in docs/FIDELITY_REPORT.md: 55 px rows (the other phone frame), the month
  title size (one font), the total inside the card.
- No frame, so "client approval needed": sign-up, request sent, row editing, Parent Profile, change
  password, the Parent desktop layout, the phone drawer.
- A first capture showed "No menu" for today: the screenshot was taken before the data arrived
  (script wait too short). With a longer wait the dish and the dots show. Not an app fault.

### Page group 3: Teacher pages (Calendar, Enrolled Students, Add Student, Child's Record, Report Status, Admin Feedback)

- Figma calls, 24 of 60 so far: design context and screenshot of 268:11404 (Admin calendar, read
  here because it decides whether the day panels may change: it has none), 78:260, 169:3189,
  258:5447, 78:284 and 78:276. Screenshots in docs/feedback/figma/. Three answers were too large
  and were saved to files by the tool; they were read with a script, not in full.
- Fixed, each with a test seen failing first:
  - Calendar (166:1553): the Purchase Request card keeps the frame's width (585 px at 1440, frame
    561), the arrow tags are 43 px high (36 before), and a dated menu heading stays on one line.
    `DayPanels.test.tsx` 6 of 6.
  - Enrolled Students (78:260): Add Student is green, the search box has the magnifier and is 271 px
    wide (frame 267), the location line has the pin, the edit icon is green and the archive icon
    gray. `StudentsPage.test.tsx`: 4 new tests failed, then 7 of 7.
  - Report Status (78:284): the Teacher's list heading is "Recent Submitted Reports". New
    `ReportsPage.test.tsx`: 1 of 2 failed, then 2 of 2 (the other guards the Admin's heading).
- My own mistakes on the way, corrected: the first version of the four Students tests failed for
  the wrong reason (my test row lacked `schoolYear`, `gender` and `enrolledOn`); the icon color test
  found two buttons because the table and the phone cards both render them, so it now checks all
  of them; the first green on the edit icon lost to the button's own text class in the built CSS
  (seen in the browser: still black), so the class is now marked important and the browser shows
  rgb(2, 91, 2).
- Browser, built app on port 3100, teacher.sibujo at 1440x900 (and Students at 390x844): the
  numbers above; no sideways scroll.
- Not changed, with the reason in docs/FIDELITY_REPORT.md: the calendar's full width and month
  title, the centered Assign Parents dialog, the Liquidation overlay, the Add Student form, the
  Child's Record cards (one item left for the Developer: the frame's narrower cards).
- NOT verified: Report Status and Admin Feedback with real rows (the local database has no
  reports; both were compared in their empty state only); the year cards under Enrolled Students
  (one school year in the local data).
- Not read: 78:268 (Coming soon), 254:4572 (DEC-050), 175:1023 (measured on 2026-11-14, DEC-053),
  the two Admin login frames (DEC-037).
- Capture notes: two captures showed loading skeletons or missing images because the laptop was
  slow; they were taken again with longer waits. The script now loads the home page once after
  login before the first capture.

### Page group 4: Admin pages and Teacher Profile (code committed; report sections still to write)

- Figma calls, 30 of 60 so far: design context and screenshot of 88:695 (Teacher Profile),
  267:9689 (Admin dashboard), 268:12661 (Admin Reports); screenshot only of 267:9862 (RIC Teachers;
  its content is one flat image, measured in Round 3). Saved in docs/feedback/figma/.
- Teacher Profile (88:695): matches the frame's layout (header card, four report cards, Recent
  Submitted Reports, Recent Status Activity). No change.
- Changed, each with a test seen failing first, NOT committed:
  - `DayPanels.tsx`: without a parents panel (the Admin's calendar) the grid has two columns, so the
    Purchase Request is no longer squeezed into the 14rem column (measured before: 172 px wide at
    1440). `DayPanels.test.tsx`: 1 new test failed, then the calendar folder 5 files 43 of 43.
  - `AdminDashboardPage.tsx`: the five card numbers are dark green (`text-accent`) as in 267:9689.
    1 new test failed, then the file 11 of 11.
- Compared, not changed yet (to be written in docs/FIDELITY_REPORT.md): Admin Calendar 268:11404
  (the upload panel sits beside the calendar from the top, Plan 4 D6, kept); Admin Reports
  268:12661 (its four type cards, five tabs, Month and Teacher filters and the side filter panel are
  Objective 3 or J3 (e) items; ours has three status cards and the filter panel below the list at
  1440, Round 1 decision); RIC Teachers 267:9862 (close; differences: title size, the blue-green
  Add New Teacher is red in ours, the info note under the table is missing).

**Stopped here (2026-11-17): the system stopped the API on port 3100 because memory was critically
low.** Per DEC-035 and the system notice it was not restarted, and no heavy command was run after
it. Port 3100 is free. Model at the stop: Opus 5.5 (the plan's model for J2).

To resume J2:
1. `npx tsc -b`, lint and format of `client/src/features/calendar` and
   `client/src/features/dashboard`, then commit the four changed files and the four screenshots.
2. Rebuild the client, start the API on 3100, measure the Admin calendar panels and the dashboard
   numbers at 1440x900, and the four Admin pages at 390x844 (captured once before the stop, not
   read).
3. Write the Admin sections of docs/FIDELITY_REPORT.md (Calendar, Dashboard, Reports, RIC Teachers,
   Teacher Profile, Admin Profile 267:9887 and 378:16539, Admin Students without a frame).
4. Remaining frames not read: 267:9887 (Admin Profile), the phone frames 378:15917 (Reports),
   378:16285 (RIC Teachers), 378:16539 (Profile).
5. DEC-056 for the J2 decisions (login tokens and the dark phone ground, day panel changes, kept
   differences), docs/tokens.md rows for `--color-login-ground` and `--login-*`, UI_MAP, then the
   J2 summary.

### J2 resumed (Tue 2026-11-17, Opus 5.5)

- Step 1 done: `npx tsc -b` clean; eslint and prettier clean on the four changed files;
  `DayPanels.test.tsx` and `AdminDashboardPage.test.tsx` 2 files, 19 of 19 on one worker.
  Committed by file name with the four Figma screenshots: "fix(admin): the Admin calendar day
  panels use two columns and the dashboard numbers are dark green ..." (no attribution line,
  checked with `git log -1 --format=%B`).
- Step 2, demo seed (NOT COMMITTED, NOT run on the dev database yet):
  - `server/prisma/demo-seed.ts`: 4 children of the school year before the current one (fake
    names, enrolled 2025-06-09), and one liquidation report for each of the three Monday to
    Friday weeks before this week, made through the real services (rows added, every menu day
    locked, submit, Admin review): newest SUBMITTED, then NEED_REVISION with a fixed Admin
    feedback text, then APPROVED. A week without a menu is skipped. Each report's submit time is
    its Friday 08:00 UTC. Still cleared and rebuilt on each run; the guard is unchanged.
    `seed-demo.ts` prints the new counts.
  - `server/test/db/demo-seed.test.ts`: `counts()` now also counts earlier-year students,
    reports, reviews and snapshots, and "locked" means locked days outside a report (the demo's
    one locked day; a NEED_REVISION report reopens its days). The two tests that expected 0
    reports after a re-seed now expect the seeded state back and no rehearsal report (2026-11-09):
    the requirement changed, the check is as strict. New block "seedDemo reports and earlier
    school year (J2)" at the clock 2026-11-17: the three statuses by period, Admin queue of 3 with
    totals above 0, the Teacher's feedback row (D10), 4 earlier-year and 18 current students, and
    re-running gives the same state.
  - Tests first: 4 failed for the right reason (no reports, no earlier-year students). After the
    code: 9 of 11, then my own wrong expectation fixed (I assumed the fixture menu starts on
    2026-10-26; it has the week of 2026-10-19 too, so three reports come out at the test clock as
    well). Last run: 9 of 11. "creates the demo state" timed out at 15 s (it ran in 5.9 s in the
    first run), and "re-running restores the state" then saw different counts, most likely
    because the timed-out seed was still writing when the next test began. Not retried.

**Stopped here (2026-11-17): free memory low.** After that test run Windows had 464 MB, then
420 MB, free of 3858 MB. The largest processes were claude.exe 278 MB, Code.exe 170 MB, Chrome
(about 500 MB over several processes), SnippingTool 83 MB, and an unknown node.exe 56 MB
(PID 14036, not started here, left alone). No server was started in this session; port 3100
was not used.

To resume J2:
1. With more free memory (close Chrome, the Snipping Tool, and VS Code if not needed), run
   `npx vitest run --project db --maxWorkers=1 server/test/db/demo-seed.test.ts` once. If
   "creates the demo state" still takes more than 15 s with enough memory, give the seed tests a
   longer timeout (the seed now locks 15 more days and submits 3 reports).
2. tsc, eslint and prettier on the three changed files, commit them, then run
   `npm run db:seed:demo` once on the dev database.
3. Then steps 3 to 5 of the Developer's J2 order (Admin pages in the browser at 1440x900 and
   390x844, the frames 267:9887, 378:15917, 378:16285, 378:16539, Report Status and Admin
   Feedback with the seeded data, FIDELITY_REPORT, DEC-056, tokens, UI_MAP, J2 summary).

### Developer's lean order (Wed 2026-11-18, Opus 5.5, 3.8 GB laptop: no browser, changed files only)

Step 1, seed (done). Free memory at the start of the step: about 1 GB.
- `npx vitest run --project db --maxWorkers=1 server/test/db/demo-seed.test.ts` once, alone:
  1 file, 11 of 11 in 34 s. No test timed out, so the timeouts were NOT changed (the earlier
  timeout was the low-memory run).
- eslint and prettier on the three seed files: clean. Committed by file name: "feat(seed): the
  demo seed adds earlier-year children and three reviewed liquidation reports (J2)".
- `npm run db:seed:demo` once: "18 children (and 4 of the year before), 14 assigned days,
  3 reports."

Step 2, GitHub Actions workflow (done, UNVERIFIED). `.github/workflows/ci.yml`: install, typecheck,
lint, format check, unit, db and client tests as separate steps (one worker each) with a MariaDB 10.11
service container, build; Node 22; no secrets; no deployment. Prettier clean on the file. It has
never run (it cannot run here). Reasons in DEC-057. No GitHub setting or secret is needed.

Step 3, J5 documentation (done; text only, no tests needed). Five commits:
- docs/API.md: an endpoint index of all 79 routes, generated from `MATRIX` in the permission matrix
  test and counted against the routers (79 both); the stale "planned endpoints" heading renamed.
- docs/DATA_MODEL.md: a whole-schema Mermaid erDiagram (18 tables, keys, relations, unique keys).
- docs/UI_MAP.md: one table of every route with role, Figma frame and state.
- docs/blueprint/03-blueprint.md: A-14 (Parents edit the description too), A-16 (built read-only),
  A-18 (Teacher home follows 175:1023, no separate Today's Feeding card), BR-19 (per-address limit,
  logout). docs/BUSINESS_RULES.md: eight register rows for DEC-051, 053, 054, 055. There is no DEC
  list inside the blueprint; the register is the list of rule changes by decision.
- docs/CHANGELOG.md (unreleased section after v0.9.8-demo) and README (demo data, build and start,
  CI, documentation; the stale P0-T15 lines removed).
- New: docs/ANNEX_A_CHANGES.md, docs/PAPER_CHANGES.md (PC-01 to PC-18), docs/OPEN_QUESTIONS.md
  (OQ-01 to OQ-27, each with its default), listed in docs/INDEX.md.
- Not done: the final ERD and DFD (Phase 8, as the plan says).

Step 4, J2 without a browser (STOPPED at the start).
- Free memory before the step: 831 MB. `create_session` on the working copy, then
  `get_design_context` on Admin Profile 267:9887: no answer for 30 minutes, the tool stopped it.
  Not retried. Free memory right after: 442 MB, under the 500 MB line, so text-only work from here.
- Text-only work done: docs/FIDELITY_REPORT.md section "Admin pages" written from the 2026-11-17
  measurements (the two Admin fixes marked "needs Developer visual check"); docs/components.md Figma
  call table brought up to date (33 of 60; the earlier "30" was a miscount, the table gives 31).

**Stopped here (2026-11-18): free memory 442 MB, under the Developer's 500 MB line.** No server,
browser or test is running from this session.

What remains, in order, when the Developer says memory is free:
1. Step 4: read 267:9887, 378:15917, 378:16285 and 378:16539 once each (design context plus one
   screenshot; 8 calls, which brings Plan 5 to 41 of 60), save the screenshots in
   docs/feedback/figma/, write layout notes, make the differences with tokens and existing
   components, list each in docs/FIDELITY_REPORT.md as "needs Developer visual check"; RIC Teachers
   267:9862 differences (title size, button color, info note) are already known and can be made then.
   Then DEC-056 (J2 decisions), docs/tokens.md rows for `--color-login-ground` and `--login-*`.
2. Step 5, J3 server logic first, tests first and seen failing, one test file at a time, one commit
   per item: (a) replace-on-import, (b) Admin System settings from the Admin Profile, (c) previous
   school year filter read-only, (d) budget progress bar, (e) Admin Reports filters.
