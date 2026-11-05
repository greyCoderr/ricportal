# Backlog

Deferred ideas: item, who asked, reason, and the phase it might belong to.

| Item | Who asked | Reason | Phase |
| --- | --- | --- | --- |
| Read the per-side border widths of the Admin dashboard card (267:9808, stroke weight "mixed") and decide whether a token is needed | Developer (P0-T11) | Not read in P0-T11 (one read per node) | P0-T12 or P7 |
| Form spacing: Figma add enroll (258:5447) uses hand-placed gaps (row gaps 54 to 72 px, field gaps 15 to 26 px); Tailwind's default scale is used instead | Developer (P0-T11) | Not copied on purpose (DEC-022) | P2 (Child's Record form) |
| 13 one-off shadows on the Admin and Teacher pages beyond header, card and panel (for example 175:1044 double shadow, 361:2236 at 9.4%, 378:16685 at 14.5%) | Developer (P0-T11) | Only three shadow tokens allowed (DESIGN_LANGUAGE rule 7) | Ask the client if a screen needs one |
| Card number color #003800 (267:9811) and tile border #AAAAAA (267:9816, 2.32:1) | Developer (P0-T11) | One-off values, not tokenized | P7 (Admin dashboard) |
| Check the CSP in a real browser (no violations for fonts, styles or scripts) | Developer (P0-T11) | Express does not serve client/dist yet | P0-T15 |
| Give the ESLint script a larger memory limit with a Node flag (for example `node --max-old-space-size=4096` in front of eslint), no new dependency | Developer (P0-T11) | Lint crashed twice with out-of-memory errors on this machine (DEC-027) | P0-T14 (CI) |
