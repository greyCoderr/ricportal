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
