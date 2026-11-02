# 8. Documentation Outputs

Claude writes and maintains these files as part of the work. They are short, accurate and updated in the same commit as the code they describe. They are what a professional team keeps, and they feed the final turnover documents.

## 8.1 What Claude writes, and when

| File | Updated when | Content |
| --- | --- | --- |
| `docs/PHASE_LOG.md` | After every task and at every gate | One line per task: ID, date, what was done, decisions, anything left. A gate entry lists the checklist result and the tag |
| `docs/DECISIONS.md` | Whenever a choice is made or a conflict is resolved | Decision records: context, options, decision, consequence |
| `docs/API.md` | After every endpoint | Method and path, role, request fields, response, error codes |
| `docs/DATA_MODEL.md` | After every migration | Tables and columns that exist now, with a Mermaid `erDiagram` block of the current schema |
| `docs/BUSINESS_RULES.md` | When a rule changes | The register from 4.6 and 4.7 |
| `docs/UI_MAP.md` | After every screen | Screen ID, route, role, status (static, wired, polished), spec link |
| `docs/BACKLOG.md` | Whenever something is deferred | Item, who asked, reason, phase it might belong to |
| `docs/CHANGELOG.md` | At every gate | Added, changed, fixed per tagged version |
| `docs/DEPLOY.md` | After every deployment step | Exact steps that worked on Hostinger, errors met and fixes |
| `README.md` | Phase 0 and when setup changes | What it is, requirements, install, run, test, build, deploy |
| `docs/USER_GUIDE.md` | Phase 8 | How each role uses the system, step by step |
| `docs/TECHNICAL.md` | Phase 8 | Setup, folder structure, tables, libraries and licenses, per Agreement Section 5 |

## 8.2 Entry formats

```text
PHASE_LOG.md   | P2-T04 | 2026-11-09 | Students service and repository done. Duplicate rule returns 409. | Left: none |

DECISIONS.md   ## DEC-007: Age buckets
               Context: Enrollment form lists ages 2, 3, 4. Decision: others counted in "Other" (A-04).
               Consequence: summary function returns an extra row.

API.md         ### POST /api/students   (TEACHER)
               Body: lastName, firstName, middleName?, gender, birthdate, weightKg, heightCm, parentGuardianName
               201 { data: Student } | 400 VALIDATION_ERROR | 403 FORBIDDEN | 409 CONFLICT (duplicate)

UI_MAP.md      | S-P2-01 | Student list | /students | TEACHER | polished | spec: UI_MAP#S-P2-01 |
```

## 8.3 Rules for documentation

- Document what the code does now, not what is planned. Remove stale text in the same commit.
- Never put secrets, real names or real personal data in any document.
- Keep each file small and scannable. Use tables for endpoints and fields.
- When a document and the code disagree, fix the document or the code the same day and note it in DECISIONS.md.
