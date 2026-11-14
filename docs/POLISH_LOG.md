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
