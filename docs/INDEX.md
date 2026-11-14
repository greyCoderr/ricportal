# RICPortal Documentation Index

Converted from `docs/source/RICPortal_AI_Blueprint.docx`. The .docx is the original; these Markdown files are the working copies.

## Blueprint

| File | Description |
| --- | --- |
| [blueprint/00-about.md](blueprint/00-about.md) | Cover details, contents, and Section 1: purpose, instruction priority, file layout, operating principles for Claude |
| [blueprint/01-context.md](blueprint/01-context.md) | Section 2: what RICPortal is, the three modules, features by role, out-of-scope list, paper-vs-agreement decisions |
| [blueprint/02-rules.md](blueprint/02-rules.md) | Section 3: task loop, Definition of Done, Phase Gate Checklist, scope lock, branches and commits, guardrails, downtime prevention |
| [blueprint/03-blueprint.md](blueprint/03-blueprint.md) | Section 4: permission matrix, glossary, stack, architecture, data model, business rules (BR-xx), assumptions (A-xx), API conventions, status machines, screen spec template, ERD and DFD specs |
| [blueprint/04-release.md](blueprint/04-release.md) | Section 6: Hostinger release runbook, environment variables, release steps, smoke test, rollback, monitoring |
| [blueprint/05-testing.md](blueprint/05-testing.md) | Section 7: test strategy, UAT scenarios, security checklist |
| [blueprint/06-documentation.md](blueprint/06-documentation.md) | Section 8: which docs Claude writes and when, entry formats, documentation rules |
| [blueprint/07-final-diagrams.md](blueprint/07-final-diagrams.md) | Section 9: inputs, steps and output files for the final ERD and DFD |

## Phases

Each phase file starts with the shared Section 5 intro and the "Order of work inside every phase" box.

| File | Description |
| --- | --- |
| [phases/phase-0.md](phases/phase-0.md) | Phase 0: Foundation and Deployment Skeleton |
| [phases/phase-1.md](phases/phase-1.md) | Phase 1: Authentication, Roles, Centers and Accounts |
| [phases/phase-2.md](phases/phase-2.md) | Phase 2: Student Registration and Child's Record |
| [phases/phase-3.md](phases/phase-3.md) | Phase 3: Report Submission and Tracking |
| [phases/phase-4.md](phases/phase-4.md) | Phase 4: DSWD Menu Import and Feeding Calendar |
| [phases/phase-5.md](phases/phase-5.md) | Phase 5: Parent Assignment and Purchase Requests |
| [phases/phase-6.md](phases/phase-6.md) | Phase 6: Liquidation Forms (PDF) and Submit Report |
| [phases/phase-7.md](phases/phase-7.md) | Phase 7: Administrator Dashboard and Monitoring |
| [phases/phase-8.md](phases/phase-8.md) | Phase 8: Hardening, QA, UAT, Release and Handover |

## Appendices

| File | Description |
| --- | --- |
| [seed-centers.md](seed-centers.md) | Appendix A: the 28 RIC Children Centers used by the seed |
| [figma-inventory.md](figma-inventory.md) | Appendix B: Figma screen inventory (to be filled in Phase 0) |

## Working docs

Started empty; later tasks append to them (see blueprint Section 8.1).

| File | Description |
| --- | --- |
| [PHASE_LOG.md](PHASE_LOG.md) | One line per task and gate: what was done, decisions, anything left |
| [DECISIONS.md](DECISIONS.md) | Decision records for choices made and conflicts resolved |
| [BACKLOG.md](BACKLOG.md) | Deferred ideas, who asked, and the phase they might belong to |
| [CHANGELOG.md](CHANGELOG.md) | Added, changed and fixed items per tagged version |
| [DEPLOY.md](DEPLOY.md) | Hostinger deployment steps that worked, errors met and fixes |
| [API.md](API.md) | Endpoints that exist now: method, path, role, request, response, errors |
| [DATA_MODEL.md](DATA_MODEL.md) | Current tables and columns with a Mermaid ERD |
| [UI_MAP.md](UI_MAP.md) | Screens that exist now: ID, route, role, status, spec link |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | Changes and new decisions for the business rules (BR-xx, blueprint section 4.6) and assumptions (A-xx, section 4.7) |

## Design

| File | Description |
| --- | --- |
| [tokens.md](tokens.md) | Design tokens: values, Figma node ids, source, contrast (client original and RICPortal adjusted) |
| [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md) | RICPortal design language: fills gaps Figma leaves open; the client's Figma always wins |
| [SPRINT_PLAN.md](SPRINT_PLAN.md) | The demo sprint plan |
| [SPRINT_LOG.md](SPRINT_LOG.md) | Progress of the demo sprint, stage by stage |
| [POLISH_PLAN.md](POLISH_PLAN.md) | The demo polish plan: Figma fidelity, Parent flow, fixes |
| [POLISH_LOG.md](POLISH_LOG.md) | Progress of the demo polish, stage by stage |
| [ui-specs/shell.md](ui-specs/shell.md) | App shell, Login, footer and Profile |
| [ui-specs/calendar.md](ui-specs/calendar.md) | Calendar, day panels and the Assign Parents modal |
| [ui-specs/student-form.md](ui-specs/student-form.md) | Student form field mapping, for client confirmation |
| [POLISH_PLAN_5.md](POLISH_PLAN_5.md) | Plan 5: finish Objective 2 (audit, fidelity, Parent pass, cut items, hardening, docs) |
| [AUDIT_REPORT.md](AUDIT_REPORT.md) | Code audit of Plan 5 J1: findings with evidence, severity and proposed fix |
| [OBJ3_PLAN.md](OBJ3_PLAN.md) | Plan for Objective 3 (report file uploads and review): scope, data, endpoints, tasks, estimate. No code yet |
| [SPRINT_SHORTCUTS.md](SPRINT_SHORTCUTS.md) | What was cut or simplified for the demo, and how to restore it |
| [DEMO_SCRIPT.md](DEMO_SCRIPT.md) | How to start the demo, the accounts and the click path |
| [components.md](components.md) | UI kit components: Figma calls, node ids read (one read per node), source of each component |
| [ui-specs/ui-kit.md](ui-specs/ui-kit.md) | Developer-designed UI kit parts (Stamp, LedgerTable), client approval requested |
| [DESIGN_GAPS.md](DESIGN_GAPS.md) | What to do when Annex A needs a screen, state or object the client's Figma lacks |
| [ui-specs/](ui-specs/) | Developer-designed screen specs for screens with no client Figma frame (client approval requested) |

## Other

| File | Description |
| --- | --- |
| [INDEX.md](INDEX.md) | This list of documents |
| [source/RICPortal_AI_Blueprint.docx](source/RICPortal_AI_Blueprint.docx) | The original Word blueprint these files were converted from |
| [diagrams/](diagrams/) | Empty for now; the final ERD and DFD go here in Phase 8 (Section 9.3) |
