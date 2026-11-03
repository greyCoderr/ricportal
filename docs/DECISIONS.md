# Decisions

Decision records for choices made and conflicts resolved: context, options, decision, consequence.

## DEC-001: `/api/health` is a public route

Context: CLAUDE.md says every route has authenticate, requireRole, center scope and a negative permission test. The health endpoint (P0-T08) must be reachable by uptime monitors, and auth does not exist until Phase 1.
Decision: `GET /api/health` is the only public route in Phase 0. It returns no user or center data.
Consequence: the Phase 1 permission matrix test (P1-T12) lists it as Public, expected 200 (or 503) for every role and no login.

## DEC-002: Phase 0 task order puts tests first

Context: the phase table puts test setup (P0-T09) after the code that needs tests (P0-T04, T05, T08), but the working rules require tests first.
Decision: a minimal Vitest setup moves into P0-T03; P0-T09 (test database and reset helper) runs before P0-T08; P0-T15 runs before P0-T14 so CI checks the real build.
Consequence: same tasks, different order. No task is dropped.

## DEC-003: Env example files are allowed by the hook and git

Context: `.env.test.example` was blocked by `.claude/hooks/protect-files.js` (only `.env.example` was exempt) and ignored by `.gitignore` (`.env.*`).
Decision: the hook exempts `.env.example` and `.env.<name>.example`; `.gitignore` adds `!.env.*.example`.
Consequence: `.env`, `.env.test`, `.env.tidb` and any other real env file stay blocked for edits and ignored by git.

## DEC-004: CLAUDE.md seed line describes the seed after Phase 1

Context: CLAUDE.md says `npm run db:seed` seeds the admin, 28 centers and settings. Phase 0 has only the `settings` table; the admin and centers are added in P1-T03.
Decision: the Phase 0 seed upserts settings only.
Consequence: the CLAUDE.md line becomes true after P1-T03. No change to CLAUDE.md needed.

## DEC-005: Database and hosting

Context: the Developer chose the production database and postponed hosting.
Decision:
- Local development: XAMPP MariaDB using the Prisma "mysql" provider.
- Production database: TiDB Cloud free plan (MySQL-compatible). It needs TLS, usually `mysql://USER:PASSWORD@HOST:4000/DBNAME?sslaccept=strict`.
- Production schema changes only with `npx prisma migrate deploy`, run from the Developer's laptop or CI. Never run `migrate dev` against production.
- Hosting: Hostinger Node.js, deployment postponed.
- Use standard SQL only. Do not rely on sequential auto-increment IDs.
Consequence: recorded in CLAUDE.md under "Stack". The database layer choice is checked against TiDB before P0-T07 (DEC-006).

## DEC-006: Phase 0 revised (Node 22, deployment postponed)

Context: the Developer set the Node target and postponed deployment until before the defense.
Decision:
- Node target 22: `.nvmrc` = 22, `engines.node` = `>=22.12.0`, `engine-strict=true`, CI on Node 22. No Node-24-only features (the laptop runs Node 24, which satisfies the range).
- P0-T16 (Hostinger deploy) and P0-T17 (Prisma decision gate) are POSTPONED.
- P0-T15 also writes `docs/DEPLOY.md` as a draft checklist, with no deployment.
- The Phase 0 gate becomes "deployment-ready locally": `npm run build && npm start` works on one port.
- Before P0-T07, a database-layer check: TLS to TiDB (port 4000) with `@prisma/adapter-mariadb`, and whether `prisma migrate deploy` works against TiDB. Option A (latest Prisma with the adapter) or Option B (Prisma 6, engine-based). The Developer decides; nothing is installed before that.
- New optional task P0-T07b: TiDB compatibility check from the Developer's laptop. The Developer owns `.env.tidb`; Claude never reads, prints or asks for it.
Edits made to `docs/phases/phase-0.md` to match:
- The Goal row says "deployment-ready locally" instead of "a live health check on Hostinger".
- The P0-T16 and P0-T17 rows are marked "POSTPONED (deploy before the defense)".
- The P0-T07 row notes that it waits for the database-layer check.
- A P0-T07b row is added.
- Details state the Node 22 target.
- The gate additions say "deployment-ready locally" and "the database-layer decision", instead of "production skeleton live" and "the Prisma-or-alternative decision".
Consequence: Phase 0 ends with no Hostinger deployment. The 02-rules gate items about staging deployment do not apply to Phase 0.
