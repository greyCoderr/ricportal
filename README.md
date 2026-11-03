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

Added in P0-T03 (scripts) and P0-T15 (production build and start).

## Deploy

Postponed until before the defense. A draft checklist will be in `docs/DEPLOY.md` (P0-T15).
