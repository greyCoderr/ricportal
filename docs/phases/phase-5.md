# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 5: Parent Assignment and Purchase Requests

| Item | Value |
| --- | --- |
| Goal | Teachers assign Parents weekly and list ingredients; Teachers and assigned Parents enter quantity, unit and cost; totals and budget are exact |
| Depends on | Phase 4 gate |
| Branch and tag | `phase-5-purchase`, tag `v0.5.0` |
| Rules | BR-10 to BR-15, BR-08 guard, BR-14, A-03, A-05, A-06, A-14 |

**Build:** a "Today's Feeding" card on the Teacher and Parent home pages (today's menu and status), weekly assignment board, Parent calendar (assigned days only), Purchase Request per feeding day, ingredient rows, auto-save with conflict handling, lock, unlock and no-feeding, budget display, per-child rate setting, Admin read-only view by center, the replace-import guard.

**Do NOT build:** PDF forms, Submit Report, liquidation snapshots, dashboard numbers, receipt or photo uploads, "copy last week", recipes or an ingredient database, notifications.

**Figma screens to read:** Teacher: Weekly Assignment board, Calendar day panel with tabs (Details, Assigned Parents, Purchase Request); Parent: My Schedule calendar and day panel; Admin: calendar with center selector; Admin: Settings (rate).

**Data:** `feeding_assignments`, `purchase_requests`, `purchase_items`; settings key `perChildDailyRate`. Add the foreign key from `purchase_requests` to `menu_days`.

| Method and path | Role | Purpose |
| --- | --- | --- |
| GET /api/parents/approved | Teacher | Approved Parents of own center for pickers |
| GET /api/assignments?week=YYYY-MM-DD | Teacher | Seven days with menu, assigned Parents, PR status |
| PUT /api/assignments/:date | Teacher | Body: parentIds. Replaces the set for that day |
| GET /api/calendar?from=&to= | Admin, Teacher, Parent | Parents receive only assigned days (BR-14). Admin passes centerId |
| GET /api/purchase-requests/:date | Teacher, assigned Parent, Admin (read) | PR with items, totals, budget, status |
| POST /api/purchase-requests/:date/open | Teacher | Creates the PR for that day (idempotent) |
| POST /api/purchase-requests/:date/items | Teacher | Add an ingredient row (description) |
| PATCH /api/purchase-items/:id | Teacher, assigned Parent | Body includes version. Field rights per BR-12 |
| DELETE /api/purchase-items/:id | Teacher | Only while OPEN |
| POST /api/purchase-requests/:date/lock, /unlock, /no-feeding | Teacher | State changes per 4.9 |
| GET, PATCH /api/settings/rate | Admin | Per-child daily rate |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P5-T01 | Shared schemas and constants: unit list (kg, g, pcs, bottle, pack, can, liter, bundle, tray, other), PR status, item input | shared/src | Used by both sides |
| P5-T02 | Prisma models and migration; unique (center_id, feeding_date) and (center_id, feeding_date, parent_id); FK to menu_days | schema.prisma | Migration applies |
| P5-T03 | Money helpers on Decimal: line total, subtotal, rounding half-up to 2 decimals, formatting for display | core/money.ts | Tests: 2 x 38.00 = 76.00; 0.5 x 340.00 = 170.00; 0.25 x 80.00 = 20.00; subtotal 266.00; 0.333 x 10.00 = 3.33 |
| P5-T04 | Budget service: ACTIVE student count for the center and current school year times the rate; snapshot fields on lock | modules/purchase-requests | Tests: 18 students x 25.00 = 450.00; archived students excluded |
| P5-T05 | Assignments service: weekly query, replace set for a day; only feeding days, only APPROVED Parents of the same center | modules/assignments | Assigning a Parent of another center or a non-feeding date is rejected |
| P5-T06 | Calendar service update: Parent sees only assigned days; Admin passes centerId; Teacher scoped to own center | modules/calendar | Parent of center A cannot see unassigned days |
| P5-T07 | Purchase Request service: open (lazy, idempotent), get with computed totals, lock, unlock, no-feeding with BR-12 and BR-15 | modules/purchase-requests | State machine table test passes |
| P5-T08 | Items service: add, edit with field-level rights by role, delete; `version` optimistic concurrency returning 409 with the latest row | modules/purchase-requests | A stale version returns CONFLICT; Parent cannot add, delete or edit description |
| P5-T09 | Settings: rate endpoint (Admin) with validation 0 to 1000 and two decimals | modules/settings | Changing the rate affects OPEN days but not LOCKED days |
| P5-T10 | Replace-import guard (BR-08): refuse replacing dates that already have a Purchase Request | modules/menu | Test covers refusal with a clear message listing dates |
| P5-T11 | Permission matrix entries and scoping tests for every new route | server/test | Matrix test green |
| P5-T12 | Frontend Weekly Assignment board (layout below) | features/assignments | Assign and remove update instantly and persist |
| P5-T13 | Frontend calendar day panel for Teachers with tabs: Details, Assigned Parents, Purchase Request | features/calendar | Tabs match Figma |
| P5-T14 | Frontend Purchase Request editor (layout below) with debounced auto-save, per-row status, conflict handling | features/purchase-requests | Reload shows saved values; conflict message appears when forced |
| P5-T15 | Frontend Parent: My Schedule calendar showing only assigned days, day panel with the ingredient list and the editable cells for unit, quantity and cost | features/purchase-requests | Parent cannot edit when the day is LOCKED |
| P5-T16 | Frontend Admin: center selector on the calendar and a read-only Purchase Request view; Admin Settings field for the rate | features/calendar, features/settings | Admin changes nothing on Purchase Requests |
| P5-T17 | Frontend "Today's Feeding" card on the Teacher and Parent home pages: today's menu, assigned status and a link to the day panel; empty state "No feeding scheduled today" | features/calendar, app/layouts | Shows the right menu for today (Asia/Manila) and nothing for unassigned Parents |
| P5-T18 | Polish and gate | all | Gate checklist ticked |

**Weekly Assignment board layout.** A week selector (previous, next, "This week", date range text) sits at the top. Seven day cards (Monday to Sunday) follow. Each card shows the date, the formatted menu name (or "No menu" and disabled if the date has no menu), assigned Parent chips with a remove (x) button, an "Assign parents" button that opens a searchable multi-select of approved Parents, and a small status badge (No PR, Open, Locked, No feeding). Changes save immediately with an optimistic update and a toast; a failure rolls back and shows the error. On phones the cards stack vertically.

**Purchase Request editor layout.** Header: date, menu name, PR No., status badge. Table columns exactly like the official form: Item No., Unit, Item Description, Qty, Unit Cost, Total Cost. Below it: Sub-total, then the budget line "Budget PHP 450.00 = 18 children x PHP 25.00" with a progress bar that turns amber when the sub-total exceeds the budget (warning only). Buttons: Add ingredient, Lock day, No feeding, Unlock. Each row shows a small state (Saving, Saved, Failed with Retry). Numeric cells use a numeric keyboard on phones. Under 768 px each row becomes a card with labelled fields.

**Auto-save rules.** Save a row 600 ms after the last keystroke or on blur. One request in flight per row; a newer edit waits. The `version` is sent and updated from each response. On 409 the row refreshes with the latest data and shows "Updated by someone else. Your change was not saved." On network failure the row keeps the value, shows Failed and retries on click or when the connection returns. Leaving the page with unsaved rows shows a warning.

**Edge cases to test:** two editors on one row; a Parent removed from the day while editing; locking while a Parent's request is in flight; rate changed while a day is OPEN; zero students (budget 0); extremely long descriptions; decimal quantity 0.125; unit cost left empty (total shows a dash and does not count); copy-paste of values with commas; a week that crosses a month end.

**Tests required:** money vectors, budget, state machine, field-level rights per role, conflict, scoping, assignment rules, Parent calendar filter, replace-import guard.

**Gate additions:** a two-browser concurrency check done by hand (Teacher and Parent editing the same day).
