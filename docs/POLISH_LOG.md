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
