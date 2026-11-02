# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 7: Administrator Dashboard and Monitoring

| Item | Value |
| --- | --- |
| Goal | The Admin sees the number of RIC Teachers, total enrolled students and the status of submitted reports |
| Depends on | Phase 6 gate |
| Branch and tag | `phase-7-dashboard`, tag `v0.7.0` |
| Rules | BR-02, BR-21 |

**Build:** summary cards, a by-center table, and links into existing views.

**Do NOT build:** new charts libraries, exports, notifications, anything not listed in Annex A section E.

**Figma screens to read:** Admin Dashboard and the center detail view.

| Method and path | Role | Purpose |
| --- | --- | --- |
| GET /api/dashboard/summary | Admin | totalCenters, activeTeachers, totalEnrolledStudents (current school year, ACTIVE), reportsByStatus, awaitingReview |
| GET /api/dashboard/centers | Admin | Per center: name, Teacher, enrolled students, latest report status this month |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P7-T01 | Dashboard service using grouped queries (no N+1) | modules/dashboard | Counts equal hand-checked SQL on seed data |
| P7-T02 | Routes, guards, matrix entries | dashboard routes | Teacher and Parent get 403 |
| P7-T03 | Frontend cards: RIC Teachers (shows the 28 target), Total enrolled students, Reports awaiting review | features/dashboard | Matches Figma |
| P7-T04 | By-center table with search and sort; clicking a row opens the center detail (students read-only, reports, calendar view) using existing screens | features/dashboard | Links work for all 28 centers |
| P7-T05 | Polish and gate | all | Gate checklist ticked |

**Details.** Disabled Teachers are not counted. Archived students and previous school years are not counted. A center without a Teacher shows "No teacher assigned". Empty and loading states use the shared components.

**Tests required:** counts with archived and disabled records, school year boundary, scoping, query count check (no per-center queries).
