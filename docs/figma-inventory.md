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
