# Backlog

Deferred ideas: item, who asked, reason, and the phase it might belong to.

| Item | Who asked | Reason | Phase |
| --- | --- | --- | --- |
| Admin dashboard card (267:9808): read in P0-T12a, bottom border only, 4px `accent`; no new token needed (docs/components.md) | Developer (P0-T11) | Resolved 2026-11-05 | P7 |
| Form spacing: Figma add enroll (258:5447) uses hand-placed gaps (row gaps 54 to 72 px, field gaps 15 to 26 px); Tailwind's default scale is used instead | Developer (P0-T11) | Not copied on purpose (DEC-022) | P2 (Child's Record form) |
| 13 one-off shadows on the Admin and Teacher pages beyond header, card and panel (for example 175:1044 double shadow, 361:2236 at 9.4%, 378:16685 at 14.5%) | Developer (P0-T11) | Only three shadow tokens allowed (DESIGN_LANGUAGE rule 7) | Ask the client if a screen needs one |
| Card number color #003800 (267:9811) and tile border #AAAAAA (267:9816, 2.32:1) | Developer (P0-T11) | One-off values, not tokenized | P7 (Admin dashboard) |
| Check the CSP in a real browser (no violations for fonts, styles or scripts) | Developer (P0-T11) | Express does not serve client/dist yet | P0-T15 |
| Give the ESLint script a larger memory limit with a Node flag (for example `node --max-old-space-size=4096` in front of eslint), no new dependency | Developer (P0-T11) | Lint crashed twice with out-of-memory errors on this machine (DEC-027) | P0-T14 (CI) |
| Ask the client about Figma's "Rejected" and "Pending" badges: they are not agreed statuses (BR-07 has Submitted, Need Revision, Approved) | Developer (P0-T12) | DEC-028 | Before Phase 3 |
| Searchable select for the 28 centers (Parent sign-up S-P1-02). Options: native select (0 KB, no search); `input` + `datalist` (0 KB, cannot force a valid choice, uneven screen-reader support); own ARIA combobox (about 3 KB, no dependency, about 200 lines to write and test); Downshift `useCombobox` (about 9 KB gzip, headless); React Aria ComboBox (about 30 KB or more). Suggested: native select first, then Downshift or our own if search is required | Developer (P0-T12) | No dependency in Phase 0 | P1 (P1-T14) |
| Two icon styles in the client's Figma: raster flat icons on the desktop Teacher frames and Lucide-named vector icons on the mobile layouts. Ask which style the client wants | Developer (P0-T12) | docs/components.md | P0-T13 (shells) |
| Confirm the status wording and tones with the client: BR-07 labels Submitted, Need Revision, Approved (and Declined for Parents) with tones success, info, warning, danger (DEC-028). The mobile Figma pill 361:2415 says "Needs Revision" in red | Developer (P0-T12) | DEC-028 | Before Phase 3 |
| Ask the client about the dark green button #003E00 (152:597 "View Profile"), which is not a token and conflicts with DESIGN_LANGUAGE rule 6 (red = action) | Developer (P0-T12) | docs/components.md conflicts | Phase 2 (student profile) |
| Speed up client tests by sharing the jsdom environment (Vitest `pool: "vmThreads"` or `isolate: false`; Vitest reports jsdom setup as about half the run time). Risk: state leaking between test files (DOM, timers, module state) | Developer (P0-T12a) | DEC-029 | P0-T14 (CI) or later |
| Import the shared status enums into StatusBadge instead of its local list: account status (Declined) in Phase 1, report status (Submitted, Need Revision, Approved) in Phase 3 | Developer (P0-T12a) | DEC-028 | P1 and P3 |
| npm audit: 2 moderate advisories on `uuid` below 11.1.1, through exceljs 4.4.0 (the latest exceljs). Reached only by the Admin's Excel import; no fix without a major change | Sprint S3 | Re-check before release | P8 |
| Everything in docs/SPRINT_SHORTCUTS.md: restore after the demo as the client decides, including the Login photo and emblem | Developer (sprint) | Cut for the demo on 2026-11-10 | Hardening |
| CI workflow (P0-T14), /__ui gallery (T12c) and its production-exclusion check, and the phase gates for phases 0 to 6 | Sprint plan | Out of the sprint scope | After the demo |
| React Hook Form was not used (DEC-030); decide whether to adopt it or update CLAUDE.md | Developer (sprint) | Not on the approved package list | After the demo |

- Remove `@fullcalendar/list`, unused since the polish F2 (DEC-038). Left in place so package files do not change this close to the demo. Asked by: Claude. Phase: 8.
- Remove `generateTemporaryPassword` and its test, unused since D6 (DEC-040). Asked by: Claude. Phase: 8.
- Look at the PDF library's notices about URL and local file access policies, and set them if needed (POLISH_LOG, F6). Asked by: Claude. Phase: 8.
- Watch for the intermittent 404 in `assignments-week.db.test.ts` (POLISH_LOG, F6). The setup now prints the real cause if it returns. Most likely cause: docs/AUDIT_REPORT.md section 4 and AUD-015. Asked by: Claude. Phase: 8.
- FullCalendar's icon font is a data: URL, which the font-src 'self' policy blocks, giving one console error on calendar pages. Harmless: the toolbar with those icons is replaced. Remove the error in hardening. Asked by: Claude. Phase: 8.
- `.playwright-mcp/` is not in .gitignore. Add it if the Playwright tool stays in use. Asked by: Claude. Phase: 8.
- Apply the global rate limit to /api only, not to the built client's files. Today every image and script counts toward the 5000 requests in 15 minutes, and the browser audit reached it (POLISH_LOG). Add a stricter limiter for login. Asked by: Developer. Phase: 8.
- Make the upgrade-insecure-requests policy production-only. It comes from the Helmet defaults in `core/middleware/pipeline.ts`, and it can stop scripts and images loading over plain http on the local network, such as from a phone (not tested). localhost is not affected. Asked by: Developer. Phase: 8.
- Reduce the 759 kB main script with code splitting. Asked by: Developer. Phase: 8.
- Allow or remove FullCalendar's inlined icon font. The Content Security Policy blocks its data: URL, which logs one console error on calendar pages. No icon uses it, because the toolbar is off. Found in the Round 2 browser check; not caused by it. Asked by: nobody yet. Phase: 8.

## From the code audit (docs/AUDIT_REPORT.md, Plan 5 J1, 2026-11-14)

The three high findings (AUD-001 to AUD-003) are fixed. These are the medium and low ones. Evidence and the
proposed fix for each are in the report. "Plan" names the Plan 5 stage that could take the item; the stages
were written before the audit, so the Developer decides which ones really go in.

| Id | Severity | Item | Size | Plan |
| --- | --- | --- | --- | --- |
| AUD-004 | Medium | Lock, unlock, no-feeding and submit change the status without a condition; unlock at the same moment as submit can leave an editable day in a submitted report | M | Phase 8 |
| AUD-005 | Medium | Double click on the week save can answer 500; map Prisma P2002 and P2034 to 409 | S | J4 |
| AUD-006 | Medium | Double click on sign-up, Add Teacher, Add Student, Add Center answers 500; one active Teacher per center is checked only in code | S | J4 |
| AUD-007 | Medium | Menu import: long menu, sheet or PR text, or a fractional day number, passes the preview and fails on confirm with 500 | S | J3 (a) |
| AUD-008 | Medium | Liquidation submit turns every error into 409 and logs nothing | S | Phase 8 |
| AUD-009 | Medium | Built-in JWT secret and passwords are used whenever NODE_ENV is not production. Must be closed before any deployment | S | Before deployment |
| AUD-010 | Medium | No login limit per IP (BR-19, P1-T07) | S | J4 (a) |
| AUD-011 | Medium | The shared default password (D6): ask the client to accept it or choose a one-time password | M | OPEN_QUESTIONS (J5) |
| AUD-012 | Medium | Logout does not end the session token on the server | S | J4 |
| AUD-013 | Medium | Optional fields cannot be emptied once set (middle name, religion, conference time, remarks, barangay, mobile) | M | Phase 8 |
| AUD-014 | Medium | Child's Record entries can be changed for a child of an earlier school year | S | J3 (c) |
| AUD-015 | Medium | Prisma's default transaction limits (2 s, 5 s) give 500 on a slow database | S | J4 |
| AUD-016 | Medium | Rate limit counts static files; TRUST_PROXY must match the host | S | J4 (a) |
| AUD-017 | Medium | PDF text outside the built-in font prints wrong; embed a Unicode font | M | J6 |
| AUD-018 | Medium | Entry lists and the Admin age summary are not paged | M | Phase 8 |
| AUD-019 | Medium | Unexpected Prisma errors can put personal data in the log | S | J4 |
| AUD-020 | Medium | No concurrent tests for lock, submit and week save; several rules have no test that names them | M | Phase 8 |
| AUD-021 | Medium | A moved Teacher still sees the old center's reports on the Profile | S | Phase 8 |
| AUD-022 | Medium | Rows inserted with raw SQL get local time (confirmed); set the session time zone to UTC | S | J4 |
| AUD-023 | Low | Unknown-username throttle is in memory and can be flushed | S | J4 (a) |
| AUD-024 | Low | Anyone can keep an account locked (BR-19 by design); tell the client | S | OPEN_QUESTIONS (J5) |
| AUD-025 | Low | Sign-up shows that a username exists | S | Accept |
| AUD-026 | Low | Profile PATCH without `mobile` clears it for the Admin and Teachers | S | Phase 8 |
| AUD-027 | Low | A day with no rows or unfinished rows can be locked and submitted | S | OPEN_QUESTIONS (J5) |
| AUD-028 | Low | A repeated Approve answers 409 instead of the current state (blueprint 4.8) | S | Phase 8 |
| AUD-029 | Low | Small layering departures (Decimal import in `core/money.ts`, hand-made center checks, two unshared query schemas) | S | Phase 8 |
| AUD-030 | Low | Duplicate helpers in repositories; unused `generateTemporaryPassword` and `@fullcalendar/list` | S | Phase 8 |
| AUD-031 | Low | Renumbering and settings reads use one query per row or key | S | Phase 8 |
| AUD-032 | Low | Menu preview is kept in memory (DEC-036) | M | Accept or Phase 8 |
| AUD-033 | Low | A small Excel file can expand to a very large workbook | M | Phase 8 |
| AUD-034 | Low | The PDF queue has no length or time limit | S | Phase 8 |
| AUD-035 | Low | No `Cache-Control: no-store` on API data and PDFs | S | J4 |
| AUD-036 | Low | Every page is titled "RICPortal"; no skip link | S | J2 |
| AUD-037 | Low | docs/API.md misses 15 routes and has two stale lines | M | J5 |
| AUD-038 | Low | Blueprint 4.3, 4.5, BR-19 and CLAUDE.md differ from the code | S | J5 |
| AUD-039 | Low | 11 moderate npm advisories (uuid through exceljs; minimatch through the lint tools); four packages without a licence field | S | J4 (g) |
| AUD-040 | Low | A rate that is not a number in the settings table gives 500 | S | J3 (b) |
| AUD-041 | Low | A disabled Parent still shows on assigned days and in the team | S | Phase 8 |
| AUD-042 | Low | Sign-up is limited only by the global limit | S | J4 (a) |
