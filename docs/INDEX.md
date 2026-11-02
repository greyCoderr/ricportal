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

## Other

| File | Description |
| --- | --- |
| [INDEX.md](INDEX.md) | This list of documents |
| [source/RICPortal_AI_Blueprint.docx](source/RICPortal_AI_Blueprint.docx) | The original Word blueprint these files were converted from |
| [diagrams/](diagrams/) | Empty for now; the final ERD and DFD go here in Phase 8 (Section 9.3) |
