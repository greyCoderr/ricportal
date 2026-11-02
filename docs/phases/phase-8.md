# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 8: Hardening, QA, UAT, Release and Handover

| Item | Value |
| --- | --- |
| Goal | A stable release you can hand to the clients with confidence |
| Depends on | Phase 7 gate |
| Branch and tag | `release-1.0`, tag `v1.0.0` |

**Build:** nothing new. Only fixes, tests, documentation and release work. From now on only bug fixes are allowed.

| ID | Task | Done when |
| --- | --- | --- |
| P8-T01 | Full regression: `npm run check` on a fresh clone, then the whole permission matrix | All green |
| P8-T02 | Playwright end-to-end tests for three flows: (1) Admin creates a Teacher, Teacher logs in and changes the password; (2) Parent signs up, Teacher approves, Parent logs in; (3) feeding flow from import to Submit Report and approval | The three flows pass in CI |
| P8-T03 | Security review and the checklist in Section 7.3; dependency audit; secrets scan; confirm no personal data in logs | Findings fixed or logged |
| P8-T04 | Authorization sweep: print every route with its guards and compare it to the permission matrix | No route without a guard |
| P8-T05 | Performance pass: indexes confirmed with EXPLAIN on list queries; bundle size check; PDF generation time | List endpoints under 300 ms on seed data; PDFs under 3 seconds |
| P8-T06 | Accessibility and mobile pass on a real phone: contrast, focus order, labels, tap targets, 360 px layouts | No blocking issues |
| P8-T07 | Backup and restore drill: export the database, restore into a scratch database, run the app against it | Restore verified once |
| P8-T08 | Production release following the runbook in Section 6; seed the Admin, 28 centers and settings; smoke test | Smoke test passes on the live URL |
| P8-T09 | UAT with the Section 7.2 scenarios, ideally with one real RIC Teacher and the MAO contact; record issues | All blocking issues fixed |
| P8-T10 | Documentation and final diagrams: user guide for the three roles, technical documentation per Agreement Section 5 (setup, folder structure, tables, libraries), API reference, and the **final ERD and DFD generated from the real code and Section 9 of this blueprint** (never copied from the paper) | Documents and diagrams in docs/ and docs/diagrams/ |
| P8-T11 | Turnover session script and defense preparation using an explain-back summary for each module; list of likely panel questions | Clients can run the demo without you |
| P8-T12 | Tag `v1.0.0`, archive the repository, hand over source code and credentials according to the agreement (after final payment) | Acceptance recorded |
