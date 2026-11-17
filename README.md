# RICPortal

Web system for the Rural Improvement Club (RIC) program of the Municipal Agriculture Office,
Libmanan, Camarines Sur. Roles: Administrator (MAO), RIC Teacher, Parent.

## Requirements

- Node.js 22.13 or newer (`.nvmrc` pins 22)
- Local database: XAMPP MariaDB at `127.0.0.1:3306` with databases `ricportal` and `ricportal_test`
- Production database: TiDB Cloud (MySQL-compatible, TLS required)

## Install

```sh
npm ci
```

Copy the environment examples and adjust them for your machine:

```sh
cp .env.example .env
cp .env.test.example .env.test
```

Never commit `.env` files.

## Run, test, build

| Command | What it does |
| --- | --- |
| `npm run dev` | Builds `shared`, then runs the `shared` watcher, the server and the client together. Open http://localhost:5173; `/api` is proxied to the server on port 3000. If you change `PORT` in `.env`, also set `API_PORT` to the same number |
| `npm run dev -w @ricportal/client` | Only the client (Vite dev server on 5173) |
| `npm run dev:server` | Builds `shared`, then runs the `shared` watcher and the server (tsx watch, reads `.env`) |
| `npm run test` | Runs all tests (Vitest). Needs XAMPP MySQL running and `.env.test` (see Tests below) |
| `npm run test:unit` | Runs only the tests that need no database |
| `npm run lint` | ESLint with type information |
| `npm run format` | Formats code with Prettier (never Markdown) |
| `npm run db:migrate` | Applies migrations to the local database in `.env` (prisma migrate dev). New migration: `npm run db:migrate -- --name <name>` |
| `npm run db:seed` | Upserts the default settings (safe to run again) |
| `npm run db:check -w @ricportal/server` | Local database check: SELECT 1, TLS status, settings row count |
| `npm run check` | Typecheck, lint, format check, tests and build. Must pass before every commit |

If a variable in `.env` is missing or invalid, the server prints which ones and exits with code 1.
It never prints the values.

## Tests

Database tests use only the `ricportal_test` database (DEC-019):

- Create `.env.test` from `.env.test.example`. Keep `NODE_ENV=test` and a database name ending in `_test`.
- Before the database tests, `prisma migrate deploy` brings `ricportal_test` up to date. Each test file empties the tables it uses with `resetDatabase`.
- A guard refuses to run unless `NODE_ENV=test`, the database name ends with `_test` and the host is `127.0.0.1`, `localhost` or `::1`. The dev database and TiDB are never touched.
- If MySQL is not running, `npm run test` fails with "Test database is not reachable…". `npm run test:unit` still works.

The `tidb:deploy`, `tidb:seed` and `tidb:check` scripts in `server/package.json` read `.env.tidb`. Only the Developer runs them (DEC-016).

On a laptop with little memory, run one test project at a time on one worker, for example
`npx vitest run --project db --maxWorkers=1` (DEC-035).

## Demo data

`npm run db:seed:demo` rebuilds fake demo data in the local database from `.env`: 18 children of the
current school year and 4 of the year before, assigned days, Purchase Requests and three reviewed
liquidation reports. It refuses to run against anything but a local database.

## Build and start

`npm run build` builds `shared`, the server and the client; `npm start` serves `/api` and the built
client from one Node process (reads `.env` if it exists).

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: install, typecheck, lint, format check,
the unit, db (MariaDB service container) and client tests, build. It needs no secret and deploys
nothing. UNVERIFIED until its first run on GitHub (DEC-057).

## Documentation

Start at `docs/INDEX.md`. API: `docs/API.md`; data model: `docs/DATA_MODEL.md`; screens:
`docs/UI_MAP.md`; changes from Annex A: `docs/ANNEX_A_CHANGES.md`; questions for the clients:
`docs/OPEN_QUESTIONS.md`.

## Deploy

Postponed until before the defense. The draft checklist is `docs/DEPLOY.md`.
