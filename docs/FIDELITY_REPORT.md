# Fidelity report (Plan 5, stage J2)

Each page against its Figma frame, by measurement. Started Tue 2026-11-17.

How it was measured:

- Figma: one design-context read and one screenshot per frame (docs/feedback/figma/, named by node
  id). Calls are counted in docs/components.md under "Plan 5 Figma calls".
- Ours: the built app on port 3100 in Chromium (Playwright), at 1440x900, and at 390x844 where a
  phone frame exists. A script reads the position, size, font and colors of each element.
- A desktop frame is 1280 or 1920 px wide, so its numbers are multiplied by our width divided by the
  frame's width before comparing. A phone frame is 375 px wide (factor 1.04 at 390).
- "Fixed" means changed in this stage and measured again. "Kept" means a documented decision says
  otherwise; the decision is named. "Client approval needed" marks screens with no frame.

Decisions that the comparison respects (not reported as differences): numeric dates MM/DD/YYYY, our
status words (BR-07), Username in place of Email, no "Forgot password?" and no terms box (DEC-034),
.xlsx-only upload, copyright year 2026, 44 px tap targets on touch screens (DEC-028), text colors
that pass WCAG AA (DEC-023), no unbuilt features (bell, two-factor, sessions).

## Summary

| Page | Role | Frame | Size compared | Differences found | Fixed |
| --- | --- | --- | --- | --- | --- |
| Login | All | 241:1732 | 1440x900 | 9 | yes |
| Login | All (phones) | 393:1102 | 390x844 | 10 | yes, 2 kept |
| Calendar | Parent | 393:1133 | 390x844 | 9 | 5 fixed, 4 kept |
| Sign-up, Request sent, day rows, Profile, Change password | Parent | none | | no frame | client approval needed |
| Calendar | Teacher | 166:1553 | 1440x900 | 10 | 3 fixed, 6 kept, 1 none needed |
| Enrolled Students | Teacher | 78:260 | 1440x900 | 10 | 5 fixed, 4 kept, 1 not verified |
| Add Student | Teacher | 258:5447 | 1440x900 | 6 | all kept (decisions) |
| Child's Record | Teacher | 169:3189 | 1440x900 | 3 | 2 kept, 1 for the Developer |
| Report Status | Teacher | 78:284 | 1440x900, empty state | 4 | 1 fixed, 2 kept, 1 not verified |
| Admin Feedback | Teacher | 78:276 | 1440x900, empty state | picture only | not changed (Objective 3) |
| Home | Teacher | 175:1023 | | measured 2026-11-14 (DEC-053) | not read again |

## Login, desktop: 241:1732 (1280 x 1020)

Frame numbers times 1.125 (1440 / 1280) against ours at 1440x900.

| Element | Figma (scaled) | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- |
| Emblem | 129 x 127 | 87 x 87 | 129 x 129 | yes |
| "RICPORTAL" | Bold 47 px, tracking 0.22em | 32 px | 47 px | yes |
| Two subtitle lines | SemiBold 27 px | 20 px | 27 px | yes |
| "Welcome Back" | SemiBold 54 px, x 30 | 37 px, x 25 | 54 px, x 25 | yes |
| "Please log in..." | SemiBold 20 px, #3C3C3C | 14 px | 20 px | yes |
| Field labels | SemiBold 22.5 px | Medium 12 px | SemiBold 22.4 px | yes |
| Fields | 539 x 56, 1 px black border | 443 x 56, gray border | 536 x 56, black border | yes |
| Placeholder | capitals, SemiBold 13 px, #BFBFBF | "Enter your username" 16 px; none for the password | "ENTER YOUR USERNAME", "ENTER YOUR PASSWORD", SemiBold 13 px | yes; color kept (#757575, DEC-023) |
| Log in button | 539 x 56, SemiBold 18 px, 1 px black border | 443 x 34, Medium 12 px | 536 x 56, SemiBold 18 px, black border | yes |
| "or" and Sign up | Regular 20 px; Sign up box 538 x 56, black border | 12 px; 443 x 34, gray border | 20 px; 536 x 56, black border | yes |
| Photo column | 42% of the width | 42% | 42% | no change needed |

Cause of most rows: the desktop density of Round 2 (the root font shrinks on a wide screen with a
mouse) also shrank the Login page, which has no sidebar and its own 1280 px frame. The Login sizes
are now the frame's numbers times one unit, `--login-u`, which is 1 px in a 1280 x 800 window, at
most 1.12 px (the same cap as the field height since Plan 3) and at least 0.75 px, and which follows
the window height too, so the page does not scroll at 1366x768 or 1280x720.

Not matched, on purpose: "Email Address" is "Username", there is no "Forgot password?" and no terms
box (DEC-034); the year is 2026; the vertical gaps are smaller than the frame's because those two
rows are absent.

## Login, phones: PARENT LOGIN 393:1102 (375 x 734)

Frame numbers times 1.04 against ours at 390x844.

| Element | Figma (scaled) | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- |
| Ground | dark red #570707 with a darker shape (#4F0303) | white with the desktop's red waves | #570707 with the frame's shape (asset `login-phone-art.svg`, 5 KB) | yes |
| Text color | white | black | white | yes |
| "RICPORTAL" | Bold 20 px, tracking 0.64em, red | 24 px, tracking 0.22em | Bold 20 px, 0.64em | yes |
| Two subtitle lines | SemiBold 14 px | 15 px | 14 px | yes |
| "Welcome Back" | SemiBold 24 px, red #D32F2F | black | SemiBold 24 px, light red #FF8282 | yes; color kept lighter (below) |
| "Please log in..." | SemiBold 10 px | 13 px | 11 px | yes; 11 px is our smallest text |
| Labels | SemiBold 14 px, white | Medium 15 px, black | SemiBold 14 px, white | yes |
| Fields and buttons, width | 277 px (266 of 375) | 358 px | 277 px | yes |
| Fields and buttons, height | 31 px | 44 px | 44 px | kept (DEC-028, tap target) |
| Sign up | clear box, white border and text | white box | clear box, white border and text | yes |
| "or" | black on the dark ground, white lines | black, black lines | white, white lines | yes (white: black cannot be read there) |

Kept on purpose: the title's red #D32F2F on #570707 has a contrast of 2.9:1, under the 3:1 a large
title needs; the lighter red of the selected menu item (#FF8282, 6.2:1) is used. "RICPORTAL" keeps
Figma's red because it is the logotype (same reasoning as the sidebar wordmark, DEC-037). Field
errors on the dark ground use the same light red, and the keyboard focus ring is white there.

## Parent calendar: PARENT CALENDAR 393:1133 (375 x 943)

Frame numbers times 1.04 against ours at 390 px wide, logged in as a Parent with one of their own
days selected. The Figma answer for this frame was positions and sizes only (too large for code).

| Element | Figma (scaled) | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- |
| "Today's Menu" tag | starts at the screen's left edge, 54 px high, #A40000 | 16 px in, 44 px high | at the edge (x 0), 52 px high | yes |
| Parents tag | ends at the screen's right edge, 50 px high | 16 px in, 44 px high | at the edge, 52 px high | yes |
| Parents tag text | "Parents assigned" | "Assigned Parents" | "Parents assigned" for the Parent; the Teacher keeps "Assigned Parents" (166:1553) | yes |
| Dish chip | 12 px text, 20 px high, hangs from the tag by two short lines | 15 px, 33 px high, no lines | 13 px, 26 px high, two lines | yes |
| Parents card | 158 px wide, hangs by two lines, right edge 16 px in | 240 px wide, no lines | as wide as its names (162 px here), two lines | yes |
| Order of the panels | menu, Purchase Request, total, parents | the same | the same | no change needed |
| Calendar rows | 44 px high, 8 px day numbers | 62 px, 13 px numbers | unchanged | kept: the other phone calendar frame (378:15722) draws 55 px rows and 13 px numbers, which ours follow |
| Month title | about 30 px, condensed extra bold | Montserrat ExtraBold 24 px | unchanged | kept: the app has one font (Montserrat), which is wider; 30 px does not fit "SEPTEMBER" with the arrows and the year at 360 px |
| Total | under the card, at its right | inside the card, at its right | unchanged | kept: our card also holds the add row and the status, so the total stays with the rows |
| Purchase Request title and headers | 12 px | 15 px title, 12 px headers | unchanged | kept: within 3 px; our smallest table text is 12 px |

Ours has, and the frame lacks (all decided earlier, not differences to fix): the black top bar with
the menu (from 378:15722, DEC-037), the page title with one line of help, a dot on feeding days and
the ring on the selected day (the frame shows no way to pick a day), the status pill, and the
"New ingredient" row (D3: Parents add rows).

## Parent screens without a Figma frame: client approval needed

The Parent page of the Figma file (393:1101) holds only PARENT LOGIN and PARENT CALENDAR. These
screens keep the Developer-designed specs and were not changed in this stage:

| Screen | Route | Spec |
| --- | --- | --- |
| Parent sign-up | `/signup` | docs/ui-specs/parent-screens.md (S-P1-02) |
| Request sent | `/request-sent` | docs/ui-specs/parent-screens.md (S-P1-07) |
| Editing rows on an assigned day | inside the Purchase Request card | docs/ui-specs/parent-screens.md (S-P5-04), D3 |
| Parent Profile, Edit Profile, Login History | `/profile` | DEC-049 (laid out like the Admin frame) |
| Change password | `/change-password` | Developer-designed from tokens |
| The Parent calendar on a desktop (sidebar, three panels in a row) | `/` | follows the Teacher frame 166:1553 |
| The phone menu drawer | every page | docs/ui-specs/shell.md (DEC-037) |

Sign-up, Request sent and Change password keep their white ground on phones; only Login has a
phone frame, so only Login got the dark red ground. The client should say whether those three
should follow it.

## About the desktop text sizes (applies to every Teacher and Admin page)

The desktop frames are 1920 px wide. At 1440 px the frame's numbers are multiplied by 0.736 (our
content area is 1200 px wide, the frame's is 1630). Our page titles, table text and buttons are
still smaller than that: a 36 px Figma title scaled is 27 px and ours is 20.5 px; 24 px table text
scaled is 18 px and ours is 12 to 13 px. This is the compact density of Round 2 (DEC-044, DEC-047,
docs/tokens.md), chosen so that dashboards and the calendar fit a 1366x768 screen without
scrolling. It is kept, and it is not repeated as a difference in the tables below. The Login page
is the exception (fixed above) because it has no sidebar and its own 1280 px frame.

## Teacher calendar: RIC calendar 166:1553 (1920 x 1080, drawn 3091 px tall)

Ours at 1440x900 as teacher.sibujo with 11/13/2026 selected. Figma x positions are mapped to ours
as 240 + (x - 290) x 0.736.

| Element | Figma (scaled) | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- |
| Purchase Request card | 561 px wide, in the middle (762 of 1630) | 806 px, the whole middle column | 585 px, centered | yes |
| Arrow tags | 52 to 61 px high | 36 px | 43 px (the same padding as on phones) | yes, partly: the compact density keeps them under the frame's height |
| A dated menu heading in the tag | one line | "Menu for 11/13/2026" broke into two lines | one line | yes (found while measuring; the frame only shows "Today’s Menu") |
| Panel order | parents left, Purchase Request, menu right | the same | the same | no change needed |
| Calendar width | 935 px, with 132 px free on each side | 1163 px, the full content width | unchanged | kept: our cells show the dish names (the frame's cells are empty), and they need the width for two lines |
| Month title | about 97 px tall | 55 px | unchanged | kept: Plan 3 D5, the whole month must fit one screen |
| "Assign Parents +" | a red box at the top right | a red button at the top right | unchanged | no change needed |
| Assign Parents panel | docked at the right, 420 px wide, over the calendar | a centered dialog with two steps | unchanged | kept: Plan 2 D4 (dialogs are centered in the content area) and Plan 1 D4 (Step 2) |
| Liquidation table and Submit under the panels | drawn on the page | a one-line summary that opens the Liquidation Forms overlay | unchanged | kept: Plan 1 D5 (DEC-038) |
| Total | under the card | inside the card | unchanged | kept: the card also holds the add row, the budget line and the lock buttons |

## Enrolled Students: 78:260 (1920 x 1754)

| Element | Figma (scaled) | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- |
| Add Student | dark green #025B02, white text | red | green (the `accent` button) | yes |
| Search box | 267 px wide with a magnifier at the left | 222 px, no icon | 271 px, magnifier | yes |
| Location line | a pin, then the place | no pin | pin, then the place and the active count | yes |
| Edit icon | green | black | green | yes |
| Archive icon | gray | black | gray | yes |
| Search placeholder | "Search student name or ID..." | "Search student name" | unchanged | kept: the search reads names only; searching by ID is not built |
| Dates | "March 21, 2026" | 06/08/2026 | unchanged | kept: numeric dates (D7, DEC-039) |
| Status filter above the table | none | a Status select | unchanged | kept: ours needs it to show archived children (BR-04) |
| Student names | plain text | links to the record | unchanged | kept: the link is how the record opens |
| Year cards under the table | "Student List for 2025" with View All | built in F3; not visible here because the local data has one school year | unchanged | NOT verified in the browser |

## Add Student: add enroll 258:5447 (1920 x 2291)

Compared at 1440x900, top of the form, by eye and by the section and label texts. The page was
built from this frame in F3 and nothing was changed now.

| Element | Figma | Ours | Fixed |
| --- | --- | --- | --- |
| Sections, numbering and labels (I. Identifying Information, 1 to 17) | as drawn | the same texts and order | no change needed |
| Barangay, Municipality, Province, Region | drop-down lists | text fields, three of them prefilled | kept: there is no list of places to choose from (DEC-039) |
| Required marks | on most fields | only on the fields the server requires | kept: the marks follow the validation rules |
| Date fields | YYYY-MM-DD | MM/DD/YYYY | kept: D7 |
| Family table | nine columns in one row | cards under 1536 px, a table from there | kept: the columns are 75 px wide at 1440 px (F6) |
| Weight, Height, Parent or guardian, Date enrolled | not in the frame | a row of four fields | kept: Annex A needs them (docs/ui-specs/student-form.md) |
| Title | none (only "Please fill out...") | "Add a student" above that line | kept: every page has a title for screen readers |

The second frame with this name, 254:4572 (the form with narrative and home visit parts), was not
read again: DEC-050 records that it is not a page we build.

## Child's Record: 169:3189 (1920 x 1202)

| Element | Figma (scaled) | Ours | Fixed |
| --- | --- | --- | --- |
| Cards | two columns, 456 px each, 110 px between them, uneven side margins (70 and 85 px) | two columns, 576 px each, 12 px between | not changed: the frame's margins are uneven, so ours keep the page's grid. For the Developer to decide |
| Card lines | name, Student ID, Age and Sex, "Grade: Kindergarten" | name, Student ID, Age and Sex, then the three record counts | kept: no grade is stored; the counts are D10 (DEC-050) |
| Active pill, "View record >" | as drawn | the same | no change needed |
| Search | none | a search box | kept: 18 or more cards need one |

## Report Status: 78:284 (1920 x 1257)

Compared in the EMPTY state only: the local database has no submitted report.

| Element | Figma | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- |
| List heading | "Recent Submitted Reports" | "All Reports List" (the Admin frame's words) | "Recent Submitted Reports" for the Teacher | yes |
| Search, Report Type and Year above the list | three controls | a Status filter in a side panel | unchanged | kept until Objective 3: there is one report type today |
| Selected Report Details at the right | a card with steps, feedback and two buttons | built in F5, shown when a row is chosen | unchanged | NOT verified: no row to choose |
| Recent Status Activity under the list | a timeline | on the Teacher Profile instead (Plan 4 D9) | unchanged | kept: DEC-052 |

## Admin Feedback (Teacher): RIC 4 78:276 (1920 x 1534)

The frame's content is one pasted picture (263:9488), so no sizes or colors can be read from it.
Compared by eye in the EMPTY state only. The picture shows four cards, a filter row, Feedback
Records, Selected Feedback Details, a Feedback Guide and Recent Feedback Activity, with report ids
and the statuses "Approved with Remarks" and "Resolved", which BR-07 does not have. Ours shows the
cards, the records and the selected details of F5 (DEC-041). Not changed: Objective 3 rebuilds this
page (docs/OBJ3_PLAN.md), and the picture needs the client's word on the two extra statuses.
NOT verified with real rows.

## Admin pages (page group 4, written 2026-11-18 from the measurements logged on 2026-11-17)

Frames read on 2026-11-17 (design context and screenshot in docs/feedback/figma/). The two fixes
below were measured in the browser before the change only; the "after" state has NOT been seen in a
browser (no browser on this laptop in the lean order): needs Developer visual check.

| Page, frame | Element | Figma | Ours before | Ours after | Fixed |
| --- | --- | --- | --- | --- | --- |
| Admin calendar 268:11404 | Day panels | none in the frame | Purchase Request squeezed into the 14rem column (172 px at 1440) | two columns when there is no parents panel | yes, unit test; needs Developer visual check |
| Admin calendar 268:11404 | Upload panel | beside the calendar from the top | the same (Plan 4 D6) | unchanged | kept |
| Admin Dashboard 267:9689 | Card numbers | dark green | body text color | `text-accent` | yes, unit test; needs Developer visual check |
| Admin Reports 268:12661 | Four type cards, five tabs, Month and Teacher filters, side filter panel | shown | three status cards; filter panel below the list at 1440 (Round 1) | unchanged | kept: types are Objective 3; filters are J3 (e) |
| RIC Teachers 267:9862 | Title size, Add New Teacher color, info note under the table | larger title, blue-green button, a note | smaller title, red button, no note | unchanged | NOT fixed yet (the frame is one flat image, measured in Round 3) |
| Teacher Profile 88:695 | Layout | header card, four report cards, Recent Submitted Reports, Recent Status Activity | the same | unchanged | matches |
| Admin Enrolled Students | no frame | | Developer-designed (Round 4 D4) | | client approval needed |

### Frames NOT read (2026-11-18)

Admin Profile 267:9887, Reports phone 378:15917, RIC Teachers phone 378:16285 and Profile phone
378:16539. The first call (`get_design_context` on 267:9887) gave no answer for 30 minutes and was
stopped by the tool; then free memory was 442 MB, under the Developer's 500 MB line, so no further
Figma call or code change was made. The Admin pages at 390 wide are not compared.

## Not read in this stage, and why

| Frame | Why |
| --- | --- |
| submit report 78:268 | The page is "Coming soon" until Objective 3 (D10) |
| Child's record 254:4572 | Not a page we build (DEC-050) |
| RIC dashboard 175:1023 (Teacher Home) | Read and measured three days ago, 2026-11-14, with numbers (DEC-053); the page has not changed since |
| Admin Login 272:16383, Admin phone login 380:1149 | DEC-037: every role uses Login 241:1732 and, on phones, PARENT LOGIN 393:1102 |
