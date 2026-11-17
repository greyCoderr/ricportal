# UI Map

Every screen that exists now: screen ID, route, role, status (static, wired, polished) and spec link.

| Screen ID | Route | Role | Status | Spec |
| --- | --- | --- | --- | --- |
| P0-HEALTH | `/` | Anyone (placeholder until P0-T13) | wired | P0-T10: shows `GET /api/health` with loading, success (Server ok, Database up, checked at in Asia/Manila) and error (message plus Try again) states. Uses semantic token classes since P0-T11 (docs/tokens.md) |
| S-P1-02 Parent sign-up | `/signup` | Public | spec only (P1-T14) | [ui-specs/parent-screens.md](ui-specs/parent-screens.md). Designed by the Developer with Claude; no client Figma frame; client approval requested |
| S-P1-07 Request sent | after sign-up | Public | spec only (P1-T14) | [ui-specs/parent-screens.md](ui-specs/parent-screens.md). Designed by the Developer with Claude; no client Figma frame; client approval requested |
| S-P5-04 Parent day screen | from a day on My Schedule | Parent | spec only (P5-T15) | [ui-specs/parent-screens.md](ui-specs/parent-screens.md). Designed by the Developer with Claude; no client Figma frame; client approval requested |

## Demo sprint screens (S1 and S2)

| Screen | Route | Role | State | Notes |
| --- | --- | --- | --- | --- |
| Login | `/login` | Public | wired | Figma 241:1732 with the changes in DEC-034 |
| Parent sign-up, Request sent | `/signup`, `/request-sent` | Public | wired | docs/ui-specs/parent-screens.md |
| Change password | `/change-password` | Any | wired | Forced after a temporary password |
| Home | `/` | Any | wired | Welcome panel |
| Centers | `/centers` | Admin | wired | List, search, add, edit, active |
| RIC Teachers | `/teachers` | Admin | wired | Add with a temporary password shown once, edit, disable, reset |
| Parent Requests | `/parents` | Teacher | wired | Filter by status, approve, decline, disable, enable, reset |
| Enrolled Students | `/students` | Teacher | wired | Figma 78:260. Search, status filter, pagination, add, Export List dialog (D9) |
| Student profile | `/students/:id` | Teacher | wired | Tabs Profile, One-on-One Conferences, Home Visits. Progress is on Child's Record |
| Child's Record list | `/child-records` | Teacher | polished | Figma 169:3189, with record counts (D10) |
| Child's Record detail | `/child-records/:id` | Teacher | wired | Tabs Conferences, Home Visits, Progress (DEC-050) |
| Server status | `/status` | Public | wired | The former home placeholder (P0-T10) |
| Menu Imports | `/menu-imports` | Admin | wired | Upload, preview, warnings, overlap, confirm, history |
| Calendar | `/calendar` | Admin, Teacher | wired | FullCalendar: month on desktop, list on phones; day panel in a Drawer |
| Assignments | `/assignments` | Teacher | wired | Weekly board, Monday to Sunday; optimistic save with rollback |
| Calendar day panel | `/calendar` | Teacher | wired | Tabs Details, Assigned Parents, Purchase Request (editor with autosave) |
| Calendar, center selector | `/calendar` | Admin | wired | Read-only Purchase Request once a center is chosen |
| My Schedule | `/` | Parent | wired | Figma 393:1133, assigned days only; opens S-P5-04 in a Drawer |
| Liquidation Forms | `/calendar`, a button | Teacher | wired | Period picker, tabs Purchase Requests, Summary, Transmittal; Submit Report with blocking days |
| Reports, Report Status | `/reports` | Admin, Teacher | wired | Pills in the list |
| Report detail | `/reports/:id` | Admin, Teacher | wired | Stamp, snapshot table, PDFs, feedback; Admin Approve and Need Revision |

## Demo polish screens (F1)

| Screen ID | Route | Role | Status | Spec |
| --- | --- | --- | --- | --- |
| Shell | every page behind login | All | polished | [ui-specs/shell.md](ui-specs/shell.md) |
| S-P1-01 Login | `/login` | Public | polished | [ui-specs/shell.md](ui-specs/shell.md) |
| Profile | `/profile` | All | polished | [ui-specs/shell.md](ui-specs/shell.md) |
| Submit Report | `/submit-report` | Teacher | "Coming soon" (D10) | none |
| Admin Feedback | `/admin-feedback` | Teacher | placeholder until F5 | none |

## Demo polish screens (F2)

| Screen ID | Route | Role | Status | Spec |
| --- | --- | --- | --- | --- |
| S-P4-02 Feeding calendar with day panels | `/calendar` | Admin, Teacher | polished | [ui-specs/calendar.md](ui-specs/calendar.md) |
| Parent calendar with S-P5-04 in the panel | `/` | Parent | polished | [ui-specs/calendar.md](ui-specs/calendar.md) |
| Assign Parents modal (replaces S-P5-01) | from the calendar | Teacher | polished | [ui-specs/calendar.md](ui-specs/calendar.md) |

## Demo polish screens (F3)

| Screen ID | Route | Role | Status | Spec |
| --- | --- | --- | --- | --- |
| S-P2-01 Student list | `/students` | Teacher | polished | [ui-specs/student-form.md](ui-specs/student-form.md) |
| Add and Edit Student | `/students/new`, `/students/:id/edit` | Teacher | polished | [ui-specs/student-form.md](ui-specs/student-form.md) |
| S-P2-02 Student profile | `/students/:id` | Teacher | wired, shows the new fields | [ui-specs/student-form.md](ui-specs/student-form.md) |

## Demo polish screens (F4)

| Screen ID | Route | Role | Status | Spec |
| --- | --- | --- | --- | --- |
| S-P7-01 Admin Dashboard | `/` | Admin | polished | DEC-040 |
| S-P1-04 RIC Teachers | `/teachers` | Admin | polished | DEC-040 |
| S-P3-02 Reports queue | `/reports` | Admin | polished | DEC-040 |
| S-P1-05 Parent Requests | `/parents` | Teacher | D6 and D8 applied | DEC-040 |

## Demo polish screens (F5)

| Screen ID | Route | Role | Status | Spec |
| --- | --- | --- | --- | --- |
| Teacher Home | `/` | Teacher | polished | DEC-041 |
| Report Status | `/reports` | Teacher | polished | DEC-041 |
| Admin Feedback | `/admin-feedback` | Teacher | polished | DEC-041 |

## Polish Round 2 screens (G2)

| Screen | Route | Role | State | Notes |
| --- | --- | --- | --- | --- |
| Admin Dashboard | `/` | Admin | polished | Six cards (D6), fits the screen on a desktop (267:9689) |
| Calendar | `/calendar` | Admin | polished | Upload Menu/Food Rotation panel always visible (268:11404, D7) |
| RIC Teachers | `/teachers` | Admin | polished | View Profile and the status toggle (267:9862, D8) |
| RIC Teacher Profile | `/teachers/:id` | Admin | new | Developer-designed from 88:695. Edit, reset and the toggle live here (D8) |
| Profile | `/profile` | Every role | polished | All the fields of 88:695 with a data source (D9) |

## Polish Round 4 screens (I1, I2)

| Screen | Route | Role | State | Notes |
| --- | --- | --- | --- | --- |
| Admin Dashboard | `/` | Admin | polished | Five cards, Figma's Quick Actions, Recent Reports tabs, mini calendar (267:9689, D1 to D5); title in the top bar |
| Calendar | `/calendar` | Admin | polished | Title and center control in the top bar, per-month banner, accent Upload & Process (268:11404, D6); `?date=YYYY-MM-DD` opens a day |
| Enrolled Students (Admin) | `/admin/students` | Admin | new | Read-only; center select, search, # / Student Name / Date Enrolled / Age / Center (D4) |
| Child's Record (Admin) | `/admin/students/:id` | Admin | new | The Teacher's three tabs, read-only (D4) |
| RIC Teachers | `/teachers` | Admin | polished | Manage Centers button (D3) |
| Teacher Home | `/` | Teacher | polished | Rows and proportions of 175:1023 (read 2026-11-14, DEC-053): stat cards, Quick Actions, mini calendar, Report Tracking and Admin Feedback; then Recent Reports and Enrolled Students side by side with gray header bands (D7, D8) |
| Profile | `/profile` | Teacher | polished | Header card, stat cards, Recent Submitted Reports with pages, Recent Status Activity (88:695, D9); Admin and Parent unchanged |

## All screens now (Plan 5 J5, 2026-11-18)

One row per route in `client/src/app/router.tsx`. Figma ids are from docs/figma-inventory.md. State:
polished (compared with its frame and fixed, docs/FIDELITY_REPORT.md), wired (works, not compared),
Developer-designed (no client frame: client approval needed), placeholder. J2 (Plan 5) compared the
pages with frames at 1440 wide; the Admin pages at 390 wide are not checked yet.

| Route | Screen | Role | Figma frame | State |
| --- | --- | --- | --- | --- |
| `/login` | Login | Public | 241:1732; phone PARENT LOGIN 393:1102; Admin phone login 380:1149 not used (DEC-037) | polished (J2) |
| `/signup` | Parent sign-up | Public | none | Developer-designed |
| `/request-sent` | Request sent | Public | none | Developer-designed |
| `/change-password` | Change password | Any | none | wired |
| `/status` | Server status | Public | none | wired |
| `/` | Admin Dashboard | Admin | 267:9689 | polished (J2: dark green numbers) |
| `/` | Teacher Home | Teacher | 175:1023 | polished (Round 4, DEC-053) |
| `/` | My Schedule (Parent calendar) | Parent | 393:1133 | polished (J2: day panels on phones) |
| `/profile` | Profile | Admin | 267:9887; phone 378:16539 | wired; frames read in Plan 5 J2 step 4 |
| `/profile` | Profile | Teacher | 88:695 | polished (no change in J2) |
| `/profile` | Profile | Parent | none | Developer-designed |
| `/centers` | Centers | Admin | none | wired |
| `/teachers` | RIC Teachers | Admin | 267:9862; phone 378:16285 | polished (Round 2); J2 differences listed |
| `/teachers/:id` | RIC Teacher Profile | Admin | from 88:695 | Developer-designed |
| `/menu-imports` | Menu Imports | Admin | none (the upload panel on 268:11404) | wired |
| `/admin/students` | Enrolled Students (Admin) | Admin | none | Developer-designed, read-only |
| `/admin/students/:id` | Child's Record (Admin) | Admin | none | Developer-designed, read-only |
| `/calendar` | Calendar | Admin | 268:11404; phone 378:15722 | polished (J2: two-column day panels) |
| `/calendar` | Calendar | Teacher | 166:1553 | polished (J2) |
| `/reports` | Reports queue | Admin | 268:12661; phone 378:15917 | polished; type cards, tabs and filters wait for J3 (e) and Objective 3 |
| `/reports` | Report Status | Teacher | 78:284 | polished (J2: heading) |
| `/reports/:id` | Report detail | Admin, Teacher | none | wired |
| `/parents` | Parent Requests | Teacher | none | wired |
| `/students` | Enrolled Students | Teacher | 78:260 | polished (J2) |
| `/students/new`, `/students/:id/edit` | Add and Edit Student | Teacher | 258:5447 | polished (F3) |
| `/students/:id` | Student profile | Teacher | none | wired |
| `/child-records` | Child's Record list | Teacher | 169:3189 | polished |
| `/child-records/:id` | Child's Record detail | Teacher | 254:4572 (DEC-050) | wired |
| `/submit-report` | Submit Report | Teacher | 78:268 | placeholder "Coming soon" (Objective 3) |
| `/admin-feedback` | Admin Feedback | Teacher | 78:276 | polished |
| `*` | Not found | Any | none | wired |
