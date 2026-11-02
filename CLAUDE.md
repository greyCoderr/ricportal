# RICPortal
Web system for the Rural Improvement Club (RIC) program of the Municipal Agriculture Office,
Libmanan, Camarines Sur. Roles: ADMIN (MAO), TEACHER (RIC Teacher), PARENT.
Modules: Student Registration, Document Submission and Tracking, Feeding Program and
Liquidation. No AI features. Scope authority: Agreement GD-2026-001, Annex A.
 
## Where to find things (read what the task needs, not everything)
- docs/INDEX.md                      list of all documents
- docs/blueprint/02-rules.md         working rules, definition of done, phase gate
- docs/blueprint/03-blueprint.md     roles, architecture, data, business rules (BR-xx), assumptions (A-xx), API
- docs/phases/phase-N.md             the current phase: Build, Do NOT build, tasks
- docs/PHASE_LOG.md                  what has been done
- docs/DECISIONS.md                  decisions and conflicts
- docs/BACKLOG.md                    deferred ideas
 
## Stack
TypeScript strict. client: React + Vite + Tailwind + React Router + TanStack Query + React
Hook Form + Zod + FullCalendar. server: Node + Express + Prisma + MySQL + Zod.
shared/: Zod schemas and enums used by both. One Node app serves /api and the built client.
 
## Commands
npm run dev          client and server
npm run check        typecheck + lint + test + build (must pass before every commit)
npm run test         run tests
npm run db:migrate   prisma migrate dev
npm run db:seed      admin, 28 centers, settings
 
## Architecture rules (never break)
- Backend layers: routes > controller > service > repository. Prisma only in repositories.
- No business logic in controllers or React components.
- Validate every request body with the shared Zod schema.
- Every route: authenticate + requireRole + center scope + a negative permission test.
- Money = Decimal, computed on the server. Calendar dates = "YYYY-MM-DD" strings.
- Responses: { data, meta } or { error: { code, message, details } }.
- Frontend: features/<module>/{api,hooks,components,pages}. No fetch inside components.
- Database changes only with Prisma migrations. Additive only. Never edit an applied migration.
 
## Working rules
- ONE task at a time. Build only what the task and its phase allow. Do not use later-phase code.
- Plan first (list files and questions), then wait for approval.
- Write tests with the code. Never delete or weaken a test to make it pass.
- If anything is unclear or two documents disagree: STOP and ask. Do not guess.
- No any, no console.log, no commented-out code. Ask before adding a dependency.
- Never read or edit .env, uploads, private/, or applied migrations.
- After each task: run npm run check, update docs (PHASE_LOG, API, DATA_MODEL, UI_MAP,
  DECISIONS as needed), then summarize files changed and how I can verify by hand.
 
## Current phase
Phase: 0   (update this line at the start of every phase)
