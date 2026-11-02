# 7. Testing, UAT and Security

## 7.1 Test strategy

| Level | Tool | What it covers | When it runs |
| --- | --- | --- | --- |
| Unit | Vitest | Pure rules: age, money, parser, status machines, permission helpers | Every task |
| Integration | Vitest and Supertest with a separate test database | Every endpoint: success, validation, wrong role, wrong center, unauthenticated, state conflicts | Every task and in CI |
| Component | Vitest and Testing Library | Forms and tables: validation messages, loading, empty and error states | When a screen is wired |
| End to end | Playwright | Three critical flows (Phase 8) | Phase 8 and in CI |
| Manual UAT | The scenarios below | Whole system as each role | Phase 8, on the live system |

Rules: never delete or weaken a test to pass; every bug fix adds a test that failed before the fix; use fake data only (BR-21); run date tests with `TZ=UTC` and `TZ=Asia/Manila`.

## 7.2 UAT scenarios (run in order on the live system)

| ID | Role | Steps | Expected |
| --- | --- | --- | --- |
| S1 | Admin | Log in, open Centers, create a Teacher for one center | Teacher is listed; temporary password shown once |
| S2 | Teacher | Log in, change the temporary password | Forced change works; the menu appears |
| S3 | Parent | Sign up, choose the center, try to log in | "Waiting for approval" message |
| S4 | Teacher | Approve the Parent | Parent can log in |
| S5 | Teacher | Add 5 students, open one profile, add a conference note and a home visit | Records saved; newest first |
| S6 | Teacher | Generate the Enrollment Form PDF | Matches the official form; summary counts correct |
| S7 | Teacher | Upload an Accomplishment Report PDF | Status Submitted |
| S8 | Admin | Review the report: Need Revision with feedback | Teacher sees feedback |
| S9 | Teacher | Upload a revision | Status Submitted again |
| S10 | Admin | Approve it | Status Approved; no further changes allowed |
| S11 | Admin | Upload the DSWD Excel file, preview, confirm | 2 batches; calendar shows menus from 17 Sep to 9 Dec 2026 |
| S12 | Teacher | Assign Parents to a week | Parent sees only those days |
| S13 | Teacher | Open a Purchase Request, add 4 ingredients | Rows saved; totals correct |
| S14 | Parent | Enter unit, quantity and cost for the assigned day | Totals and budget update; cannot add or delete rows |
| S15 | Teacher | Lock the day; Parent tries to edit | Edit blocked |
| S16 | Teacher | Open Liquidation Forms; download the three PDFs | Layouts match the official copies; totals agree |
| S17 | Teacher | Submit Report with one day still OPEN | Blocked, with the day listed |
| S18 | Teacher | Lock all days and Submit Report | Report submitted; days read-only |
| S19 | Admin | Review the liquidation: Need Revision, then after resubmission Approve | Days unlock on Need Revision; final lock on Approve |
| S20 | Admin | Open the Dashboard | Teacher count, student count and report status are correct |

## 7.3 Security checklist (Phase 8)

☐  Every route has authenticate, role guard, scope and Zod validation.

☐  Cookies are httpOnly, SameSite Lax and Secure in production; logout clears them.

☐  Login throttling and lockout verified.

☐  Passwords hashed, never logged; temporary passwords shown once only.

☐  Uploads checked by extension and magic bytes, stored outside the web root, served only through authorized endpoints.

☐  No SQL built by string concatenation; no raw HTML rendered from user input.

☐  Error messages do not reveal whether a username or a row exists in another center.

☐  No personal data or secrets in logs, in the repository or in test fixtures.

☐  Dependencies audited and pinned; unused packages removed.

☐  Production `.env` is stored only on the host; backups are protected.
