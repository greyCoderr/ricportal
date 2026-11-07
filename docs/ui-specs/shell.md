# App shell, Login, footer and Profile

Source frames: Login 241:1732 (desktop), PARENT LOGIN 393:1102 (phones), Teacher sidebar 166:910 and
profile 88:695, ADMIN 267:9689, Profile mobile 378:16539, footer 268:10479. Decisions: DEC-037.

## Sidebar (from 1024 px)

- `aside`: 290 wide, `nav` fill, sticky, top 0, height 100 dvh, flex column. The menu scrolls inside it
  (`min-h-0 flex-1 overflow-y-auto`). Logout row: `mt-auto shrink-0`, with a rule above it.
- Teacher and Parent header: emblem 54, "RICPortal" 20, then "Rural Improvement Club" and
  "Libmanan, Camarines Sur" 12, with a red rule below. Selected item: `nav-selected`, 8 px red strip at
  left, black text and black icon (DEC-023).
- Admin header: centered emblem 124, "RICPortal" 24, the same two lines, white rule below. Selected
  item: `primary` fill with white text.
- Items 53 high, radius `card`, icon 24, tracking 0.1em.

## Labels (D10, exact, in order)

- Admin: DASHBOARD, CALENDAR, REPORTS, RIC TEACHERS, PROFILE, LOGOUT
- Teacher: HOME, ENROLLED STUDENTS, CALENDAR, SUBMIT REPORT, REPORT STATUS, ADMIN FEEDBACK, PARENT REQUESTS, PROFILE, LOGOUT
- Parent: CALENDAR, PROFILE, LOGOUT

## Top bar

`header` fill and `shadow-header`, 94 high from 1024 px (111:959), 64 below. Avatar 70 with an `accent`
ring, name Medium 20, role line Light 12. Under 1024 px (378:15722): black band with the menu button
(44), emblem, "RICPortal", one small organization line, and the avatar.

## Mobile menu (no Figma frame for the drawer)

Under 1024 px the sidebar content opens in a left drawer (native dialog, 290 wide, at most 85% of the
width, full height). Escape, a backdrop tap or choosing an item closes it.

## Footer

- Teacher and Parent: black footer (268:10479) with brand and tagline; DSWD, seal and MAO logos with the
  council lines; Quick links from the role's menu; Location; Contact. Columns stack under 768 px.
- Admin: one copyright line, as the Admin frames show.
- The page column has `min-h-dvh` and the footer is last with `mt-auto`.

## Login

Desktop: left column with the waves image, emblem 113, "RICPORTAL" (Bold 42, tracking 0.22em), the two
lines (SemiBold 24), "Welcome Back" (48), "Please log in to continue to your account" (18), fields, red
Log in, "or", Sign up, copyright. Right 42%: photo with the `overlay` token. Phones (393:1102): emblem
and titles centered, waves behind, no photo.

## Profile

Title by role ("RIC Teacher Profile" as in 88:695; "Profile" for the Admin as in 378:16539; "Parent
Profile" has no frame). Avatar 166 (120 on phones), name Bold 20, active badge, a details block
(Username, Role, RIC Children Center, Mobile number), Edit Profile and Change Password buttons (labels
from 378:16539), each opening a Modal.
