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

## Settings that must be right on the host (code audit, Plan 5 J1d)

- `NODE_ENV=production` and all six auth settings (AUD-009). With NODE_ENV missing the server treats the
  host as production and refuses to start without them; it never falls back to the built-in secret.
- `TRUST_PROXY` (AUD-016, AUD-010): the number of proxies between the browser and Node. The rate limits
  count by client address. With 0 behind a proxy, every user has the proxy's address: all share one
  global limit, and 30 failed logins by anyone stop every login for up to 15 minutes. Set too high, a
  client can forge its address in `X-Forwarded-For` and escape the limits. Check on Hostinger by logging
  `req.ip` once from two different networks before go-live. Not checked yet (no deployment).
- The limits (global, login) are kept in the memory of one Node process. With more than one process each
  has its own count.
