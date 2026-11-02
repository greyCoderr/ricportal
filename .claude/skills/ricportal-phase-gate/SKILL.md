---
name: ricportal-phase-gate
description: Use at the end of a phase to audit it before the gate. Run with /ricportal-phase-gate
---
Audit the current phase. Do not fix anything yet. Report a table of findings with severity.
1. Run npm run check and report the result.
2. List every route added in this phase with its role and expected status; compare with the
   permission matrix in docs/blueprint/03-blueprint.md (4.1) and the permission matrix test.
3. Check every query for center scoping.
4. Check every request body for Zod validation.
5. Confirm each business rule owned by this phase has a test.
6. Search for code or names from later phases (scope leak).
7. Find duplicate or unused files and functions.
8. Confirm docs/API.md, DATA_MODEL.md, UI_MAP.md and PHASE_LOG.md match the code.
9. Find leftover TODO, any, console.log and commented-out code.
10. List the manual checks the Developer must still do (from the phase file's gate section).
