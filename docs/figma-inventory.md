# Appendix B: Figma Screen Inventory (fill this in Phase 0)

| Screen ID | Screen name | Figma frame link | Role | Phase | In Annex A? | API used | Spec written | Built |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-P1-01 | Login |  | All | P1 | Yes | auth |  |  |
| S-P1-02 | Parent sign-up | none: designed by the Developer with Claude; no client Figma frame; client approval requested | Public | P1 | Yes | auth, public centers | [ui-specs/parent-screens.md](ui-specs/parent-screens.md) |  |
| S-P1-07 | Request sent | none: designed by the Developer with Claude; no client Figma frame; client approval requested | Public | P1 | Yes | auth | [ui-specs/parent-screens.md](ui-specs/parent-screens.md) |  |
| S-P1-03 | Admin: Centers |  | Admin | P1 | Yes | centers |  |  |
| S-P1-04 | Admin: Teachers |  | Admin | P1 | Yes | teachers |  |  |
| S-P1-05 | Teacher: Parent requests |  | Teacher | P1 | Yes | parents |  |  |
| S-P2-01 | Student list |  | Teacher | P2 | Yes | students |  |  |
| S-P2-02 | Student profile and Child's Record |  | Teacher | P2 | Yes | students, child-records |  |  |
| S-P2-03 | Enrollment Form dialog |  | Teacher | P2 | Yes | enrollment form |  |  |
| S-P3-01 | My Reports and submit |  | Teacher | P3 | Yes | reports |  |  |
| S-P3-02 | Reports queue and review |  | Admin | P3 | Yes | reports |  |  |
| S-P4-01 | Menu Imports |  | Admin | P4 | Yes | menu |  |  |
| S-P4-02 | Feeding calendar |  | Admin, Teacher | P4 | Yes | calendar |  |  |
| S-P5-01 | Weekly assignment board |  | Teacher | P5 | Yes | assignments |  |  |
| S-P5-02 | Purchase Request editor (Teacher only; the Parent uses S-P5-04) |  | Teacher | P5 | Yes | purchase-requests |  |  |
| S-P5-04 | Parent day screen | none: designed by the Developer with Claude; no client Figma frame; client approval requested | Parent | P5 | Yes | purchase-requests | [ui-specs/parent-screens.md](ui-specs/parent-screens.md) |  |
| S-P6-01 | Liquidation Forms overlay |  | Teacher, Admin | P6 | Yes | liquidation |  |  |
| S-P7-01 | Admin Dashboard |  | Admin | P7 | Yes | dashboard |  |  |
| (more) | Any screen in the prototype not listed above |  |  |  | Check! |  |  |  |

Any row marked "No" or "Check!" that is not covered by Annex A is a change request, not part of this build.

## Notes (P0-T11, 2026-11-04)

- Working copy: `EetVyXPcJxatZKCElGlqr6` (docs/figma-link.txt). Node ids match the original file.
- Parent frames in the copy: PARENT LOGIN (393:1102) and PARENT CALENDAR (393:1133) exist but were not read in P0-T11. Parent sign-up (S-P1-02), Request sent (S-P1-07) and the Parent day screen (S-P5-04) have no client frame (docs/ui-specs/parent-screens.md).
- Tokens read so far are in docs/tokens.md. Not tokenized yet (BACKLOG): the Admin dashboard card's per-side border widths (267:9808), form spacing (add enroll 258:5447 uses hand-placed gaps), and the 13 one-off shadows beyond the three shadow tokens.

## Notes (P0-T12a step A, 2026-11-05)

- Page `0:1` is "RIC teacher": desktop Teacher frames, Login, and 390-wide mobile layouts. It has no component or style sheet. Admin and Parent frames are on other pages (not opened). Details and node ids: docs/components.md.
- Developer-designed UI kit parts (no client frame): Stamp and LedgerTable, specified in docs/ui-specs/ui-kit.md, client approval requested.

## Notes (demo polish F1, 2026-11-07)

- Assets exported from this file into `client/src/assets` (DEC-037, D1): emblem 241:1100, photo 241:1101, waves 241:1085, login icon 241:1113, sidebar icons 77:136 to 77:141 and 166:580, 166:778, logout 169:3049, avatar 111:962, footer logos 268:10485, 268:10498, 268:10507, footer icons 268:10529, 268:10530.
- Admin page frames: ADMIN 267:9689, ADMIN2 268:11404, ADMIN3 268:12661, ADMIN4 267:9862, ADMIN5 267:9887, Login 272:16383, Calendar mobile 378:15722, Reports mobile 378:15917, RIC teachers mobile 378:16285, Profile mobile 378:16539, Admin phone login 380:1149.
- Teacher page frames: RIC calendar 166:1553, RIC dashboard 175:1023, submit report 78:268, RIC 4 78:276, report status 78:284, profile 88:695, enrolled studs 78:260, Child's record 169:3189 and 254:4572, add enroll 258:5447.
- Calendar mobile 378:15722 shows the phone top bar. No frame shows the menu drawer (DEC-037).
