# 6. Release Runbook (Hostinger Node.js)

> **Confirm every item below in your own Hostinger panel. Names and limits change by plan.**

**Environment variables.**

| Variable | Example and rule |
| --- | --- |
| NODE_ENV | `production` |
| PORT | Provided by the host or set to the value the panel requires |
| DATABASE_URL | `mysql://USER:PASSWORD@HOST:3306/DBNAME` using the database created in the panel |
| JWT_SECRET | 32 or more random characters. Never reuse the development value |
| COOKIE_SECURE | `true` |
| STORAGE_DIR | A persistent folder outside the web root with enough disk quota |
| MAX_UPLOAD_MB | `10` |
| TZ | `Asia/Manila` |
| LOG_LEVEL | `info` |
| ADMIN_USERNAME, ADMIN_PASSWORD | Used by the seed only; change the password at first login |
| DEFAULT_PASSWORD | What a password reset, or a blank password on a new account, sets (D6). Set your own in production; a change is forced at the next login |

**Release steps.**

1. Confirm `main` is green in CI and tagged.
2. Take a database backup and note the previous tag.
3. Build locally or on the host: `npm ci`, `npm run build`.
4. Upload or pull the release; set the Node version; set the start command to run the compiled server (for example `node server/dist/server.js`).
5. Run `npx prisma migrate deploy` (never `migrate dev` in production).
6. Seed once if the database is empty.
7. Restart the app and read the logs.
8. Run the smoke test below.
9. Record the release in docs/DEPLOY.md.

**Smoke test (5 minutes).** Open `/api/health`; log in as Admin; open Centers (28 rows); log in as a test Teacher; open the student list; open the calendar for the current month; generate one PDF; upload and download a small file; log out.

**Rollback.** Redeploy the previous tag. Because migrations are additive, the older code still works with the newer schema. Restore the database backup only if a migration damaged data.

**Monitoring.** Point a free uptime monitor at `/api/health`. Check logs after every release for the first week. Keep a note of the host's memory and process limits and watch for restarts during PDF generation.
