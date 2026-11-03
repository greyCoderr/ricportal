# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 0: Foundation and Deployment Skeleton

| Item | Value |
| --- | --- |
| Goal | An empty but production-shaped system: client, server, database, CI, design tokens, and a health check, deployment-ready locally (Hostinger deploy POSTPONED, DEC-006) |
| Depends on | Signed agreement, Hostinger Node.js plan, Figma link, GitHub repo |
| Branch and tag | `phase-0-foundation`, tag `v0.0.1` |

**Build:** repository and workspaces; TypeScript strict; lint, format, tests; environment validation; Prisma connected to MySQL with the `settings` table; logging, error handling, security middleware; health endpoint; Vite app with router shell, API client and TanStack Query; design tokens and the reusable UI kit from Figma; layout shells with placeholder navigation; CI; deployment of the skeleton; project files for Claude.

**Do NOT build:** login, users, centers, students, reports, calendar, import, forms, dashboard, or any screen other than the UI kit gallery and the shells.

**Figma screens to read:** the design system or style page (colors, typography, buttons, inputs, tables, modals, badges), and the overall layout of one screen per role (to build shells). Nothing else.

**Data:** table `settings` (key, value). Seed keys: `perChildDailyRate` = 25.00, `currentSchoolYear` = "2026-2027" (confirm the year with the client).

**API:** `GET /api/health` returns `{ data: { status: "ok", db: "up", time } }` and 503 if the database is down.

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P0-T01 | Create the GitHub repo. Add npm workspaces (`shared`, `server`, `client`), `.nvmrc`, `.npmrc` with `save-exact=true`, `.gitignore` (node_modules, .env, uploads, dist), `.env.example` | root files | Fresh clone plus `npm ci` works; `.env` is ignored |
| P0-T02 | Strict TypeScript config for all workspaces (`strict`, `noUncheckedIndexedAccess`), path aliases, project references | tsconfig files | `npm run typecheck` passes in all workspaces |
| P0-T03 | ESLint (no-explicit-any, no-console as error) and Prettier. Scripts: `lint`, `format`, `check` (typecheck, lint, test, build) | eslint and prettier config, root package.json | `npm run check` runs end to end |
| P0-T04 | Server skeleton: `server.ts`, `app.ts`, `config/env.ts` (Zod-validated env; exit on invalid), `core/logger.ts` (pino, redact password and cookie fields) | server/src | Server starts with a valid `.env`; with a missing variable it exits with a readable message |
| P0-T05 | Core helpers: error classes, `errorHandler`, 404 handler, `asyncHandler`, response helpers (`ok`, `created`, `paginated`), request id | server/src/core | A route that throws returns the standard error shape; unknown route returns 404 shape |
| P0-T06 | Security middleware: helmet, compression, JSON body limit, global rate limit, cookie-parser, trust proxy setting for Hostinger | app.ts | Response headers include helmet defaults; limits are config-driven |
| P0-T07 | Prisma setup, MySQL connection, `settings` model, first migration, `seed.ts` that upserts default settings. Waits for the database-layer check (Prisma latest with adapter vs Prisma 6, TiDB TLS) and the Developer's decision (DEC-006) | server/prisma | `npm run db:migrate` and `db:seed` succeed on a clean local database |
| P0-T07b | Optional: TiDB compatibility check from the Developer's laptop (no Hostinger). The Developer runs `prisma migrate deploy`, the seed and a `SELECT 1` through `db.ts` against a scratch TiDB database; Claude never reads the TiDB env file | PHASE_LOG, DECISIONS | Result recorded in PHASE_LOG.md and DECISIONS.md |
| P0-T08 | Health endpoint with database ping | modules/health | Returns ok; with the DB stopped it returns 503 |
| P0-T09 | Test setup: Vitest, Supertest, a separate `ricportal_test` database, a reset helper, first health test | server/test | `npm run test` is green and does not touch the dev database |
| P0-T10 | Frontend scaffold: Vite, React, Tailwind, router shell, providers (QueryClient, Toast), `lib/api.ts` (fetch wrapper, credentials, error normalization), `lib/labels.ts` | client/src | The page loads and calls `/api/health`, showing the result |
| P0-T11 | Read the Figma design system through the connector. Put tokens (colors, type scale, spacing, radius, shadow) into the Tailwind theme and a `tokens.md` note | tailwind config, docs | A sample element in each token renders; no hard-coded colors anywhere |
| P0-T12 | UI kit from Figma: Button (variants, sizes, loading), Input, Textarea, Select, Checkbox, FormField (label, hint, error), Card, Modal, Drawer, ConfirmDialog, Table with Pagination, Badge and StatusBadge, Toast, Spinner, Skeleton, EmptyState, ErrorState, ErrorBoundary | client/src/components/ui | A dev-only `/__ui` gallery shows every component in every state |
| P0-T13 | Layout shells per role (sidebar and top bar on desktop, bottom or collapsible nav on phones) with placeholder navigation, 403 and 404 pages | client/src/app/layouts | Shells match Figma at desktop and 360 px width |
| P0-T14 | CI workflow: install, typecheck, lint, test, build on every push and pull request | .github/workflows/ci.yml | A pushed branch shows a green check |
| P0-T15 | Production build and start: root `build` and `start` scripts; Express serves `client/dist` and falls back to `index.html` for non-API paths | server/src/app.ts, root scripts | `npm run build && npm start` serves the app and API from one port |
| P0-T16 | POSTPONED (deploy before the defense). Deploy the skeleton to Hostinger: create the Node.js app and MySQL database, set environment variables, run `prisma migrate deploy` and seed, check logs. Record every step in docs/DEPLOY.md | docs/DEPLOY.md | The public URL shows the app and `/api/health` is ok |
| P0-T17 | POSTPONED (deploy before the defense). Decision gate: if Prisma failed or exceeded limits on Hostinger, switch the data layer now (Drizzle or Kysely) and redo P0-T07 to P0-T09 | prisma or data layer | Production health check is green with the chosen data layer |
| P0-T18 | Verify the project files that the Developer prepared (CLAUDE.md, docs/, `.claude/skills`, `.claude/agents`, hooks, connectors). Read them, report anything missing or contradictory, and fill the screen inventory (Appendix B) from the Figma file | CLAUDE.md, docs, .claude | A fresh session can state the architecture rules and the current phase without being told; the inventory lists every Figma screen with its phase |

**Details.** Node target: 22 (`.nvmrc` 22, engines `>=22.13.0` (DEC-009), CI on Node 22). Server time zone: set `TZ=Asia/Manila` in the environment, and still never rely on it for calendar days (BR-09). The UI kit follows the Figma design exactly; where Figma has no variant (disabled, loading, error), add it using the same tokens. Mobile first: every component works at 360 px width.

**Tests required:** health endpoint (up and down), env validation (missing variable fails), error handler shape, pagination helper.

**Gate additions:** deployment-ready locally (`npm run build && npm start` works on one port); CI green; CLAUDE.md verified; the database-layer decision (before P0-T07) is recorded in PHASE_LOG.md.
