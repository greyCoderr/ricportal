# Parent screens (Developer-designed)

Status: **Designed by the Developer with Claude; no client Figma frame; client approval requested.**

Process: docs/DESIGN_GAPS.md. Style: docs/DESIGN_LANGUAGE.md and docs/tokens.md (existing tokens only).
Reference images, if present in docs/ui-specs/images/, are only references. When an image and this text disagree, the text wins.

The Parent home is the My Schedule calendar (client Figma PARENT CALENDAR 393:1133, read in Phase 5), not a screen in this file (DEC-024). In Phase 1 the Parent home is a placeholder: "Welcome, {name}. Your schedule will appear here once your teacher assigns you."

---

## S-P1-02 Parent sign-up

| Part | Spec |
| --- | --- |
| Screen | S-P1-02 Parent sign-up |
| Role and route | Public, `/signup`. Phase 1 (P1-T14) |
| Purpose | A parent asks for an account at one RIC Children Center. The account starts PENDING until that center's RIC Teacher approves it (A-07) |
| Data shown | Active centers for the select: public centers endpoint (P1-T10) |
| Fields, in order | 1 Full name. 2 Username. 3 Mobile number. 4 RIC Children Center: searchable select of active centers. 5 Child's name (optional). 6 Password, with show/hide. 7 Confirm password, with show/hide |
| Actions | Button "Create account": POST /api/auth/parent-signup. Success: go to S-P1-07 with the chosen center's name. Failure: field errors under each field from the server's `details`; other errors in an error message above the button. Link "Already have an account? Log in" goes to the login page |
| Helper text | "Your RIC Teacher must approve your account before you can log in." |
| Validation | From the shared Zod schema (created in P1-T10). Username: 4 to 30 characters, lowercase letters, digits, dot, underscore. Mobile: 09XXXXXXXXX or +639XXXXXXXXX. Password: at least 8 characters with a letter and a number. Confirm password must match. Messages appear under each field, on blur and on submit |
| States | Busy: "Create account" is disabled and shows a busy state while the request runs. Centers loading: the select shows loading. Centers failed: message with Retry. Server error: message above the button, values kept |
| Permissions | Public. The server creates a PENDING Parent for an active center only (P1-T10) |
| Responsive | One column at every width. Under 768 px the form fills the width with a 16 px gutter |
| Accessibility | A visible label on every field; errors linked to their field; the show/hide control is a button with an accessible name; keyboard order follows the field order; focus moves to the first field with an error on submit |
| Acceptance | Each validation rule shows its message under the right field; a duplicate username shows a field error; an inactive center cannot be chosen; success lands on S-P1-07 with the center name |

Text wireframe:

```
[RIC emblem and header, only with client approval]
Create your parent account
Your RIC Teacher must approve your account before you can log in.
Full name            [____________________]
Username             [____________________]
Mobile number        [____________________]
RIC Children Center  [Search a center   v]
Child's name (optional) [_________________]
Password             [______________] (Show)
Confirm password     [______________] (Show)
[ Create account ]
Already have an account? Log in
```

---

## S-P1-07 Request sent

| Part | Spec |
| --- | --- |
| Screen | S-P1-07 Request sent |
| Role and route | Public, shown after a successful sign-up. Phase 1 (P1-T14) |
| Content | Clock icon. Heading "Request sent". Text "Your request was sent to the RIC Teacher of {center}. You can log in after your teacher approves it." Button "Back to login" |
| Data shown | The center name returned from sign-up |
| States | Opened without a sign-up result (for example a reload): show the login page instead |
| Accessibility | The heading receives focus when the screen opens; the icon is decorative (hidden from screen readers) |

### Login messages for Parents (on the Login screen)

| Situation | Message |
| --- | --- |
| Wrong username or password (always) | "Invalid username or password" |
| Correct credentials, account PENDING | "Your account is waiting for approval by your RIC Teacher." |
| Correct credentials, account DECLINED | "Your request was declined. Please contact your RIC Teacher." |
| Correct credentials, account DISABLED | "Your account is disabled. Please contact your RIC Teacher." |
| Account locked (BR-19: 5 failures lock 15 minutes), any password, right or wrong | "Too many attempts. Try again in 15 minutes." (429 with a `Retry-After` header in seconds; the status messages above are not shown) |
| Login rate limit reached, including for an unknown username | "Too many attempts. Try again in 15 minutes." (the same 429 response, so a username's existence is never revealed) |

The PENDING, DECLINED and DISABLED messages appear only after correct credentials and only when the account is not locked (BR-19, DEC-026).

---

## S-P5-04 Parent day screen

| Part | Spec |
| --- | --- |
| Screen | S-P5-04 Parent day screen |
| Role and route | Parent, opened from a day on My Schedule. Bottom sheet under 768 px, side panel on desktop. Phase 5 (P5-T15) |
| Purpose | An assigned Parent enters what was bought for one feeding day |
| Header | Weekday and date; menu name; status chip Open or Locked |
| Section "Ingredients to buy" | One card per row the Teacher created: ingredient name, save state (Saving, Saved, Failed with Retry), and four columns: Unit (select of the shared `UNITS` constant from `shared/src`: kg, g, pcs, bottle, pack, can, liter, bundle, tray, other; no API call), Qty, Unit cost, Total (computed by the server, BR-11) |
| Footer | Subtotal |
| Data shown | GET /api/purchase-requests/:date (items, totals, status). The Parent response does not contain `budget`, `enrolledCount` or `ratePerChild`: the server leaves them out, so they are never in the browser (DEC-026) |
| Actions | Edit Unit, Qty or Unit cost: PATCH /api/purchase-items/:id with `version`, 600 ms after the last keystroke or on blur (P5 auto-save rules). Parents cannot add, delete or rename rows (BR-12) |
| Messages | Conflict (409): "Updated by someone else. Your change was not saved." |
| States | Loading: skeleton. Empty: "Your teacher has not listed the ingredients yet. Check back later." Locked: banner "This day is locked by your teacher. You can view it but not change it." and read-only fields. Offline or network failure: the value is kept and the row shows Failed with Retry |
| Money | PHP with two decimals, written PHP 1,234.00 (DESIGN_LANGUAGE rule 1) |
| Permissions | Only an assigned Parent of the same center (BR-12, BR-14). Unassigned days are not shown |
| Responsive | Under 768 px: bottom sheet, one card per row, touch targets at least 44 px, numbers at 16 px or larger (DESIGN_LANGUAGE rule 5) |
| Accessibility | Each cell has a label that names the ingredient (for example "Qty for Rice"); the save state is announced politely; Retry is a button |
| Acceptance | Totals and subtotal match the server; a locked day cannot be edited; a forced conflict shows the conflict message; a reload shows saved values |

Text wireframe (phone):

```
Tuesday, 10 March 2026            [Open]
Chicken tinola with rice
Ingredients to buy
+--------------------------------------+
| Rice                        Saved  v |
| Unit [kg  v]  Qty [5.00]             |
| Unit cost [PHP 52.00]  Total PHP 260.00 |
+--------------------------------------+
| ...                                  |
Subtotal                     PHP 1,234.00
```

---

## Resolved questions (DEC-026, 2026-11-04)

1. Budget: the Parent response of GET /api/purchase-requests/:date leaves out `budget`, `enrolledCount` and `ratePerChild`. A Phase 5 test checks that a Parent response never has them and a Teacher response does.
2. Locked account: every attempt on a locked account gets the same 429 and "Too many attempts. Try again in 15 minutes.", right or wrong password; the login rate limiter gives the same response for unknown usernames.
3. Units: the shared `UNITS` constant (created in Phase 5); no API call.
4. Screen ids: S-P1-02 stays the Parent sign-up id (no S-P1-06). S-P5-02 Purchase Request editor is Teacher only; the Parent uses S-P5-04.

## Change notes (details added by Claude, kept by the Developer for review)

- Text wireframes for S-P1-02 and S-P5-04 (the sample date and dish are examples only).
- S-P1-07 opened without a sign-up result (for example after a reload) shows the login page instead.
- Focus handling: on a failed submit, focus moves to the first field with an error; the S-P1-07 heading receives focus when it opens.
- S-P1-02: errors are linked to their field; show/hide is a button with an accessible name; messages appear on blur and on submit.
- S-P5-04: each cell has a label naming the ingredient, for example "Qty for Rice"; the save state is announced politely; Retry is a button.
