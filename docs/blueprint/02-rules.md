# 3. Working Rules

## 3.1 The task loop (Claude follows this for every task)

| Step | Claude does | Stops and asks when |
| --- | --- | --- |
| 1. Read | Read CLAUDE.md, the current phase file and the Business Rules cited by the task | A rule is unclear, missing or conflicts with another document |
| 2. Plan | In Plan Mode, list files to create or change, the tests to write and any questions | The plan touches files outside the task |
| 3. Test first | Write failing tests from the Done-when (rules, permissions, scoping, validation) | The Done-when is not testable |
| 4. Build | Implement only this task, in the layers defined in 4.4 | A dependency or a new table seems needed that the task does not list |
| 5. Verify | Run `npm run check`; give the Developer manual steps to verify in the browser | Any check fails and the cause is unclear |
| 6. Document | Update the documentation outputs listed in Section 8 |  |
| 7. Summarize | List files changed, tests added, decisions made, and what the Developer must check by hand |  |

Items that require a human (manual browser checks, comparing PDFs with official forms, client sign-offs) are marked in the phase tasks and gates. Claude prepares the steps and waits for the Developer's confirmation.

## 3.2 Definition of Done (task)

- The Done-when in the task row is true and was demonstrated, not assumed.
- Typecheck, lint, unit and integration tests pass locally.
- Input is validated with the shared Zod schema; errors use the standard error shape.
- Permission and center-scope checks exist on every new endpoint, with a negative test (wrong role and wrong center).
- Loading, empty, error and success states exist for any new screen.
- No `any`, no `console.log`, no commented-out code, no TODO without an entry in BACKLOG.md.
- The code is simple enough for the Developer to explain; the task summary includes a two-sentence plain explanation.
- Committed, and PHASE_LOG.md updated.

## 3.3 Phase Gate Checklist (applies to every phase; do not start the next phase until all boxes are ticked)

☐  Every task in the phase is Done and committed.

☐  `npm run check` is green on a fresh clone (`npm ci` first).

☐  A phase audit of every item in this checklist was run and its findings fixed or logged.

☐  Permission matrix test passes for all routes added so far (wrong role = 403, wrong center = 404 or 403, no login = 401).

☐  No feature from a later phase exists in the code (scope-lock check: search for names of later modules).

☐  Manual pass as each role that exists in the phase, on desktop and on a 360 px wide phone viewport.

☐  Every new screen has loading, empty, error and forbidden states, and no console errors or warnings.

☐  Dates, money and statuses behave exactly as the Business Rules register says.

☐  Database migrations are committed, reversible by restore, and applied to the staging copy on Hostinger.

☐  Deployed to staging (or production skeleton) and smoke-tested there, not only on your laptop.

☐  docs/ updated (DATA_MODEL, API, BUSINESS_RULES, UI_MAP) to match the code.

☐  Git tag created (e.g. `v0.2.0` for Phase 2) and PHASE_LOG.md has a gate entry.

## 3.4 Scope lock

Each phase section lists **Build** and **Do NOT build**. If Claude proposes something from the Do NOT list, or anything not in Annex A, answer with: "Out of scope for this phase. Add it to BACKLOG.md and continue with the task." A feature that is not in Annex A is a change request under Agreement Section 9, not a favour.

## 3.5 Branches and commits

- `main` is always deployable. Work happens on a branch per phase: `phase-1-auth`, `phase-2-students`, and so on.
- Commit format: `type(scope): message` (`feat`, `fix`, `test`, `refactor`, `docs`, `chore`).
- Merge the phase branch into main only at the gate, then tag it.
- Never commit `.env`, uploads, database dumps or real data. A `.env.example` with fake values is committed.
- Database changes only through Prisma migrations, committed with the code that uses them. Never edit tables by hand.

## 3.6 Bug-prevention guardrails

| Guardrail | How | Set up in |
| --- | --- | --- |
| Strict TypeScript | `strict: true`, `noUncheckedIndexedAccess`, `no-explicit-any` as a lint error | P0 |
| Validate all input at the edge | One shared Zod schema per request body, used by both client forms and server routes | P0, then every phase |
| Fail fast on bad config | `env.ts` validates all environment variables at startup and exits with a clear message | P0 |
| One error shape | All errors pass through one error handler returning `{ error: { code, message, details } }` | P0 |
| Money is never a float | Prisma Decimal / decimal.js; compute on the server only | P5 |
| Dates are date-only strings | `YYYY-MM-DD`, no JS Date to ISO conversion for calendar days (BR-09) | P4 |
| Transactions for multi-step writes | Import confirm, report submit, liquidation submit are one transaction | P3 to P6 |
| Optimistic concurrency | `version` column checked on edit; conflict returns 409 | P5 |
| Permission matrix test | A table-driven test hits every route as every role and asserts the expected status | P1, extended each phase |
| Pinned dependencies | `save-exact`, lockfile committed, no upgrades during the build | P0 |
| CI on every push | GitHub Actions runs install, typecheck, lint, test, build | P0 |
| Staging before production | Every phase gate is deployed and smoke-tested on Hostinger | P0 onward |
| Hooks | Claude Code hooks auto-format files and block edits to `.env` and applied migrations | P0 |

## 3.7 Preventing downtime

- **Additive-only migrations** (add columns and tables; do not drop or rename in the same release). The previous version of the code keeps working with the new schema, so a rollback is safe.
- **Backup before every deploy** (database export plus a git tag). Restore is tested once in Phase 8, not first discovered in an emergency.
- **Deploy in a quiet window** (late evening or early morning) and run the smoke test right after (Section 6).
- **Health check**: `/api/health` checks the database. Point a free uptime monitor at it.
- **No dependency upgrades or "quick refactors"** within 3 days of a deploy.
- **Rollback plan**: redeploy the previous tag; restore the database backup only if a migration was destructive (it should never be).
