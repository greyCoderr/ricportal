# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 4: DSWD Menu Import and Feeding Calendar

| Item | Value |
| --- | --- |
| Goal | The Admin uploads the DSWD Excel file; menus appear on a clean calendar for Admin and Teachers |
| Depends on | Phase 3 gate |
| Branch and tag | `phase-4-calendar`, tag `v0.4.0` |
| Rules | BR-08, BR-09, A-05 |

**Build:** the Excel parser, import preview and confirm, batches history, the calendar API, and a read-only calendar component with a day detail panel.

**Do NOT build:** Parent assignments, Purchase Requests, ingredients, budget, the Parent calendar, liquidation forms, any editing of menus on the calendar, drag and drop. Teachers cannot add custom activities.

**Figma screens to read:** Admin: Menu Imports (upload, preview, history); Calendar (month view, week or list view, day panel) for Admin and Teacher.

**Data:** `menu_batches`, `menu_days` (4.5).

**The real file layout (from SF_MENU_for_30_days.xlsx).**

| Item | What the file contains |
| --- | --- |
| Sheets | Two sheets, each one 42-day batch (Sheet1 17 Sep to 28 Oct 2026, PR SF-2026-003; Sheet2 29 Oct to 9 Dec 2026, PR SF-2026-004) |
| Title rows | A2 "SUPPLEMENTARY FEEDING PROGRAM"; A3 "HOTMEAL MENU for 30 days Consumption"; A4 period text "Date : SEPTEMBER 17 to OCTOBER 28, 2026" |
| PR cells | A5 "PR # SF - 2026-003" (spaces around the dash); D5 "PR DATE : 09/11/2026" (month/day/year) |
| Header row | Row 6: No. of Days, DATE, Days, MENU |
| Data rows | Rows 7 to 48. Column B is a real date cell, column C the weekday (inconsistent case, e.g. "SATURDAY" and "Friday"), column D the menu name (mostly capitals, some mixed case) |
| Duplicate block | Columns F to I repeat columns A to D for printing. **Ignore them** |
| Weekends | Saturdays are NUTRIBUN; Sundays are NUTRI COOKIE or NUTRI-BIZKIDS |
| Not in the file | Ingredients and quantities. The Teacher enters those later |

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /api/menu/imports/preview | Admin | Multipart xlsx. Parses and returns batches, warnings and a preview token (nothing saved; the file is held for 30 minutes) |
| POST /api/menu/imports/confirm | Admin | Body: token, replaceOverlap (boolean). Saves all batches in one transaction |
| GET /api/menu/batches | Admin | Import history |
| GET /api/calendar?from=&to= | Admin, Teacher | Feeding days in the range: date, dayNo, dayName, menuName, prNo |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P4-T01 | Copy the real file into `server/test/fixtures/` and create bad fixtures (no header, text instead of dates, duplicate dates, empty sheet, wrong file type) | server/test/fixtures | Fixtures committed |
| P4-T02 | Prisma models and migration for batches and days; unique `feeding_date` | schema.prisma | Migration applies |
| P4-T03 | Pure parser `parseMenuWorkbook(buffer)`: find the header row by locating "DATE" and "MENU", use only the left-most pair of columns, read PR No. with a regex and normalize "SF - 2026-003" to "SF-2026-003", read PR date as month/day/year, parse dates robustly (Date objects read with UTC getters, serials, and text), trim and collapse spaces in menu names, stop at the first empty date, skip sheets without a header with a warning | modules/menu/parser.ts | Parser tests: the real file yields 2 batches x 42 days, first day 2026-09-17 EGG CALDERETA, last day 2026-12-09 SINIGANG NA BABOY, PR dates 2026-09-11 and 2026-10-23 |
| P4-T04 | Validation layer: PR No. present, dates valid and unique, weekday text matches the date (warning), day numbers sequential (warning), gap between dates (warning), at most 100 days per sheet | modules/menu/validate.ts | Bad fixtures produce the expected errors and warnings |
| P4-T05 | Preview and confirm services: temp file with expiry token, overlap detection, transaction insert, replace logic for overlapping dates (allowed now; the guard against existing Purchase Requests is added in Phase 5) | modules/menu | Confirm twice is safe; expired token returns 410 |
| P4-T06 | Calendar service and endpoint with range validation (maximum 62 days) | modules/calendar | Month boundaries (31 Oct to 1 Nov) return the right days |
| P4-T07 | Display helper `formatMenuName` to Title Case with small words in lower case, keeping the original stored | client lib/format.ts | "PORK PICADILLO" displays as "Pork Picadillo" |
| P4-T08 | FeedingCalendar component (FullCalendar, read-only) using tokens: month, week and list views | features/calendar | Layout rules below pass |
| P4-T09 | Day detail panel: date, "DSWD Day n", menu name, PR No. and PR date | features/calendar | Opens on click and on keyboard Enter |
| P4-T10 | Admin Menu Imports page: upload zone, preview table (sheet, PR No., PR date, period, days, warnings), overlap warning with a "replace" checkbox, confirm, history | features/calendar | Preview shows the 2 sheets of the real file |
| P4-T11 | Calendar pages for Admin (with center-independent view) and Teacher; navigation entries | features/calendar | Both roles see the same menus |
| P4-T12 | Polish and gate | all | Gate checklist ticked |

**Calendar layout rules.**

- Default view is month on desktop and list-week on screens under 768 px. A view switcher offers Month, Week and List.
- Toolbar: previous, next, Today, month and year title, view switcher. The first day of the week is Sunday (configurable).
- Each feeding day shows one all-day chip with the formatted menu name, truncated with an ellipsis and the full name in a tooltip and in the day panel. No times are shown.
- Today has an accent border. Weekend cells have a very light tint. Days without a menu are plain.
- Read-only: no selection, no drag, no resize. Clicking a day or chip opens the day panel (a side drawer on desktop, a bottom sheet on phones).
- Loading shows a skeleton grid. An empty month shows "No menu uploaded for this month." A failed request shows an error panel with Retry. Month data is cached by month with TanStack Query, and navigation prefetches the next month.
- Keyboard: arrow keys move between days, Enter opens the panel. Colors come from tokens only.
- Dates travel as `YYYY-MM-DD` strings (BR-09).

**Edge cases to test:** run the date tests with `TZ=UTC` and `TZ=Asia/Manila`; a file with only one sheet; uploading the same file twice (overlap warning); a menu name with an ampersand or very long text ("SAUTEED MUNGBEAN WITH MALUNGGAY LEAVES & CHICKEN"); February and leap years; navigating across year end.

**Tests required:** parser against the real file and bad fixtures, validation warnings, overlap and replace, transaction rollback, calendar range, role access (Parent gets 403 for now).

**Gate additions:** import the real file on the production skeleton and compare 10 random dates with the Excel by eye.
