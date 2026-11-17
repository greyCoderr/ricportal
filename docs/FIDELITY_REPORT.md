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
