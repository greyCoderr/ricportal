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
