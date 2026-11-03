# Deploy

Exact Hostinger deployment steps that worked, with errors met and their fixes.

Status: DRAFT. Deployment is postponed until before the defense (DEC-006). The full checklist is written in P0-T15.

## Database: TiDB Cloud (DEC-005, DEC-016, DEC-018)

- Checked from the Developer's laptop in P0-T07b (2026-11-03, TiDB Cloud Starter, ap-southeast-1): migrate deploy, seed and TLS all passed.
- The production `DATABASE_URL` must include both query parameters:
  `mysql://USER:PASSWORD@HOST:4000/DBNAME?sslaccept=strict&connect_timeout=30`
  - `sslaccept=strict`: TLS with verified certificates (the app maps it to TLS 1.2+ in `core/db.ts`).
  - `connect_timeout=30`: without it, `prisma migrate deploy` failed with P1001. Keep it in the Hostinger env and in any CI secret that runs migrations.
- Schema changes on TiDB: only `prisma migrate deploy` (`npm run tidb:deploy -w @ricportal/server` with `.env.tidb`), run from the laptop or CI. Never from the running app, and never `migrate dev`.
- The user name includes the cluster prefix (`xxxx.root`). Never commit or paste the URL or password.
