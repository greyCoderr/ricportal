---
name: ricportal-module
description: Use when creating a new backend module or feature folder in RICPortal
---
Create a module the same way every time.
 
Backend: server/src/modules/<name>/ with these files:
- <name>.routes.ts       HTTP only. Guards on every route: authenticate, requireRole, validate(schema).
- <name>.controller.ts   Parse request, call the service, shape the response. No business logic.
- <name>.service.ts      Business rules, transactions, center scope (use scopeToCenter).
- <name>.repository.ts   Prisma queries only. Prisma is imported nowhere else.
- <name>.schemas.ts      Re-export the shared Zod schemas from shared/src.
- <name>.test.ts         Unit tests for rules and integration tests for every endpoint.
Frontend: client/src/features/<name>/{api.ts, hooks.ts, components/, pages/}.
Rules: a module imports another module's service, never its repository. Use the standard
response and error shapes. Update docs/API.md and docs/DATA_MODEL.md in the same commit.
