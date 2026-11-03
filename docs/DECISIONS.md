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

## DEC-007: TypeScript 6.0.3 (exact)

Context: `typescript@latest` is 7.0.2 (the native compiler), and its programmatic API is published only under `unstable/` exports. ESLint with type information (P0-T03) needs a supported TypeScript API.
Evidence (2026-11-03):
- `npm view typescript-eslint@8.72.1 peerDependencies` gives `{ "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0", "typescript": ">=4.8.4 <6.1.0" }`.
- `npm view vitest@5.1.0 peerDependencies` lists vite, jsdom, @types/node and others, but no `typescript`.
- `npm view tsx@4.23.15 peerDependencies dependencies` gives only `{ "esbuild": "~0.28.0" }`, with no `typescript`.
Options: 7.0.2 (latest, outside the typescript-eslint range), 6.0.3 (newest inside the range), 5.9.3 (older).
Decision: `typescript` 6.0.3, pinned exactly (no `^`) in the root devDependencies.
Consequence: revisit only when typescript-eslint supports 7.x, and never during the build (blueprint 3.6, pinned dependencies). TS 6 defaults are not relied on: every option is set explicitly in `tsconfig.base.json`, including `"types": []`.

## DEC-008: ES modules and the `@ricportal/shared` alias

Context: P0-T02 asks for path aliases. `baseUrl` and `paths` are deprecated in TS 6, and Node at runtime does not read `paths`.
Decision:
- All workspaces are ES modules (`"type": "module"`).
- `@ricportal/shared` is the real package name. It resolves through the npm workspace link (`node_modules/@ricportal/shared`) and `shared/package.json` `exports` (`types` goes to `dist/index.d.ts`, `default` goes to `dist/index.js`). No `paths` and no `baseUrl`.
- The server uses NodeNext, so relative imports need the `.js` extension. The client uses Bundler resolution with `noEmit`.
Rule for P0-T03 (record only, not implemented in T02):
- Shared must be built before anything uses it. The scripts run `tsc -b` (or build shared) before typecheck, lint with type information, tests and dev.
- Dev mode must rebuild shared on change. The dev script starts `tsc -b -w` for shared.
Consequence: one resolution path for TypeScript, Node, Vite and tsx, which works the same on Windows. A fresh clone has no `shared/dist` until the first build.

## DEC-009: Lint, format and test tool versions; Node floor raised to 22.13.0

Context: P0-T03 adds ESLint, Prettier and Vitest. Peer-dependency and engine check (`npm view <pkg> version peerDependencies engines`, 2026-11-03):

| Package | Version | Peers | Node engines |
| --- | --- | --- | --- |
| eslint | 10.14.0 | jiti (optional) | ^20.19.0 \|\| ^22.13.0 \|\| >=24 |
| @eslint/js | 10.0.1 | eslint ^10.0.0 | ^20.19.0 \|\| ^22.13.0 \|\| >=24 |
| typescript-eslint | 8.72.1 | eslint ^8.57.0 \|\| ^9 \|\| ^10; typescript >=4.8.4 <6.1.0 | ^18.18.0 \|\| ^20.9.0 \|\| >=21.1.0 |
| eslint-config-prettier | 10.1.8 | eslint >=7.0.0 | none |
| prettier | 3.9.10 | none | >=14 |
| vitest | 5.1.0 | vite ^6.4.0 \|\| ^7 \|\| ^8 (required); others optional | ^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0 |
| vite | 8.3.5 | all optional | ^20.19.0 \|\| >=22.12.0 |

Conflict: ESLint 10 needs Node ^22.13.0, but `engines.node` was `>=22.12.0` with `engine-strict=true`.
Options: (a) ESLint 10 and raise the floor to `>=22.13.0`; (b) ESLint 9.39.5 and keep `>=22.12.0`.
Decision (Developer): (a). `engines.node` = `>=22.13.0`; `.nvmrc` stays 22; CI uses the latest Node 22. All seven packages pinned exactly in the root devDependencies. `vite` is listed explicitly, because it is a required peer of Vitest and must not be installed unpinned.
Updated to match: package.json, CLAUDE.md (Stack), docs/phases/phase-0.md (Details), README.md. This supersedes the `>=22.12.0` in DEC-006.
Audit: `npm audit` reports one moderate advisory (GHSA-g3hv-75wg-m249, minimatch <11.0.1), reached only through ESLint's internals. It runs at lint time only and never ships. The suggested `npm audit fix --force` would install eslint 4.0.0, so it is not applied. Re-check at the Phase 8 dependency audit.
Deferred to the task that first needs them: tsx and concurrently (P0-T04), eslint-plugin-react-hooks (P0-T10).
Consequence: `npm run check` = typecheck, lint, format:check, test, build. Shared is built before lint and test (DEC-008); `tsc -b` builds it first for typecheck and build. The `tsc -b -w` dev watcher arrives with the first dev script (P0-T04).
