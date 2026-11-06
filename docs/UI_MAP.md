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
| Enrolled Students | `/students` | Teacher | wired | Figma 78:260. Search, status filter, pagination, add, Enrollment Form dialog |
| Student profile | `/students/:id` | Teacher | wired | Tabs Profile, One-on-One Conferences, Home Visits. Progress tab cut |
| Server status | `/status` | Public | wired | The former home placeholder (P0-T10) |
