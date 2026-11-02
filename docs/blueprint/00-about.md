**GENARD DEV**

**RICPortal**

**AI Blueprint**

The complete build specification for Claude: scope, rules, data model, API, phases, tasks, tests and documentation outputs.

| Item | Detail |
| --- | --- |
| Audience | Claude (Claude Code). Not a step-by-step guide for the human developer |
| Project | RICPortal: A Web-Based Platform for Rural Improvement Club in Libmanan, Camarines Sur |
| Authority | Agreement No. GD-2026-001, Annex A (Approved Scope). This blueprint refines it; it never expands it |
| Stack | TypeScript, React (Vite), Node.js with Express, Prisma, MySQL. One Node app on Hostinger |
| Paper | The clients' Chapters 1 to 3 were reviewed. Their ERD and DFD are not authoritative; see Sections 2.5, 4.11, 4.12 and 9 |
| Version | 1.0, November 2026 |

> **How Claude uses this document**
>
> Read Section 1 first. Work one task at a time using Sections 3 to 5. Keep the documentation outputs in Section 8 up to date. Ask the Developer when anything is unclear or in conflict.

**Contents**

**1. About This Document and How Claude Must Use It**

**2. Project Context and Scope**

**3. Working Rules**

**4. System Blueprint (Single Source of Truth)**

**5. Build Phases**

Phase 0: Foundation and Deployment Skeleton

Phase 1: Authentication, Roles, Centers and Accounts

Phase 2: Student Registration and Child's Record

Phase 3: Report Submission and Tracking

Phase 4: DSWD Menu Import and Feeding Calendar

Phase 5: Parent Assignment and Purchase Requests

Phase 6: Liquidation Forms (PDF) and Submit Report

Phase 7: Administrator Dashboard and Monitoring

Phase 8: Hardening, QA, UAT, Release and Handover

**6. Release Runbook (Hostinger Node.js)**

**7. Testing, UAT and Security**

**8. Documentation Outputs**

**9. Final ERD and DFD (Phase 8)**

**Appendix A: Seed Centers (28 RIC Children Centers from the MAO list)**

**Appendix B: Figma Screen Inventory (fill this in Phase 0)**

# 1. About This Document and How Claude Must Use It

## 1.1 Purpose

This is the **AI Blueprint** for building RICPortal. It is written for Claude (Claude Code). It contains everything Claude needs to build the system correctly: scope, roles, business rules, data model, API conventions, screens, phases, tasks, tests and documentation outputs. The Developer (Genard) has a separate Developer Guide with the human steps; Claude does not need it.

## 1.2 Instruction priority (when sources disagree)

| Priority | Source | Use it for |
| --- | --- | --- |
| 1 | Software Development Agreement No. GD-2026-001, Annex A (Approved Scope) | What is in and out of scope |
| 2 | This blueprint (Sections 2 to 9) | Rules, data, API, phases, tasks |
| 3 | The Figma prototype (through the Figma connector) | Look, layout, flow, field labels |
| 4 | The clients' paper (Chapters 1 to 3) | Background only. **Its ERD and DFD are not authoritative** (see 2.5 and Section 9) |
| 5 | Photos of official forms and the DSWD Excel file | Exact layouts of PDFs and the importer |

If two sources conflict, **stop and ask the Developer**, then record the answer in `docs/DECISIONS.md`. Never silently pick one.

## 1.3 How this document is stored for Claude

The Developer splits this document into Markdown files under `docs/`. Claude reads only what the current task needs.

| File | Content |
| --- | --- |
| `docs/blueprint/01-context.md` | Section 2 |
| `docs/blueprint/02-rules.md` | Section 3 |
| `docs/blueprint/03-blueprint.md` | Section 4 (roles, stack, architecture, data, business rules, assumptions, API, status machines, screen spec, ERD and DFD specification) |
| `docs/phases/phase-0.md` to `phase-8.md` | One file per phase from Section 5 |
| `docs/blueprint/04-release.md` | Section 6 |
| `docs/blueprint/05-testing.md` | Section 7 |
| `docs/blueprint/06-documentation.md` | Section 8 |
| `docs/blueprint/07-final-diagrams.md` | Section 9 |
| `docs/seed-centers.md` and `docs/figma-inventory.md` | The appendices |

## 1.4 Operating principles for Claude

1. Work on **one task at a time**, exactly as written in the task table. Do not start the next task until the current one passes its Done-when.
2. Build **only** what the current phase's Build list allows. Anything on the Do NOT build list, or not in Annex A, is out of scope: refuse it politely and add it to `docs/BACKLOG.md`.
3. Plan before coding. List the files you will touch and the questions you have. Wait for approval.
4. Write tests with the code. Never delete, skip or weaken a test to get green.
5. Use the shared Zod schemas, the layering rules (4.4) and the standard response shapes (4.8) everywhere.
6. When something is unclear or conflicts with these documents, **stop and ask**. Do not guess and do not invent requirements.
7. After every task: run `npm run check`, update the documentation outputs in Section 8, and summarize the files changed with manual steps to verify.
8. Never touch secrets, `.env`, real personal data or applied migrations.
9. Prefer simple, readable code over clever code. The Developer must be able to explain it at a thesis defense.
