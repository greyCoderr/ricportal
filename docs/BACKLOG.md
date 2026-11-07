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
- Watch for the intermittent 404 in `assignments-week.db.test.ts` (POLISH_LOG, F6). The setup now prints the real cause if it returns. Asked by: Claude. Phase: 8.
