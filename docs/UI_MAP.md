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
