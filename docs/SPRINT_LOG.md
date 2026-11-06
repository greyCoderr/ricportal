# Demo Sprint Log

Plan: docs/SPRINT_PLAN.md. Branch: demo-sprint. Newest stage at the bottom. Started Fri 2026-11-06.

## Blocker check (start)

XAMPP MySQL reachable on 3306. Fixture present as `server/test/fixtures/SF MENU for 30 days.xlsx` (the plan's name has underscores; handled in S3). Branch demo-sprint is checked out. `.claude/settings.json` has an uncommitted change that is not part of this work and is left alone.

## S0 Foundation minimum (budget 2 h)

Plan:
1. Lint script with a 4 GB heap through the eslint binary, cross-platform.
2. UI kit: Modal, Drawer, ConfirmDialog on native dialog (Escape through cancel), Table, Pagination. jsdom tests only for state and aria; real-browser focus goes to the manual list.
3. showModal stub in client/test/setup.ts.
4. More Lucide icons for navigation and actions, pinned to 1.70.0 by the existing test.
5. Shared roles enum. Role-aware nav config.
6. AppShell (sidebar and top bar) for Admin and Teacher, top bar layout for Parent, 403 and 404 pages.
7. Express serves client/dist with SPA fallback /{*splat} for non-/api paths; test it.
8. Root start script; build and start on one port.
9. npm run check, commit.
10. CUT if late: Pagination polish, Drawer animation.

Summary (S0):
- Done: lint with a 4 GB heap; Modal, Drawer, ConfirmDialog (native dialog, Escape through cancel), Table, Pagination; 16 more Lucide icons pinned to 1.70.0; shared roles; role nav, AppShell, ParentLayout, 403 and 404 pages; Express serves client/dist with /{*splat}; root `start` script. Smoke test on one port: / and /students 200 HTML, /api/health 200 JSON, /api/nope 404 JSON.
- Cut: none.
- Fixed: `server/src/core/logger.test.ts` failed by chance when a timestamp contained "555". The same secret check now runs on the logged fields, leaving out time, pid and hostname.
- Verify: `npm run build && npm start`, open http://localhost:3000. Focus trap and return in dialogs need a real browser (manual list in docs/DEMO_SCRIPT.md, S6).
- Known issues: layouts are wired to the router in S1.

S0 committed: 444b457. Check: 35 files, 412 tests, build ok.

## S1 Authentication, centers, accounts (budget 4 h)

Plan:
1. Packages: bcryptjs 3.0.3, jose 6.2.13 (server); zod 4.6.7 in shared (same version as the server).
2. Data: centers, users, parent_profiles; migration; seed 28 centers and the Admin.
3. env.ts: JWT_SECRET, COOKIE_SECURE, SESSION_HOURS, ADMIN_USERNAME, ADMIN_PASSWORD, BCRYPT_COST: dev and test defaults, production must set them.
4. Tests first: password, token, login rules, lockout, status messages, identical 429s, matrix, scoping, no hash in responses.
5. Core: authenticate, requireRole, scope, validate; Retry-After in the error handler.
6. Modules: auth, public centers, centers, teachers, parents. API mounts listed in one place so the matrix test fails on an unlisted route.
7. Client: useZodForm, session query, guards, 401 redirect with return path, forced change-password.
8. Screens: Login (Figma 241:1732), sign-up, Request sent, change password, Centers, Teachers, Parent requests, homes.
9. npm run check, commit.
10. CUT if late: parent disable and reset UI, Admin center rename UI.

S1 status (in progress, not committed):
- Done and passing: S1 API. DB tests auth, accounts and permission matrix: 3 files, 115 tests; unit tests env, token, scope: 3 files, 37 tests. They were seen failing (404) before the routers were mounted. Migration 20261106120950_auth_centers_users applied to the dev database; seed gives 28 centers and the Admin.
- Written, NOT yet run: S1 client (use-zod-form, guards, Login, Sign-up, Request sent, Change password, Centers, Teachers, Parent Requests, Home, router) and its tests. `tsc -b` result for them is unknown.
- Stopped: the run of `tsc -b` plus the client tests was stopped by the system because memory was critically low. Not a code failure.
- Next on resume: run `npx tsc -b`, then `npx vitest run --project client client/src/lib/use-zod-form client/src/features/auth`, then `npm run check`, then commit "feat(sprint): S1 auth, centers, accounts". Then S2.
