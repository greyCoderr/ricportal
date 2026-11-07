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
