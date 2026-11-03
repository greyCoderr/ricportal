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
| `npm run dev:server` | Builds `shared`, then runs the `shared` watcher and the server (tsx watch, reads `.env`) |
| `npm run test` | Runs all tests (Vitest) |
| `npm run lint` | ESLint with type information |
| `npm run format` | Formats code with Prettier (never Markdown) |
| `npm run check` | Typecheck, lint, format check, tests and build. Must pass before every commit |

If a variable in `.env` is missing or invalid, the server prints which ones and exits with code 1.
It never prints the values.

Production build and start are added in P0-T15.

## Deploy

Postponed until before the defense. A draft checklist will be in `docs/DEPLOY.md` (P0-T15).
