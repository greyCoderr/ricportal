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

## DEC-010: Express 5

Context: P0-T04 needs an HTTP framework. The Developer asked for Express 5 if it is stable and async errors reach the error handler, otherwise Express 4 with an asyncHandler. The Context7 connector was not available in this session, so the evidence comes from npm and the official docs.
Evidence (2026-11-03):
- `npm view express dist-tags` gives `latest` 5.3.0 and `latest-4` 4.22.3. Engines: `node >= 18`.
- expressjs.com/en/guide/error-handling.html: "Route handlers and middleware that return a Promise call `next(value)` automatically when they reject or throw an error."
- expressjs.com/en/guide/migrating-5.html: wildcards must be named (`/{*splat}`); `req.query` is a read-only getter; `req.body` is `undefined` until parsed; `app.listen` passes start errors (for example EADDRINUSE) to its callback.
Decision: express 5.3.0 with @types/express 5.0.6, pinned exactly. Other T04 versions: zod 4.6.7, pino 10.4.0, pino-pretty 13.2.0 (development only), @types/node 22.20.5 (matches the Node 22 target), tsx 4.23.15, concurrently 10.0.6.
Consequence: async handlers need no wrapper for errors. P0-T05 lists `asyncHandler`; whether it is still needed is decided when T05 is planned. The SPA fallback in P0-T15 must use the Express 5 wildcard syntax.

## DEC-011: No asyncHandler

Context: the blueprint (4.4 folder list `core/asyncHandler.ts`, and task P0-T05) asks for an `asyncHandler` wrapper. That wrapper exists to pass rejected promises to `next` in Express 4.
Decision: the blueprint item is dropped. Express 5 (DEC-010) passes rejected promises and errors thrown in async handlers to the error handler by itself. `asyncHandler.ts` is not created.
Consequence: route handlers may be `async` and simply throw an `AppError`. A test in `core/middleware/error-handler.test.ts` proves a rejected async handler reaches the error handler.

## DEC-012: File names are kebab-case

Context: blueprint 4.4 says "Files `kebab-case.ts`", but the folder tree in the same section lists `errorHandler.ts`, `requireRole.ts`, `rateLimit.ts` and `asyncHandler.ts`.
Decision: the explicit naming rule wins. Middleware files are `error-handler.ts`, `not-found.ts` and `request-id.ts`; later ones are `require-role.ts`, `rate-limit.ts` and `validate.ts`. React component files stay `PascalCase.tsx`.
Consequence: the folder tree in 4.4 is read with kebab-case names.

## DEC-013: pageSize over 100 is rejected, not lowered

Context: blueprint 4.4 sets list defaults (20) and a maximum (100) but does not say what happens above the maximum.
Decision: `parsePagination` rejects page or pageSize values that are not whole numbers, are below 1, or (for pageSize) are over 100, with VALIDATION_ERROR and details naming the field. The limits live in `server/src/config/limits.ts`.
Consequence: clients get a clear 400 instead of silently receiving fewer rows than they asked for.

## DEC-014: Tenth error code PAYLOAD_TOO_LARGE (413)

Context: blueprint 4.8 lists status 413 ("file too large") but has no error code for it, and P0-T06 adds a JSON body limit.
Decision: add `PAYLOAD_TOO_LARGE` (413) to `ERROR_CODES` in shared, to blueprint 4.8 (codes and status line, now "payload too large (request body or uploaded file)"), to docs/phases/phase-3.md P3-T06, and to docs/API.md. A JSON body over `BODY_LIMIT` (body-parser type `entity.too.large`) returns `{ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large.", details: [] } }`. The parser's own message is never sent.
Consequence: Phase 3 upload errors (multer file size, BR-20) use the same code.

## DEC-015: Security middleware order and configuration

Context: P0-T06 adds helmet, compression, a JSON body limit, a global rate limit, cookie-parser and trust proxy.
Decision:
- Order in `createApp`: request id, trust proxy, helmet, compression, rate limit, `express.json`, cookie-parser, then routes, 404, error handler. The middle part lives in `core/middleware/pipeline.ts` (`applyRequestPipeline`), so tests can use the real pipeline.
- New env variable `RATE_LIMIT_ENABLED` (true or false, default true). Limits come from `BODY_LIMIT` (at most 10mb), `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` and `TRUST_PROXY` (0 to 10 hops, default 0). `createApp` receives these as `config`. There is no `NODE_ENV` check.
- Tests pass their own config through `server/test/test-config.ts`, with rate limiting off unless a test turns it on. `.env.test.example` sets `RATE_LIMIT_ENABLED=false`.
- A rate-limited request goes to `RateLimitedError`, so it gets the standard 429 shape. express-rate-limit sets `Retry-After` and the draft-8 `RateLimit` headers first. The key is `req.ip`, which follows `X-Forwarded-For` only when `TRUST_PROXY` is above 0, so a client cannot dodge the limit by sending a fake header.
Versions (pinned, 2026-11-03): helmet 8.3.0 (Node >=18), compression 1.8.2, express-rate-limit 8.7.3 (Node >=16; peer express >=4.11), cookie-parser 1.4.7, @types/compression 1.8.1, @types/cookie-parser 1.4.10.
Consequence: the deployment checklist (P0-T15) sets `TRUST_PROXY` to the number of proxies in front of the app on Hostinger (usually 1). The helmet default Content-Security-Policy is checked against the built client in P0-T15.

## DEC-016: Database layer is Prisma 7.10.1 with @prisma/adapter-mariadb (Option A)

Context: the database-layer check before P0-T07 (DEC-006). Local: XAMPP MariaDB 10.4.32 (`mysqld --version`). Production: TiDB Cloud free plan (TLS, port 4000), schema changed only with `migrate deploy` (DEC-005). Hosting: Hostinger Node.js, postponed. Context7 was not available; sources are the npm registry and the official docs, all read 2026-11-03 (the pages show no publish date).
Evidence:
- npm registry: `prisma` dist-tags have `latest` = **8.0.0-rc.29** (a release candidate, engines `node ^22.18.0 || ^24.11.0 || >=26.0.0`) and `prev` = 7.10.1 (released 2026-10-15). `prisma`, `@prisma/client` and `@prisma/adapter-mariadb` 7.10.1 accept Node `^20.19 || ^22.12 || >=24.0` and TypeScript `>=5.4.0`. The adapter depends on `mariadb` 3.5.4 (Node >= 20). The last 6.x is 6.19.3 (2026-04-01; Node >=18.18, TypeScript >=5.1.0).
- Prisma v7 docs (prisma.io/docs/orm/v7/reference/system-requirements, /docs/guides/upgrade-prisma-orm/v7, /docs/orm/v7/core-concepts/supported-databases/mysql and /database-drivers, /docs/orm/v7/reference/supported-databases):
  - Node `^20.19.0, ^22.12.0, or ^24.0.0`; TypeScript 5.4+.
  - Supported: MySQL 5.6, 5.7, 8.0, 8.4 and MariaDB 10.0+. TiDB is not listed (only a community adapter, `@tidbcloud/prisma-adapter`).
  - "require a driver adapter for all databases". The classic engine is gone (removed env vars include `PRISMA_QUERY_ENGINE_BINARY` and `PRISMA_QUERY_ENGINE_LIBRARY`). MySQL and MariaDB use `@prisma/adapter-mariadb` (`PrismaMariaDb`).
  - "Prisma ORM now ships as an ES module". The `prisma-client` generator needs an `output` path.
  - "environment variables are not loaded by default". The CLI reads the datasource URL (and `shadowDatabaseUrl`) from `prisma.config.ts`.
- `@prisma/adapter-mariadb` 7.10.1 type file (unpkg): `constructor(poolOrConfig: mariadb.Pool | mariadb.PoolConfig | string, options?: PrismaMariadbOptions)`.
- MariaDB Node.js connector docs (mariadb.com/docs/connectors/mariadb-connector-nodejs/node-js-connection-options): `ssl` is a boolean or an object (`ca`, `rejectUnauthorized`, ...). "By default, Node.js trusts the well-known root Certificate Authorities (CA), based on Mozilla."
- TiDB docs (docs.pingcap.com, v8.5 stable and TiDB Cloud Starter pages):
  - "TiDB Cloud only allows TLS connections"; TLS 1.2 and 1.3 only; certificates from Let's Encrypt.
  - Up to 400 concurrent connections on Starter. Connections "might be terminated" after 30 minutes (start with a 5-minute lifetime). AWS idle timeout 340 s. Transactions at most 30 minutes.
  - Foreign keys supported since v6.6.0 and GA in v8.5.0, but not on BLOB or TEXT columns.
  - AUTO_INCREMENT values are unique and "only be monotonic on a per TiDB server basis… not the same guarantee as consecutive".
  - The user name needs the cluster prefix.
- TiDB's Prisma sample (github.com/tidb-samples/tidb-nodejs-prisma-quickstart): Prisma `^5.1.1`, `provider = "mysql"`, no adapter, `mysql://<user>:<password>@<host>:4000/test?sslaccept=strict`, `prisma migrate dev`, real foreign keys ("recommended… instead of Prisma Relation Mode").
Options: A, Prisma 7.10.1 with `@prisma/adapter-mariadb` (pure JavaScript at runtime). B, Prisma 6.19.3 with the classic native query engine (the setup in TiDB's guide).
Decision (Developer): **Option A, Prisma 7.10.1 exactly**: `@prisma/client` 7.10.1, `@prisma/adapter-mariadb` 7.10.1, `prisma` 7.10.1 (dev).
Rules:
- Never install `prisma`, `@prisma/client` or `@prisma/adapter-*` without an exact version. npm `latest` is the 8.0 release candidate, which also breaks our Node floor.
- TLS mapping: the runtime connects through the `mariadb` driver, which does not understand Prisma's `sslaccept`. `core/db.ts` maps `sslaccept=strict` to `ssl: { rejectUnauthorized: true, minVersion: "TLSv1.2" }`, using Node's bundled Mozilla CAs (no CA file).
- Migrations: `migrate dev` and `migrate deploy` use Prisma's schema engine with the URL from `prisma.config.ts` (`sslaccept=strict` applies there, as in TiDB's guide). `migrate dev` and its shadow database run only against local MariaDB, never against TiDB.
- Pool: about 5 connections, idle timeout under 5 minutes (TiDB limits above).
- Real foreign keys (no `relationMode = "prisma"`), never on TEXT or BLOB columns. Never rely on IDs being consecutive (DEC-005).
- Claude never runs any `tidb:*` script, never reads `.env.tidb` and never connects to the Developer's TiDB cluster. Only the Developer runs them and pastes redacted output.
Unverified (checked later):
- Whether the Prisma 7 schema engine is a native binary downloaded at install. `@prisma/engines` 7.10.1 still has a `postinstall` and depends on `@prisma/fetch-engine`; check `node_modules` in P0-T07.
- That the generated client compiles under NodeNext; checked in P0-T07.
- TLS, `migrate deploy` and the seed against TiDB; checked by the Developer in P0-T07b.
- DECIMAL and SAVEPOINT behavior on TiDB through the adapter: Prisma's TiDB page returned 404 and TiDB's Prisma guide page was empty. Checked when money arrives in P5.
Fallback: if P0-T07b fails and cannot be fixed quickly, switch to Option B (Prisma 6.19.3) and redo P0-T07. `db.ts` stays one small module so this remains cheap.
Consequence: no native query engine runs on Hostinger. `prisma` (CLI) is a devDependency, and migrations run from the laptop or CI.

## DEC-017: Database tools in server/prisma, and no env file loading in prisma.config.ts

Context: CLAUDE.md says Prisma is used only in repositories and `db.ts`. P0-T07 adds a seed and a database check script, which use the Prisma client but are not application code. Separately, Prisma 7 does not load `.env` by itself.
Decision:
- Files in `server/prisma/` (`seed.ts`, `db-check.ts`, `script-output.ts`) are database tools, like the migrations next to them. They may use the client from `core/db.ts`. Application code under `server/src` still reaches the database only through `*.repository.ts` and `db.ts`.
- `server/prisma/prisma.config.ts` never loads any env file. Scripts that need a database pass one explicitly with `node --env-file`: `db:migrate`, `db:seed` and `db:check` use `../.env`; `tidb:deploy`, `tidb:seed` and `tidb:check` use `../.env.tidb` (run only by the Developer, DEC-016). `prisma generate` needs no database and runs with no env file, so tests and `npm run check` never read `.env`. This is stricter than "load `.env` only when `DATABASE_URL` is unset", and was accepted by the Developer's go.
- The generated client lives in `server/src/generated/prisma` (gitignored, ignored by ESLint and Prettier). It is compiled as normal server source, so it ships in `server/dist`. `npm run codegen` (prisma generate, then build shared) runs before typecheck, lint, test, build and dev:server, so a fresh clone and CI work without extra steps.
Consequence: a seed or check never prints error messages, only an error code, because driver messages can contain the host.

## DEC-016 follow-up (P0-T07 findings)

- Native engine: after install, `node_modules/@prisma/engines/schema-engine-windows.exe` exists (the migration tool is a native binary), while the query compiler used at runtime ships as WebAssembly (`node_modules/prisma/build/query_compiler_*.mysql.wasm`). Only the devDependency CLI is native.
- NodeNext: verified in three steps. (1) `prisma generate` with no `DATABASE_URL`, generator `prisma-client`, `moduleFormat = "esm"`, `importFileExtension = "js"`. (2) `tsc -p server/tsconfig.json --noEmit` includes the 9 generated files and exits 0 under strict, `noUncheckedIndexedAccess` and the unused-variable checks; generated imports use `.js`. (3) After `npm run build`, plain Node (no tsx) imports `server/dist/generated/prisma/client.js` (PrismaClient is a function) and `server/dist/core/db.js`.
- Local MariaDB 10.4.32: `migrate dev --name init_settings` created and applied `20261103103141_init_settings` (Prisma made its own temporary shadow database). The seed ran twice with 2 rows, values `"25.00"` and `"2026-2027"`. `db:check` gave `SELECT 1: ok`, `TLS: off`, `settings rows: 2`.
- The Prisma CLI prints "Update available 7.10.1 -> 8.0.0-rc.29 … npm i prisma@latest". Ignore it: the exact-version rule above applies.

## DEC-018: TiDB check passed; migrations need connect_timeout=30

Context: P0-T07b. The Developer ran `tidb:deploy`, `tidb:seed` (twice) and `tidb:check` from their laptop against a scratch database on TiDB Cloud Starter (ap-southeast-1). Claude did not run them and did not read `.env.tidb` (DEC-016).
Result (reported by the Developer): PASSED.
- `prisma migrate deploy` applied `20261103103141_init_settings`.
- The seed ran twice with no duplicates.
- `tidb:check`: `SELECT 1: ok`, `TLS: on (TLS_AES_128_GCM_SHA256)`, `settings rows: 2`.
Finding: `prisma migrate deploy` first failed with P1001 (cannot reach the database server) until `connect_timeout=30` was added to the `DATABASE_URL` query string. The app's `mariadb` driver connected without it. `core/db.ts` reads only `sslaccept` from the query string and ignores other parameters, so the same URL works for both.
Decision:
- The production `DATABASE_URL` keeps `connect_timeout=30`, for example `mysql://USER:PASSWORD@HOST:4000/DBNAME?sslaccept=strict&connect_timeout=30`. Any CI secret that runs migrations uses the same form.
- Migrations against TiDB run only with `prisma migrate deploy`, from the Developer's laptop or CI. Never from the running app (no migrate on start), and never `migrate dev` (DEC-005, DEC-016).
Consequence: Option A (DEC-016) stands; the Option B fallback is not needed. Still unverified: DECIMAL and SAVEPOINT behavior on TiDB (P5).

## DEC-019: Test database rules

Context: P0-T09. Tests that need a database must never touch the dev database or TiDB. Accepted by the Developer's go with the recommended answers.
Decision:
- Vitest has two groups (`vitest.config.mjs` projects): `unit` (no database) and `db` (files in `server/test/db/`, run one file at a time against one shared database).
- Env: `.env.test` is loaded with Node's `process.loadEnvFile` only if the file exists; variables already set (CI) are not overwritten. No dotenv.
- Guard (`server/test/db/test-database.ts`), checked before any connection and again before every reset: `NODE_ENV=test`, the database name ends with `_test`, and the host is `127.0.0.1`, `localhost` or `::1`. Refusals use fixed messages and never show the URL.
- The `db` group's global setup runs `prisma migrate deploy` on the test database on every run (never `migrate dev` or `migrate reset`). Prisma's output is hidden; on failure only the Prisma error code is shown.
- `resetDatabase(prisma)` empties every table except `_prisma_migrations` with `DELETE` inside one transaction, with foreign-key checks off. Tables added later are covered automatically. AUTO_INCREMENT counters are not reset (DEC-005: never rely on consecutive IDs).
- `npm run test` and `npm run check` need the local test database (XAMPP running locally, the mysql:8 service in CI) and fail with a clear message without it. `npm run test:unit` runs only the `unit` group. Database tests are never skipped silently.

## DEC-020: SERVICE_UNAVAILABLE (503) and the health check design

Context: P0-T08. The phase says `/api/health` returns 503 when the database is down, but blueprint 4.8 had no 503 code. Accepted by the Developer's go on the T08 plan.
Decision:
- An 11th error code `SERVICE_UNAVAILABLE` (503), fixed message "The service is temporarily unavailable. Please try again.", `details` always `[]`. Added to shared `ERROR_CODES`, `ERROR_STATUS`, `ServiceUnavailableError`, blueprint 4.8 and API.md.
- `modules/health` follows routes > controller > service > repository. The repository runs `SELECT 1` and is the only file that touches the database. The service races the ping against `HEALTH_TIMEOUT_MS` (2000 ms) and always clears its timer.
- On failure the service logs `warn` "health check: database down" with only the driver error code or `timeout`, never the message (driver messages contain the host).
- Health responses (200 and 503) send `Cache-Control: no-store`.
- `createApp` takes `health: { repository, timeoutMs? }`, so unit tests stub the database. `server.ts` builds the real Prisma client from `DATABASE_URL` (a bad URL exits with code 1 and a fixed message) and disconnects it on SIGTERM and SIGINT.
- The route is mounted after the request pipeline (request id, helmet, rate limit apply) and before the 404 handler. No auth code (DEC-001). Blueprint 4.1 and P1-T12 list it as Public.

## DEC-021: Frontend scaffold choices (P0-T10)

Context: P0-T10 adds the Vite + React client. Accepted by the Developer's go with the recommended answers.
Decision:
- Versions (exact, each at least 14 days old): react and react-dom 19.3.1, react-router 7.18.4, @tanstack/react-query 5.104.5, @vitejs/plugin-react 6.1.2, tailwindcss and @tailwindcss/vite 4.3.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, jsdom 29.1.1, eslint-plugin-react-hooks 7.1.1 (root). Vite 8.3.5 was already at the root.
- The Node floor stays `>=22.13.0` (DEC-009). react-router 8 needs Node `>=22.22.0` and jsdom 30 needs `^22.22.2`, so the previous majors are used. Revisit when Hostinger's Node version is known.
- `lib/api.ts` is the only place that calls fetch: `credentials: "same-origin"`, JSON headers, never logs bodies. Every failure is one `ApiError { status, code, message, details }`. A standard error body keeps its code. A failed fetch (status 0) or a response that is not our API's shape (for example the dev proxy's error page) becomes the client-only code `NETWORK_ERROR` with "Cannot reach the server. Please check your connection and try again." `NETWORK_ERROR` is not added to shared `ERROR_CODES`.
- TanStack Query retries a failed query once, never for a 4xx `ApiError`. Tests use `retry: false`.
- Toast: a small provider written in the project (polite live region, 5-second auto-dismiss), no library.
- Dev proxy: `client/vite.config.ts` proxies `/api` to `http://127.0.0.1:<port>`, so the browser sees one origin (cookies, no CORS). The port is shared `DEFAULT_SERVER_PORT` (3000), also the server's `PORT` default; the optional `API_PORT` variable overrides it. The Vite config never reads `.env`.
- Tests: a third Vitest project `client` (jsdom, React plugin, Testing Library cleanup in `client/test/setup.ts`). No jest-dom or user-event.
- TypeScript: `client/tsconfig.json` is a solution file referencing `tsconfig.app.json` (src and test, DOM, `vite/client` types) and `tsconfig.node.json` (`vite.config.ts`, node types), so ESLint's project service finds both.
- ESLint: react-hooks `flat.recommended` for `client/**/*.{ts,tsx}`.
Consequences: `npm run build` also runs `vite build` into `client/dist`. `tsc -b --clean` does not remove `client/dist` (Vite empties it on each build); the cross-platform clean is still a P0-T15 item. The npm audit advisory (minimatch through ESLint, dev-only, P0-T03) now also reaches through eslint-plugin-react-hooks.

## DEC-022: Design tokens, fonts and CSP for P0-T11

Context: P0-T11 puts the Figma tokens into the Tailwind theme. The Developer answered the plan questions on 2026-11-04. Values and node ids are in docs/tokens.md.
Decision:
- One theme for all roles, not one per role. `primary` #D32F2F (buttons, links, title). `accent` #025B02 (Admin dashboard cards and tiles; the same value as `success` for the Approved badge). `danger` #FF0000 (Rejected badge) is a separate token from `primary`. Note: two reds (#D32F2F and #FF0000), confirm with the client.
- Colors live only in `client/src/styles/tokens.css`. Tailwind's default palette is reset; the client uses semantic classes only, and a test fails on any hex value, color function or default palette class elsewhere.
- Montserrat is self-hosted from `@fontsource/montserrat` 5.3.0 (exact version): latin subset only, weights 300, 400, 500, 600 and 700. No external font host.
- Three shadow tokens only: header, card and panel. The other one-off Figma shadows are not tokenized (BACKLOG). Spacing uses Tailwind's default scale; Figma's hand-placed pixel gaps are not copied.
- CSP: helmet's defaults with `font-src 'self'` and `style-src 'self' 'unsafe-inline'`. Inline styles stay allowed because React and FullCalendar need them.
Consequences: the CSP can only be checked in a real browser once Express serves `client/dist` (P0-T15).
- The file-scan tests in `client/test` (contrast, fonts, colors, tokens and their helpers) read files with Node APIs. They run in Vitest's `node` environment (`// @vitest-environment node`) and are type-checked by `client/tsconfig.node.json` (Node types) instead of `tsconfig.app.json` (DOM types). No new dependency.
- The token sample elements live only in `client/test/tokens.test.ts`, which compiles `src/styles/index.css` with the installed `tailwindcss` compiler; nothing is added to the bundle.

## DEC-023: Accessible text tokens next to the client's hues

Context: in P0-T11 several Figma text colors fail WCAG AA (contrast table in docs/tokens.md). Decided by the Developer on 2026-11-04. Replaces the earlier plan to only list failing pairs as known failures.
Decision:
- The client's hue tokens stay for fills, borders and icons. Badge pills keep the 24% tint fills.
- New text tokens that pass AA: `warning-text` #6B5900, `info-text` #1F4E96, `danger-text` #A30000, `text-placeholder` #757575, `border-subtle` #949494.
- The selected nav item uses black text on #FF8282.
- The warning hue #EDF902 is never used as text.
- docs/tokens.md shows "Client original (Figma)" and "RICPortal adjusted" columns with contrast ratios.
- The contrast test expects zero known failures and fails if any listed pair falls below its minimum.
Consequences: screens differ from Figma in these text colors only. The Developer raises the change with the client.

## DEC-024: Parent home is the My Schedule calendar

Context: A-18 gave Parents a "Today's Feeding" card. Decided by the Developer on 2026-11-04.
Decision:
- The Parent home is the My Schedule calendar only (Figma PARENT CALENDAR 393:1133, read in Phase 5). The calendar highlights today. Parents get no "Today's Feeding" card; the Teacher home keeps it.
- In Phase 1 the Parent home is a placeholder: "Welcome, {name}. Your schedule will appear here once your teacher assigns you."
Consequences: A-18 in blueprint 4.7, P5 Build, P5-T15, P5-T17, the P1 Figma list, P1-T14 and P1-T17 are updated. Recorded in BUSINESS_RULES.md.

## DEC-025: Developer-designed screens and the design language

Context: Annex A needs Parent screens the client's Figma does not contain. Decided by the Developer on 2026-11-04.
Decision:
- docs/DESIGN_LANGUAGE.md fills gaps and details Figma leaves open; the client's Figma wins on every screen it contains.
- docs/DESIGN_GAPS.md is the process for missing screens, used through the `ricportal-design-gap` skill. CLAUDE.md says never invent UI.
- First specs: docs/ui-specs/parent-screens.md with S-P1-02 Parent sign-up, S-P1-07 Request sent and S-P5-04 Parent day screen, marked "Designed by the Developer with Claude; no client Figma frame; client approval requested". Reference images in docs/ui-specs/images/ are only references; the text wins.
Consequences: rows added to UI_MAP.md and figma-inventory.md. Open questions are listed at the end of the spec.

## DEC-026: Parent data, lockout response, units and screen ids

Context: open questions from docs/ui-specs/parent-screens.md. Decided by the Developer on 2026-11-04.
Decision:
- The Parent response of `GET /api/purchase-requests/:date` leaves out `budget`, `enrolledCount` and `ratePerChild` on the server, not only on screen. Teacher and Admin responses keep them. Phase 5 test: a Parent response never contains those fields; a Teacher response does.
- Locked account: every login attempt while locked, with the right or a wrong password, returns 429 RATE_LIMITED with "Too many attempts. Try again in 15 minutes." and a `Retry-After` header giving the remaining seconds (confirmed by the Developer). The login rate limiter returns the same status, message and header, also for unknown usernames, so existence is never revealed. Pending, declined and disabled messages appear only after correct credentials. BR-19, P1-T04, P1-T07 and the Phase 1 tests are updated.
- The Unit select reads the shared `UNITS` constant in `shared/src` (kg, g, pcs, bottle, pack, can, liter, bundle, tray, other), created in Phase 5. No API call; the server validates against the same constant.
- Screen ids: S-P1-02 stays Parent sign-up and S-P1-06 is removed. S-P1-07 and S-P5-04 stay. S-P5-02 Purchase Request editor is Teacher only.
- Type sizes 15 and 40 are added to the tokens (P0-T11).
- The details Claude added to the spec (wireframes, focus handling, cell labels such as "Qty for Rice", the "Request sent" reload behavior) are kept and listed in the spec's change notes for review.
Consequences: no Phase 1 or Phase 5 code is written now. The Developer confirmed 429 with `Retry-After` for the locked response.

## DEC-027: Startup test timeout and the lint memory limit

Context: during P0-T11, `server/test/startup.test.ts` timed out (6 to 9 s against the 5 s default) with and without the T11 change, and ESLint crashed twice with out-of-memory errors. Decided by the Developer on 2026-11-04.
Decision:
- The startup test gets a 15 second timeout, for that one test only. Reason: it starts `server.ts` through tsx in a child process, and tsx startup is slow on this machine. The global test timeout stays at 5 seconds.
- ESLint memory: BACKLOG item for P0-T14 to give the lint script a larger memory limit with a Node flag (for example `--max-old-space-size`), no new dependency.


## DEC-028: UI kit choices for P0-T12

Context: the P0-T12 plan. Answers given by the Developer on 2026-11-05.
Decision:
- P0-T12 is done in three steps (T12a, T12b, T12c), each finished, checked and handed to the Developer for commit before the next starts (docs/phases/phase-0.md).
- Focus ring: a 2px black outline (`text`) with a 2px offset; `nav-text` on black areas. No new color.
- Hover: a `primary-hover` token in tokens.css, a darker mix of `primary` with black (no new hue). White text on it must pass AA, checked by the contrast test. Disabled: `opacity-50`, `cursor-not-allowed` and `aria-disabled`.
- Button sizes: `sm` 32 px (as in Figma) and `md` 44 px (the default). Parent screens use `md`.
- Destructive confirm uses the `primary` fill; destructive text uses `danger-text`. The danger hue #FF0000 is never a fill.
- Status labels come from BR-07: Submitted, Need Revision, Approved. Tones come from the Figma badges (267:9763 to 267:9770). Figma's Rejected and Pending are not agreed statuses (BACKLOG: ask the client). A declined Parent uses the danger tone with the label Declined.
- Mapping confirmed by the Developer on 2026-11-05 (wording to confirm with the client, BACKLOG): Approved = success, Submitted = info (Figma "For Review"), Need Revision = warning (Figma "Pending"), Declined = danger (Figma "Rejected").
- Skeleton is still (no pulse, DESIGN_LANGUAGE rule 8). Spinner respects `prefers-reduced-motion`.
- Modal and Drawer use the native `dialog` with `showModal()`, Escape through the `cancel` event calling `onClose`. No custom focus trap. jsdom has no `showModal`, so `client/test/setup.ts` gets a small test-only stub; focus behavior (Tab stays inside, Escape closes, focus returns to the trigger) is checked by hand in the gallery.
- Gallery exclusion: no build inside a test. A small Node script runs after the build in `npm run check`, scans `client/dist` for the gallery marker strings and fails if one is found; a self-test fixture proves it catches them.
- Stamp (Phase 3) and LedgerTable (Phase 5) are specified in docs/ui-specs/ui-kit.md now and built in their phases. No money formatter in Phase 0.
- No new dependency in T12a: icons are inline SVG components adapted from Lucide (ISC license, notice in icons.tsx). One stroke constant `ICON_STROKE = 1.5` with a non-scaling stroke (Figma draws 1px; accessibility judgement by the Developer).
- `primary-hover` = #B32828 (primary mixed with 15% black; white on it 6.46:1), in tokens.css and the contrast test.
- Any container that shows Skeleton blocks uses `SkeletonGroup`: `aria-busy="true"` and visually hidden "Loading..." text. A scan test fails otherwise.
- Conflicts from the step B reads (docs/components.md), decided 2026-11-05: keep the desktop tokens for controls (44 px, radius 8, Medium 15 labels, `border-subtle`); StatusBadge follows 267:9763 to 267:9770, not the mobile red pill; no green button variant (BACKLOG); Card variants `panel` (no shadow) and `stat` (4px accent bottom border, `shadow-card`); Textarea uses the input radius; the icon button is 44 x 44 with an `aria-label` and its label visible on hover and focus.
- Built in T12a: Button, IconButton, Input, Textarea, Select, FormField, Card, Badge, StatusBadge, Spinner, Skeleton, ErrorBoundary, icons. Checkbox, Banner, EmptyState and ErrorState wait for spec approval; Toast is aligned after Banner.
Consequences: Figma reads are recorded in docs/components.md, one read per node.

Addendum to DEC-028 (Developer's review of P0-T12a, 2026-11-06):
- Icons checked against Lucide's published source, lucide-static 1.70.0. `circle-check` was out of date and is fixed; a test pins every shape. The notice in icons.tsx carries Lucide's ISC license and the MIT license for the icons derived from Feather (`check`, `chevron-down`, `x`).
- Input, Select and Textarea text is 16 px on small screens (no zoom on focus in iOS Safari) and 15 px from the `md` breakpoint (768 px) up.
- `skeleton` is an alias token: `--color-skeleton: var(--color-header)`.
- Select's `placeholder` is a first-class prop: a disabled, hidden empty first option, selected by default unless `value` or `defaultValue` is given.
- The four specs (Banner, EmptyState, ErrorState, checkbox look) were approved and built. The checkbox check mark uses a 2px stroke, the one approved exception to `ICON_STROKE`. Banner and Toast share `ui/tones.ts`; Toast keeps its API. ErrorBoundary's default fallback is the approved page ErrorState with a Reload button.

## DEC-029: 15 second test timeout for the client tests

Context: jsdom is slow on this machine. In full runs, client tests that pass alone in about 1 second have taken 3.9 to 17 seconds (a HealthPage test took 3994 ms against the 5000 ms default; the icon label test 6.7 s; the Toast timer test 13 to 17 s). Decided by the Developer on 2026-11-06.
Decision:
- `testTimeout: 15_000` for the `client` Vitest project only. The `unit` project (shared and server) keeps the 5 second default; the `db` project keeps its own 15 second timeout (DEC-019); the one server startup test keeps its 15 second timeout (DEC-027).
- No test is weakened. Sharing the jsdom environment across files would be faster but can leak state between tests (BACKLOG).
Consequences: a slow client test fails only after 15 seconds. If client tests keep getting slower, look at the BACKLOG item before raising the limit again.

## DEC-030: Forms without React Hook Form (demo sprint)

Context: CLAUDE.md lists React Hook Form, but the sprint's approved package list (docs/SPRINT_PLAN.md) does not. The plan wins on process.
Decision: forms use plain React state and `safeParse` with the shared Zod schemas, through a small `useZodForm` hook. Field messages appear under the inputs. React Hook Form stays a BACKLOG option.

## DEC-031: Local type declaration for multer (demo sprint)

Context: multer ships no types and `@types/multer` is not on the approved list; "nothing else without a blocker report".
Decision: a small `server/src/types/multer.d.ts` declares only what the import module uses. No extra package.

## DEC-032: Fixture file name

Context: the plan names `server/test/fixtures/SF_MENU_for_30_days.xlsx`; the Developer's file is `SF MENU for 30 days.xlsx` (same folder, untracked).
Decision: S3 copies it to the plan's name and commits that copy. The original stays untouched and uncommitted. Not treated as a missing-file blocker because the file is present.

## DEC-033: Sidebar icons in the sprint

Context: the Figma desktop sidebar (166:910) uses raster PNG icons; the mobile frames use Lucide (BACKLOG asks the client which style wins).
Decision: the sidebar uses the Lucide inline icons (single style, no image assets, tokens only). Labels, size, colors and the selected look come from 166:910. Labels not in the Figma Teacher sidebar (Assignments, Parent Requests) follow the phase files. Selected text is black (DEC-023).

## DEC-034: Changes to the Figma Login frame (241:1732)

Context: rule 0 says the client's Figma wins, but this frame shows things the agreed rules do not allow. Decided by the Developer on 2026-11-06. Layout, title, headings and the red button follow the frame.
Decision, with the reason for each:
- Username instead of Email Address (241:1108, 241:1106): accounts have usernames and the system sends no email (A-07, A-13). The Parent sign-up fields have no email.
- No "Forgot password?" link (241:1111): there is no email; the approver resets passwords and shows a temporary password once (BR-05, A-13). A dead link would mislead.
- No terms checkbox (241:1117, 241:1118): no terms text exists and Annex A does not ask for one. A box with no terms behind it means nothing.
- No stock photo (241:1101, 241:1102): DESIGN_LANGUAGE rule 7 bars stock illustrations and its license is unknown. The right panel is a plain `nav` panel, hidden on phones.
- No emblem (241:1100): rule 10 allows the RIC emblem only with client approval, which is not given yet.
Consequences: each removed element is listed in docs/SPRINT_SHORTCUTS.md, so the photo and emblem can return in hardening if the client wants them.

## DEC-035: Memory limits after the laptop ran out of memory

Context: on 2026-11-06 the system stopped a typecheck and test run because memory was critically low. Decided by the Developer.
Decision:
- `test.maxWorkers: 2` in `vitest.config.mjs`, at the root, so every inline project inherits it (Vitest 5 docs, read through Context7: option `maxWorkers`; inline projects inherit the root config by default).
- ESLint heap 3072 MB instead of 4096. Verified: two full runs at the end of S2 finished lint without running out of memory.
- One command at a time, in the foreground. No `npm run dev` during tests or lint.
- While working: `tsc -b`, then vitest on the changed files or project, then `npx eslint --cache` on the changed files only. The full `npm run check` runs only at the end of S2, S4 and S6 (this replaces "at the end of each stage" in the sprint plan).
- A run killed for memory is reported and work stops; at most one automatic retry.
- The CUT lists of S2 to S5 apply from the start (docs/SPRINT_SHORTCUTS.md).

## DEC-036: FullCalendar 6, and the menu preview without a 410

Context: S3 packages and the phase 4 preview token.
Decision:
- FullCalendar 6.1.22, not 7.1.3. Version 7 needs `temporal-polyfill` and `@full-ui/headless-calendar`, which are outside the sprint's approved list.
- The parsed preview is held in server memory for 30 minutes and the uploaded file is never stored (sprint plan). A restart forgets open previews; the Admin uploads again.
- Phase 4 asks for 410 on an expired token, but the shared error codes (blueprint 4.8) have no 410. An expired, used or unknown token answers 409 STATE_INVALID, "This preview has expired. Please upload the file again."
- `replaceOverlap` is not built (S3 cut): a file that overlaps existing dates can be previewed and shows the overlapping dates, but it gets no token and cannot be confirmed.

## DEC-037: Demo polish decisions (D1 to D13) and shell defaults

Context: docs/POLISH_PLAN.md section 1, decided by the Developer on 2026-11-07. Where Figma and an earlier decision differ, Figma wins on layout and labels and these decisions win on business rules.
Decision:
- D1 Image permission: the client allowed using the images, logos and layouts from their Figma file. Assets are exported only from that file into `client/src/assets`, each under 300 KB. This replaces the photo and emblem parts of DEC-034, and DEC-033 (sidebar icons are now the client's images). DEC-034 stays for Username, no forgot-password link and no terms box.
- D2 A Parent sees the whole calendar of their own center (menu names and assigned parents' names on every day), but purchase request details and editing only on assigned days. Replaces A-06 and DEC-024 for visibility.
- D3 On assigned OPEN days a Parent may add rows, edit unit, quantity, unit cost and description of any row, and delete only rows they created. A Teacher may edit or delete any row. Rows keep `created_by`. Budget, child count and rate stay hidden from Parents. Replaces A-14 and BR-12 for Parents.
- D4 A week (Monday to Sunday) has a team of at most 4 distinct approved parents of the Teacher's center; each feeding day gets zero to four of them. `PUT /api/assignments/week` saves the whole week in one transaction.
- D5 The Summary of Disbursement table moves into the Liquidation Forms overlay; the calendar page keeps a one-line month summary linking to it.
- D6 Setting DEFAULT_PASSWORD, default `RICPortal2026!` for development and the demo; production sets its own. A reset sets it and forces a change at next login; no password is logged or returned. A blank password on account creation means the default.
- D7 Every date in tables, forms and PDFs is MM/DD/YYYY; long dates only in headings. One shared formatter. Inputs are masked text fields; the API keeps YYYY-MM-DD.
- D8 Disabled users: red "Disabled" badge, muted row, action button reads Enable; never color alone.
- D9 The student form copies Figma "add enroll". Extra fields go in one nullable TEXT column `profile_extra` holding Zod-validated JSON. Flagged for client confirmation (A-17).
- D10 Navigation labels and pages as in docs/ui-specs/shell.md. Unbuilt Objective 3 pages are marked in docs/SPRINT_SHORTCUTS.md.
- D11 Every role has a Profile page: name, username, role, center, mobile; edit name and mobile; change password.
- D12 The sidebar is fixed to the viewport height with a scrolling menu and a pinned LOGOUT.
- D13 Desktop pages have the Figma footer at the bottom of a full-height page column.

Defaults chosen for F1 (no question asked, per the plan):
- D10 writes LOGOUT and upper-case Teacher labels where Figma has "Log out" and title case. D10 lists them as exact, so its text is used. "DASHBOARD (HOME)" is the label DASHBOARD on the home route.
- D10 leaves Centers and Menu Imports out of the Admin menu, and Assignments out of the Teacher menu. The demo needs them, so the routes stay and the home page links to them. Assignments goes away when F2 moves it into the calendar.
- One AppShell for all three roles. Parent frames are phone-only with no sidebar, and D10 and D11 give the Parent the same menu, so ParentLayout is removed. Its test was replaced by Parent menu tests (docs/POLISH_LOG.md lists this).
- Selected nav text and icon stay black on the pink item (DEC-023). The "RIC" wordmark in `primary` on black is 3.9:1, below AA for its size. Kept because it is the client's logotype.
- Copyright year 2026 (real data) where Figma has 2025. The footer tagline uses Montserrat because Figma's Mozilla Headline is not installed.
- The notification bell with its count (111:965) is left out: there are no notifications, and a fake count would mislead.
- Profile shows only the D11 fields. The frame's report cards, activity lists, date of birth, address, two-factor and session panels have no data behind them.
- Phones use PARENT LOGIN 393:1102 for the login page because it keeps the red brand. The Admin phone login (380:1149) is green with the title unreadable over the photo.
- The phone top bar follows Calendar mobile 378:15722: a black band with the logo and a hamburger (corrected in F2; F1 wrongly said no frame shows it). No frame shows the menu drawer it opens, so that drawer is Developer-designed from tokens (docs/ui-specs/shell.md). Client approval requested.
- The login photo is exported at 0.7x (378 x 714) to stay under 300 KB, not at 2x. It may look soft on large screens.
Consequences: blueprint rows BR-05, BR-12, BR-14, A-06, A-14 and A-17 are updated. Recorded in BUSINESS_RULES.md.

## DEC-038: Defaults chosen in F2 (calendar, assignment, Parent flow)

Context: details D2 to D5 leave open. No question asked, per docs/POLISH_PLAN.md.
Decision:
- The team lives in a new table `week_team_members`, because a team member with no days yet would be lost if the team were only derived from the day rows. A day saved before this table existed still counts towards the team when reading.
- The old `PUT /api/assignments/:date` stays (tests and the demo seed use it), but it refuses a parent who would take the week past 4, and it adds a new parent to the team in the same transaction, so D4 cannot be bypassed.
- A Parent's first row on an assigned day that has no Purchase Request yet opens it. D3 says "while the day is OPEN"; without this a Parent could not start a day the Teacher has not opened. Locked and No feeding days stay blocked.
- On a day the Parent is not assigned to, `/api/parent-schedule` gives `status: null`. The status is part of the purchase request, which D2 hides.
- Older rows have `created_by` null, so no Parent can delete them; a Teacher can.
- The schedule now lists every menu, so it refuses a range over 62 days or one that runs backwards.
- Figma's Price column is the line total: its sample rows add up to its Total (170 + 120 + 120 + 20 + 20 = 450). Unit cost is edited in the row's fields.
- The Teacher and the Parent share one table (PurchaseItemsTable). This replaces the Teacher's stacked form, the first row of the "Purchase Request screens" table in docs/SPRINT_SHORTCUTS.md.
- The list view on phones is gone: both Figma phone frames show the month grid. `@fullcalendar/list` stays installed but unused; removing it is a BACKLOG item, so package files do not change this close to the demo.
- The weekly board page `/assignments` is removed; its job moved into the calendar's Assign Parents modal.
- Roboto Condensed (Figma's calendar font) is not on the approved package list, so the calendar uses Montserrat.
- SAVE keeps the red button although Figma draws it green (DEC-028, no green variant).
Consequences: new tokens `calendar-bar`, `tag`, `tag-tint` (docs/tokens.md). Additive migration `20261107085701_polish_week_team_created_by`.

## DEC-039: Defaults chosen in F3 (students and numeric dates)

Context: details D7 and D9 leave open. No question asked, per docs/POLISH_PLAN.md. All of it is listed for the client in docs/ui-specs/student-form.md.
Decision:
- Required fields stay the blueprint's. Figma marks about 40 more with `*`, but D9 flags the mapping for confirmation and the blueprint wins on business rules. Those fields are optional in `profile_extra` and show no `*`.
- Weight, height, parent or guardian and date enrolled are not in the Figma form but stay, at the end of section I, because the Enrollment Form PDF prints them.
- The form is a page (`/students/new`, `/students/:id/edit`) as Figma draws it, not a modal.
- Figma's dropdowns with unknown option lists (barangay, municipality, religion, relationship, civil status and so on) are text fields. Inventing lists would be worse. A new student starts with Libmanan, Camarines Sur, Region V.
- Sex is drawn as square boxes but only one can be chosen, so it uses radios.
- Student ID is a display code, not stored: "RIC 26-007" from the school year and the row id. It is unique and does not count 1, 2, 3 (CLAUDE.md: IDs are not sequential). This replaces the SPRINT_SHORTCUTS row that left the column out.
- D7 wins over Figma's long dates in tables ("March 21, 2026") and over its YYYY-MM-DD hints.
- A `profile_extra` that cannot be read comes back as null, so one damaged row cannot break the list.
- Whole-form limit of 6000 characters. The TEXT column holds far more; the limit guards against abuse, and a filled-in form stays well under it.
- Export List stays out (not in the sprint scope); the Enrollment Form button keeps its place.
- `formatFormDate` in the PDF module is now the shared `formatNumericDate`, so there is one formatter (D7).
Consequences: additive migration `20261107093727_polish_student_profile_extra`.

## DEC-040: Defaults chosen in F4 (Admin pages and passwords)

Context: details D6, D8 and D10 leave open. No question asked, per docs/POLISH_PLAN.md.
Decision:
- DEFAULT_PASSWORD is an environment setting, required in production and defaulting to `RICPortal2026!` elsewhere, like ADMIN_PASSWORD. The Admin's own password is not affected.
- A password typed when creating a Teacher is used but still has to be changed at the next login, as with the default.
- Parents sign up with their own password, so only the reset applies to them.
- `generateTemporaryPassword` no longer has a caller. It stays because its test does; removing both is a BACKLOG item.
- D8 says "Disabled", so that word replaces Figma's "Inactive" on the RIC Teachers page, in the badge, the filter and the card.
- Dashboard cards: Figma's "Enrollment Reports Submitted" and "Accomplishment Reports Submitted" have no data before Objective 3, so those two cards show liquidation reports by status (Submitted, Approved). D10 asks for reports by status. "Registered RIC Teacher" and "Total Enrolled Students" and "Reports for Revision" keep Figma's labels.
- "Registered RIC Teacher" counts active teachers only; "Total Enrolled Students" counts active students of the current school year (plan F4).
- Quick Actions: Figma's "Send Feedback", "Monitor Enrolled Students" and "Review Applications" have no pages, so they are replaced by real links: View reports (Figma's label), RIC Teachers, Centers and Menu Imports. This also keeps Centers and Menu Imports reachable (D10).
- RIC Teachers: Figma's Email becomes Username (no emails, DEC-034); Date Approved becomes Last Login (teachers are not approved); View Profile and the note about it are left out (no teacher profile page); Teacher ID is a display code from the row id, not stored.
- Reports: the status cards replace Figma's report-type cards, and the Report Type, Month and Teacher filters and the tabs are left out, because only liquidation reports exist and the plan asks for a status filter. A # column, type badge and Barangay column follow the frame.
- Table can render cards under 768 px (`cardsOnPhone`), used by the Teachers, Parents and Reports lists and the dashboard.
- The Teachers page reads its cards from `GET /api/dashboard/summary` too, so there is one place that counts.
Consequences: `DEFAULT_PASSWORD` is added to .env.example and the release runbook. TemporaryPasswordDialog is removed. **Before a real deployment, set your own DEFAULT_PASSWORD:** anyone who knows it can log in to a freshly reset account until its owner changes it.

## DEC-041: Defaults chosen in F5 (Teacher pages)

Context: details D10 leaves open. No question asked, per docs/POLISH_PLAN.md.
Decision:
- Teacher Home: Pending Reports counts reports waiting for the Admin (Submitted), and Return for Revision counts Need Revision. Figma's Report Tracking box is left out because Report Status shows the same thing.
- Quick Action "Submit Report" goes to the "Coming soon" page as D10 says. The liquidation Submit Report stays in the Calendar's Liquidation Forms.
- Report Status steps follow BR-07 (Submitted, Need Revision, Approved). Figma's Pending and For Approval are not agreed statuses (DEC-028).
- Admin Feedback lists only feedback on returned reports (D10). Figma's Approved with Remarks and Resolved cards, status timeline, Feedback Guide and filters have no data before Objective 3 and are left out. Figma's report-type, year and search filters likewise.
- "Revise Report" goes to the Calendar, where the days are fixed and the report is submitted again.

## DEC-042: One test worker for the final runs

Context: the final full test run of F6 was stopped by the system because memory was critically low. The Developer asked for the tests per project, on the lowest worker settings that work. Vitest 5 docs, read through Context7: `--maxWorkers` is a CLI option, and `--no-file-parallelism` overrides it to 1.
Decision:
- Final runs on this laptop: `npx vitest run --project unit --maxWorkers=1`, then `db`, then `client`, one after another. All three finished on one worker.
- A CLI flag for these runs only. `vitest.config.mjs` keeps `maxWorkers: 2` (DEC-035), so nothing else changes. `npm run test` still runs all projects together, about 10 minutes on two workers, and is what memory stopped.

## DEC-043: Fixes from the browser check after v0.9.1-demo

Context: the Developer asked for the Playwright check on 2026-11-07, after the tag. It found problems the tests could not see.
Decision:
- The Figma exports of the waves and three footer logos had an opaque rgb(51,49,49) background baked in. It was removed from the client's own images in a browser canvas, with no new package. The waves keep the line color and use eight opacity levels to stay under 300 KB (164 KB). The originals stay in git history. If the client can supply transparent originals, they should replace these.
- FullCalendar's rules are as specific as ours and load later, so the calendar's overrides carry one more class.
- The icon button's hidden hover label is removed under 768 px, where it pushed the page sideways and there is no hover. The button keeps its aria-label.
- The family table becomes a table from 1536 px (cards before that), because it clipped MM/DD/YYYY at 1440 px.
- The five dashboard cards share one row from 1280 px, as Figma shows.
- useNativeDialog restores focus when a dialog is removed while open, because the browser does this only on close().

## DEC-044: Density modes and viewport fit (Polish Round 2, G1)

Context: docs/POLISH_PLAN_2.md D1 to D5. Details the plan leaves open. No question asked, as the plan says. The plan numbers decisions from DEC-043, but that number was already used, so this round starts at DEC-044.
Decision:
- Compact and comfortable modes as in docs/tokens.md. Tailwind's spacing 11 is mapped to `--control-h`, so the class names on the components stay as they were and their tests still hold.
- The root formula changed from the plan's starting value after measuring. See docs/tokens.md.
- D3 says the footer stays put, but the full Teacher footer is 383 px tall in Figma and much taller when stacked on a phone. So the footer is pinned only in compact, as a compact band with the same content (about 145 px at 1366 x 768). In the comfortable mode the page column scrolls with the footer at its end. The document scrolls in neither.
- A Modal is inset by `--sidebar-w`, which is 0 under 1024 px. A Modal outside the shell would be off center from 1024 px, but none exists today: the only Modal in the auth pages is on Profile, which is inside the shell.
- One SidebarBrand for every role, with the Teacher frame's values. The Admin's divider becomes red like the Teacher's. Figma's larger Admin emblem (267:9689) is replaced, as D5 says.
- The window no longer scrolls, so AppShell resets its scrollers when the route changes.

## DEC-045: Defaults chosen in G2 (Admin)

Context: details that docs/POLISH_PLAN_2.md D6 to D9 leave open. No question asked, as the plan says.
Decision:
- D6's labels use Figma's spelling: Registered RIC Teacher, Total Enrolled Students, Enrollment Reports Submitted, Accomplishment Reports Submitted, Reports for Revision. The third card has no Figma card, so it is "Reports Submitted", plural like the rest. The plan's capitals come from CSS, so the text stays as Figma spells it.
- The "Reports Approved" card is removed, as D6's list has no such card. The count stays in the API because nothing else changes there.
- The Upload panel tells the truth about the importer: .xlsx only. A file that overlaps menu dates already imported is still refused, with no Confirm button.
- The panel's preview opens in a Modal. The import history stays on /menu-imports, which also keeps its own full flow, and the panel links there.
- The Admin's header has no grey bar and a small user block, as 267:9689 shows. This gives the dashboard the height it needs to fit.
- The dashboard's calendar shows one line per day, with the full name in a tooltip, so six weeks fit. The Calendar page keeps wrapped names.
- Sex is Female or Male only, as the frame shows. A birth date cannot be in the future.
- The profile saves only the extra fields that changed, so an unchanged form never overwrites them.
- Test changes, all required by the plan: the dashboard test's Reports Approved row became D6's cards. The reset test moved from TeachersPage.test.tsx to TeacherProfilePage.test.tsx with the same assertions, because D8 moves the button. The Disabled badge assertion now looks among two matches, because the toggle shows the same word.

## DEC-046: Defaults chosen in G3 (Teacher pages)

Context: details that docs/POLISH_PLAN_2.md D3 and D10 leave open. No question asked, as the plan says.
Decision:
- Teacher Home counts as a dashboard page, because Figma names the frame "RIC dashboard". Figma stacks Recent Reports and Enrolled Students under the calendar, which cannot fit above the footer at 1366 x 768. On a desktop the same content sits in three columns, and it stacks below that.
- Figma's Report Tracking box returns (it was left out by DEC-041), showing what the report list holds: the latest report, its submitted date and its status. Figma's per-step dates have no data source.
- When a feedback box shows on Home, the student list shortens from four rows to two so the page still fits. The third column scrolls by itself only if a long text still does not fit. (Changed by DEC-047.)
- The day-panel tags point at the Purchase Request from 1024 px, as 166:1553 shows. Below that they keep the Parent frame's direction.
- Student names in the list are black and underlined, as 78:260 shows.
- On Report Status the details column sits beside the list on a desktop, as 78:284 shows. The Admin's Reports page keeps the full-width list, because its table has more columns and overflowed in the narrower one.
- Tables on Centers and Menu Imports become cards on phones, so nothing scrolls sideways.
- An icon button's hover label now runs left from the button's right edge, so the hidden label cannot widen a table.

## DEC-047: Fixes from the G4 audit (Polish Round 2)

Context: the G4 audit added two cases the earlier audits did not cover: Teacher Home with the Admin Feedback box, and touch screens of 1024 px and up (comfortable mode, 16 px root). It also measured 1024 x 768 with a mouse for the first time. No question asked, as the plan says.
Decision:
- With a feedback box, Teacher Home hides its Enrolled Students preview on a desktop screen under 900 px tall (`compact:[@media(max-height:899px)]:hidden`). The column overflowed by 98 px at 1366 x 768 and 28 px at 1536 x 864. The "View all students" link stays on the summary card above. Taller screens, tablets and phones keep the preview. This replaces the DEC-046 note that the column would scroll.
- `cardsUntilDesktop` now keeps the cards until 1280 px, and always on touch screens: the table shows only in compact mode from 1280 px (`compact:xl:`). At 1024 px the Reports table was 381 px too wide, and on touch screens it still overflowed at 1366 px. It is used on Reports, RIC Teachers, the Admin dashboard's Recent Reports and Teacher Home's two tables.
- The Admin dashboard's Recent Reports section scrolls (`overflow-y-auto`) instead of clipping (`overflow-hidden`). At 1024 x 768 its cards were cut off without a scrollbar. From 1280 px the audit found nothing hidden.
- Student list cells are 8 px from the side outside compact mode (12 px in compact), so the table fits a 1024 px touch screen. It was 9 px too wide.
- A calendar dish name longer than its cell breaks (`overflow-wrap: anywhere`) instead of being cut off. This shows only where a word is wider than the cell: comfortable mode from 1024 px. The fit calendars in compact mode keep one line with an ellipsis.
- For the audit only, the port 3100 test server ran with RATE_LIMIT_MAX=100000 set in the shell, because one audit pass is more than 300 requests. Nothing in the code or config changed.

## DEC-048: Defaults chosen in Round 3, H1 (shell, Admin pages)

Context: docs/POLISH_PLAN_3.md D1 to D6. No question asked, as the plan says.
Decision:
- D1: AppShell's page column is header plus one scrolling content area; `main` (flex-1) and the footer are its children, the footer last with `mt-auto`, never fixed or sticky. This replaces DEC-044's pinned compact footer, so the footer's compact band is gone and the full Figma footer shows after scrolling.
- The content area is a size container (`container-type: size`). Pages that must fit the screen use `FIT_SCREEN` (`client/src/lib/layout.ts`: 100cqh less the page padding). Dashboards keep their full height and the footer follows below the fold.
- D2: Login fields use `--login-field-h` and `--login-field-text` (docs/tokens.md). The form column is 479/1280 of the width as in Figma (`clamp(22.5rem, 37.4vw, 36rem)`). Input gets a `fieldSize` prop; other inputs are unchanged.
- D3: the top bar has `max(12px, 0.75rem)` above and below and `max(12px, 1.5rem)` on the right; the user block is centered. Measured 12 px top, 18 to 22 px right.
- D4: card labels are title case as Figma sets them (Round 2's CSS capitals are dropped); text and order stay as DEC-045. Quick Action tiles lose their own border; panels use the card radius; the dashboard's upload link becomes Figma's labelled dashed box, still saying .xlsx (DEC-045).
- D5: the calendar month fits the content area on a desktop. The Admin's center choice moves into the page header. FullCalendar always shows six weeks, so each week row gets a sixth of the height, and the dish names are taken out of the row's flow in fit mode. Names: two lines, ellipsis, 11 to 13 px by cell width (container query), full name on hover (title), on keyboard focus (clamp lifted) and in the day panel. This replaces DEC-045's one line on the dashboard calendar and DEC-047's mid-word breaking.
- D6: the three card icons are cropped from the Figma render of 267:9862, because that frame's content is one flat image with no separate icon layers. Each is 96 x 96 px, under 14 KB. Assigned Barangays keeps the map-pin icon. `TeacherDto` gains `createdAt` for Date Approved; Last Login stays on View Profile. The toggle is a 44 px (comfortable) round icon button.
- Test changes required by the plan: the D13 footer test and the compact scroll test in layouts.test.tsx now check D1's structure; the TeachersPage toggle test now expects no visible words (D6) and the Last Login column test became the Date Approved test; the dashboard order test finds labels by `data-card-label` instead of the uppercase class.

## DEC-049: Defaults chosen in Round 3, H2 (Profiles and data)

Context: docs/POLISH_PLAN_3.md D7. No question asked, as the plan says.
Decision:
- Data: the existing `email`, `sex`, `birth_date` and `address` serve D7's email, gender, date_of_birth and address. The migration `polish3_login_events` only adds `users.password_changed_at` (nullable) and the `login_events` table.
- `password_changed_at` is set on a password change and on a reset to the default, and is empty until then. The page shows "Not changed yet" for an empty value. The days are whole Manila calendar days, computed on the server (`passwordChangedDaysAgo`).
- A login event is written in one transaction with `last_login_at`, only after every login check has passed.
- Activity counts. Admin: Teachers Managed is every Teacher account, active or disabled; Enrolled Students Monitored uses the same rule as the dashboard (ACTIVE in the current school year); Reports Generated is reports of type LIQUIDATION. Teacher: the same student rule for their center, ACTIVE Parents of the center, and all reports of the center. Parent: Logins This Month only. "This month" is the Manila calendar month.
- Layout: D7 puts every role on the Admin frame's layout, although the Teacher frame 88:695 has a different one (detail columns, report cards and status activity). D7 wins. Parent has no frame and uses the same layout.
- Kept for the Teacher, because they exist only here: Teacher ID and center in Account Summary, Position and Qualification in Personal Information and the edit form. The Admin and Parent edit forms have the six fields D7 lists.
- Removed from the own Profile page, because the D7 content does not list them: Username, and the Last Login value (Login History replaces it). The Admin's View Profile still shows Last Login, and its "Date Registered" is now "Date Approved".
- The Admin footer line follows the Admin frame with the year 2026: "© 2026 RICPortal: Rural Improvement Club, Libmanan, Camarines Sur. All rights reserved." The Teacher and Parent footers and Login keep the shorter line of their frames.
- Seven icons added from lucide-static 1.70.0, fetched from the published package and pinned in icons.test.tsx: chart-column, clock, mail, phone, shield-check, smartphone, user.
- Test changes required by D7: `ProfilePage.test.tsx` now finds the new labels and the header card, and no longer expects Username or "Never"; the Admin footer test in `layouts.test.tsx` expects the new full line.

## DEC-050: Defaults chosen in Round 3, H3 (Teacher pages)

Context: docs/POLISH_PLAN_3.md D8, D9 and D10. No question asked, as the plan says.
Decision:
- D8 replaces two Round 2 rules (DEC-046, DEC-047): the page fits its top rows to one desktop screen (header, cards, then Quick Actions, calendar and the two cards), and Enrolled Students follows below that row, reached by scrolling the content area. So the preview is no longer hidden on a short screen, and it always lists four students.
- D8 removes Figma's Recent Reports box, as the plan says, although frame 175:1023 shows it. Report Tracking lists the latest three liquidation submissions with their status, not the timeline of one report in the frame, because the report list holds no per-status dates. Admin Feedback is always shown, with "No feedback yet." when empty, and offers Revise and Resubmit only for a report that needs revision.
- The student preview has Figma's #, Add Student and edit icon. The frame's trash icon is left out here: archiving stays on Enrolled Students, with its confirmation.
- D9: Export List opens a dialog with School Year (the current year selected, earlier years offered) and Date Started, then the same Enrollment Form PDF.
- D10: new `GET /api/child-records` (Teacher only, own center, ACTIVE children of the current school year, q and page) with `records` counts of live entries. It reuses the student list scope. Entries use the existing child-records API. The menu label is "CHILD'S RECORD", after CALENDAR, in capitals like the other items (DEC-037). It shares the form icon with PARENT REQUESTS.
- Grade in frame 169:3189 is left out, because there is no data for it. Frame 254:4572 is the Add Student form, so the record detail with tabs has no frame of its own and uses the existing tab layout (DESIGN_LANGUAGE).
- Not changed: the client's student pages stay Teacher-only, as since S2. The Admin's read access is the API (`/api/students`), with no page.
- Test changes required by D8: in `TeacherHomePage.test.tsx`, "two students beside a feedback box" and "hides the preview on a short screen" are replaced by the D8 tests. `layouts.test.tsx` adds CHILD'S RECORD to the menu order.

## DEC-051: Defaults chosen in Round 4, I1 (Admin)

Context: docs/POLISH_PLAN_4.md D1 to D6. No question asked, as the plan says. The Figma server could not be reached this round (ENOTFOUND), so the reference images in docs/feedback/ and the Round 3 measurements are the source.
Decision:
- D1: five cards in one row from 1024 px with a mouse (`compact:grid-cols-5`), each with Figma's 4 px bottom border, green or red. This reverses DEC-045's six cards; `GET /api/dashboard/summary` still returns the total. The cards keep the existing icons (users, file-text, circle-alert): Figma's teacher, cap and triangle shapes are not in the icon set and could not be exported without Figma.
- D2: `MiniCalendar` (CSS grid, `client/src/features/calendar/mini-calendar.ts` builds the 42 cells) on the Admin dashboard. Clicking a day opens `/calendar?date=YYYY-MM-DD`; the Calendar page reads the date, opens FullCalendar at that month (`initialDate`) and selects the day. An invalid date in the address is ignored. `WEEKDAY_LABELS` moved into mini-calendar.ts so the dashboard does not load FullCalendar.
- D3: Send Feedback and View Reports both open /reports (there is no separate feedback page for the Admin). The fourth tile uses `warning-soft`, the yellow token. Centers is a "Manage Centers" link on RIC Teachers; Menu Imports stays reachable from the Calendar's "View import history". `EXTRA_LINKS_BY_ROLE` is unchanged.
- D4: `/admin/students` and `/admin/students/:id` (Admin only). Center names come from the centers list, because `StudentDto` has only `centerId`. Only ACTIVE students are listed. The record reuses the Teacher's three tabs with a `readOnly` prop that hides Add, Edit and Delete.
- D5: `Tabs` gains a `pill` variant (Figma's green tabs). Report Type reads "Liquidation Report". The section keeps scrolling inside itself when it is short (DEC-047).
- D6: the page title of the Admin dashboard and the Admin Calendar sits in the top bar row from 1024 px through `TopBarTitle`, a portal into a slot in AppShell's header; under 1024 px it stays above the page. The Teacher's Calendar keeps its PageHeader. The banner shows when the month on screen has no menu (the days of the neighbouring months that the grid shows do not count), with the month and year; its Upload Document button focuses the upload card's file input. `Button` gains an `accent` variant (dark green, amends DEC-028's "no green variant"); Upload & Process uses it. A file not ending in .xlsx is refused in the browser before any upload.
- D8 (started here): `Table` gains `band` (header token #f0f0f0, bold 12 px, class `ric-table-band`). The Figma node could not be measured this round, so the existing header token is used; Round 3 recorded #f0f0f0 as Figma's header grey.
- Test changes required by the plan: `AdminDashboardPage.test.tsx` now expects five cards (D1 reverses the six-card test), Figma's Quick Actions (the "Centers and Menu Imports one click away" test is replaced by the Manage Centers test in TeachersPage.test.tsx, D3), and "Liquidation Report" as the Report Type.
- Client tests: Testing Library's `asyncUtilTimeout` is 5 s (client/test/setup.ts) instead of 1 s. Two new tests passed alone and failed in a group run only because a page with its queries took more than a second to render under load. No assertion changed (the same reasoning as DEC-029).

## DEC-052: Defaults chosen in Round 4, I2 (Teacher pages)

Context: docs/POLISH_PLAN_4.md D7 to D9. No question asked, as the plan says. Figma could not be reached this round.
Decision:
- D7: frame 175:1023 could not be read again. The differences were taken from what Rounds 2 and 3 recorded about it (DEC-046, DEC-050) and listed in docs/POLISH_LOG.md before fixing. Figma's Recent Reports box returns (this reverses DEC-050's removal) with the own liquidation reports, newest four, and sits with Enrolled Students under the calendar, in its column, Recent Reports first. Teacher Home also uses `MiniCalendar` (D2). The top rows still fit one desktop screen; the two cards follow after a scroll, as in Round 3.
- D8: the header band uses the existing `header` token (#f0f0f0). It is applied to Teacher Home's two tables, the Admin Students table and the Teacher Profile's reports. Other tables keep their plain header: without the Figma nodes, there is no measurement saying which frames show a band.
- D9 data: `users.qualification` already exists (VARCHAR(160), nullable, migration `20261107162151_polish2_report_types_profile_fields`) and is already in the Edit Profile form and `PATCH /api/auth/profile`. So this round adds no migration; a db test checks both.
- D9 endpoint: `GET /api/auth/profile/teacher-summary` (Teacher only). The reports page is in `meta`; `activity` is the latest 10 entries, not paged, because the timeline in the frame shows a short list. Activity comes from liquidation snapshots (version 1 "Report submitted.", later versions "Report resubmitted.") and reviews ("Returned for revision.", "Admin approved the report."); a report with no snapshot shows its `submitted_at` as "Report submitted.". Only LIQUIDATION reports count, as the plan says for Submitted. Display codes use the Manila year (`shared/src/display-codes.ts`). The Profile's existing "RIC-TCHR-002" code (DEC-040) stays on the Admin pages; the Teacher Profile header shows the D9 code.
- D9 layout: the Teacher sees the header card, four stat cards, Recent Submitted Reports with numbered pages (5 per page, server side) and Recent Status Activity, then the Round 3 Personal Information and Account Security cards. Account Summary and System Activity are no longer shown to the Teacher (the header and stat cards replace them); Admin and Parent are unchanged. The activity text shows no report code (Figma shows none); the code is in its tooltip.
- Test changes required by the plan: in `TeacherHomePage.test.tsx`, "the calendar fills its box", "the student preview sits below the calendar row" and "Report Tracking and Admin Feedback replace Recent Reports" are replaced by the D2 and D7 tests. In `ProfilePage.test.tsx`, the Round 3 Teacher header and counts tests and the "frame's fields" test become D9 tests; "View All Activity opens the last logins" now runs as the Admin, because the Teacher no longer has that card. The permission matrix gains the new route.

## DEC-053: Teacher Home follows frame 175:1023, read on 2026-11-14 (Round 4, D7)

Context: docs/POLISH_PLAN_4.md D7. The Figma server connected on 2026-11-14, so frame 175:1023 was read
(`get_metadata` and one screenshot, saved as docs/feedback/figma-teacher-home.png). The I2 layout
(DEC-052) came from older notes and differed from the frame. No question asked, as the plan says.
Decision:
- Rows as the frame: header; four stat cards (346 x 133 at 1920, gaps about 4% of the width); then Quick
  Actions (375 px), the calendar (690 x 523) and the right column (322 px) with gaps of 108 and 73 px; then
  Recent Reports (593 px) and Enrolled Students (759 px) side by side, with the frame's 175 px left free at
  the right. This reverses DEC-052's "both cards in the calendar's column".
- On compact desktops (`compact`, 1024 px and up with a fine pointer) the widths are fractions of the
  frame's pixels (`[375fr_108fr_690fr_73fr_322fr]`, `[593fr_759fr_175fr]`), and heights use rem values equal
  to the frame's pixels scaled like the rest of the app (stat cards `min-h-32`, tiles `min-h-[7.5rem]`,
  Report Tracking, Admin Feedback and the two bottom cards `min-h-52`). The calendar keeps the frame's
  690:523 ratio. Phones and touch laptops keep the stacked layout.
- Report Tracking starts level with the calendar's weekday row, as in the frame. Our month heading is
  shorter than the frame's, so that row sits 40 px below the row top at 1440 (frame: 81 px when scaled).
- Home no longer uses `FIT_SCREEN`: the frame's top rows are shorter than a screen and the bottom row
  follows them directly. Measured: the top rows end at y 684 at 1440x900 and y 665 at 1366x768.
- Recent Reports as the frame: columns "Report Title" (document icon and "Liquidation Report"), "Date",
  "Status"; three rows; link "View all reports →". Dates stay MM/DD/YYYY (plan section 3), not the frame's
  "June 7, 2026". Enrolled Students' link reads "View all →".
- Kept from the frame's differences, on purpose: Enrolled Students has no delete button (Teachers do not
  delete students) and keeps an "Actions" header for screen readers; its rows keep the 44 px touch height
  rather than the frame's 33 px.

## DEC-054: Code audit and the three high fixes (Plan 5, J1)

Context: docs/POLISH_PLAN_5.md J1. No question asked, as the plan says. Report: docs/AUDIT_REPORT.md.
Decision:
- Severity scale: critical = another user's data or an account can be reached now; high = a business rule
  or a security control fails in normal use or with two simple requests; medium = needs unusual timing, an
  unusual file or a deployment mistake; low = small or documentation. Only critical and high are fixed in J1;
  the rest are in docs/BACKLOG.md under their AUD ids, each with the Plan 5 stage that could take it.
- AUD-001 (BR-19): a login attempt is counted before its password is checked, with one conditional UPDATE.
  The fifth attempt taken sets the lock at once; a right password clears the count and the lock. So the
  rule "5 failures lock the account" is unchanged for one request at a time, and holds for parallel ones.
  Six right-password logins at the same moment can give one of them a 429; accepted.
- AUD-002 (BR-05): change-password refuses the current password and the default password. The check is in
  the service, because only the server knows the default; the shared Zod schema is unchanged.
- AUD-003 (BR-11, BR-12): adding or deleting a row first locks the day's request row with
  `SELECT ... FOR UPDATE` (raw SQL through Prisma, in the repository). MariaDB and TiDB both accept it
  (DEC-005); it ran only on MariaDB. A unique index on (request, item number) was not added: it needs a
  migration that would fail where duplicate numbers already exist. No migration in J1.
- AUD-010, the login limit per IP, stays with J4 (a), which already plans it, although BR-19 and P1-T07
  describe it. It is rated medium: one guess of the shared default password needs no second try, so a
  limiter would not stop that; the real exposure is the default password itself (AUD-011, a client decision).
- The intermittent 404 (assignments-week test): cause narrowed, not proven (report section 4). The
  assertion in the test setup stays.
- docs/OBJ3_PLAN.md is a proposal. Its open questions and estimate wait for the Developer.

## DEC-055: Stage J1d, fixes for the medium findings on security and data integrity

Context: the Developer asked for a short extra stage after J1 (2026-11-15). No question asked. Log:
docs/POLISH_LOG.md "J1d".
Decision:
- AUD-009: NODE_ENV has no default. Missing or empty is treated exactly as production, so six settings
  are required (the three the Developer named, plus COOKIE_SECURE, SESSION_HOURS and ADMIN_USERNAME, which
  production already required). Any other word is refused. Only `.env.example` was changed; no `.env`
  file was read or written.
- Which medium findings count as "security or data integrity": AUD-004 to 010, 012, 014, 015, 016, 019,
  021, 022. Left in the backlog: AUD-011 (client decision), AUD-013 (form behaviour), AUD-017 (PDF font),
  AUD-018 (paging), AUD-020 (tests).
- AUD-004: no explicit lock. Each state change is one conditional UPDATE; submit marks only days still
  LOCKED or NO_FEEDING. The loser of a race gets 409.
- AUD-005: Prisma P2002 and P2034, and the driver's deadlock 1213, answer 409 CONFLICT for every route.
- AUD-006: the one-active-Teacher rule is enforced under a row lock on the center, not by a unique
  index (no migration).
- AUD-010: 30 failed logins per client address in 15 minutes, a constant in `config/limits.ts`, on when
  RATE_LIMIT_ENABLED is true. AUD-016: the global limit covers `/api` only. Both are parts of J4 (a) done
  early; J4 (a) has nothing left except a sign-up limit if wanted (AUD-042).
- AUD-012: logout increments `token_version`, so it ends the user's sessions on every device.
- AUD-014: Child's Record entries of an earlier school year answer 422 for add, edit and delete.
- AUD-015: transactions get 10 s to obtain a connection and 20 s in all, as the client default and
  explicitly on the week save. P2028 answers 503.
- AUD-019: for database errors the log keeps name, code and stack lines only.
- AUD-022: every connection runs `SET time_zone = '+00:00'`.
- Row locks (`SELECT ... FOR UPDATE`, AUD-003 and AUD-006) and the session time zone ran only on the
  local MariaDB. They must be run once against TiDB before go-live (DEC-016, by the Developer).
- docs/OBJ3_PLAN_REVIEW.md lists gaps in the Objective 3 plan. The plan is unchanged.


## DEC-057: GitHub Actions workflow (J4 h, brought forward), UNVERIFIED

Context: the Developer moved J4 (h) ahead of J5 on 2026-11-18 (lean order, step 2). No question asked.
DEC-056 stays reserved for the J2 decisions. Log: docs/POLISH_LOG.md "Developer's lean order".
Decision:
- `.github/workflows/ci.yml`, one job on ubuntu-latest, Node 22: `npm ci`, typecheck, lint, format
  check, the unit, db and client test projects as three separate steps on one worker each, build.
  Runs on every push and pull request; `permissions: contents: read`; no deployment.
- The database is a MariaDB 10.11 service container (MySQL-compatible), not the `mysql` image: the
  server uses `@prisma/adapter-mariadb` and local development uses XAMPP MariaDB (DEC-005), and a
  MySQL 8.4 container would need `mysql_native_password` turned on with a server option that service
  containers cannot pass. The db tests reach it at 127.0.0.1 as `ricportal_test`, so the test guard
  (DEC-019) accepts it; `migrate deploy` runs in the db group's global setup.
- No secrets: the database password is a throwaway value for the job's own container, and every other
  setting uses its non-production default (NODE_ENV=test). TZ=Asia/Manila as on the laptop. The build
  step alone sets NODE_ENV=production so Vite makes a production bundle.
- UNVERIFIED: it has never run. Its first run is the first push to GitHub; failures there are fixed
  then. No GitHub setting or secret is needed; Actions must simply be enabled for the repository
  (the default).
