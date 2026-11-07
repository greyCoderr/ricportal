# Calendar, day panels and Assign Parents

Source frames: RIC calendar 166:1553, PARENT CALENDAR 393:1133, Calendar mobile 378:15722, January
calendar 378:15461, tag 393:1759, pink card 393:1816. Decisions: DEC-037, DEC-038.

## Month

- Title row: `‹`, the month in capitals (ExtraBold, 48 on desktop, 24 on phones), `›`, and the year at
  the right. Green (`accent`) for Teacher and Admin, red (`primary`) for a Parent.
- Weekday bar: Sun, Mon, Tues, Wed, Thurs, Fri, Sat on `calendar-bar` (Parent: `nav-selected`), bold.
- Cells: 1 px black rules, the number at the top left, days of other months in `text-muted`. Today is
  filled with the bar color. The selected day has a 3 px `tag` ring and a bold number.
- A month grid at every width, as both phone frames show. Under 768 px a dot marks a feeding day and
  the whole cell is the tap target (55 px high); the dish shows in the panels.
- Figma sets the calendar in Roboto Condensed, which is not installed; Montserrat is used (DEC-038).

## Panels of the chosen day (start: today)

Order on desktop: Assigned Parents, Purchase Request, Today's Menu. Stacked under 1024 px in the
Parent frame's order: Today's Menu, Purchase Request, Parents.

- Today's Menu: right-pointing `tag` arrow, white Bold 13, with the dish below on a `tag-tint` label.
  On another day the tag reads "Menu for MM/DD/YYYY".
- Assigned Parents: left-pointing `tag` arrow, with a numbered list on a `tag-tint` card. A Teacher also
  gets the Assign Parents button here. The Admin has no list (the assignment API is Teacher only).
- Purchase Request: white card titled "Purchase Request". Table columns exactly: Item No., Unit, Item
  Description, Qty, Price (the line total), a pencil on each row, and "Total:" with a boxed amount.
  The pencil opens the row's fields below it: description, unit, qty, unit cost, with auto-save, Delete
  when allowed, and Done. Add ingredient sits under the table.

## Who sees what

| Viewer | Calendar | Parents panel | Purchase Request panel |
| --- | --- | --- | --- |
| Teacher | Menus | Names, Assign Parents | Edit any row; Lock, Unlock, No feeding; budget line |
| Admin | Menus | Not shown | Read-only once a center is chosen |
| Parent, assigned day | Whole center; own days have a check mark | Names | Add, edit any row, delete own rows, while open |
| Parent, other day | Same | Names | "You are not assigned to this day." |

## Summary (D5)

Under the panels, for a Teacher: "This month: N feeding days, total PHP x." with the link "View Summary
of Disbursement", which opens the Liquidation Forms overlay on its Summary tab. The table lives there.

## Assign Parents modal

Header as Figma: "Assign Parents", "Assign parents to cook foods.", then `‹` Week N `›` with the date
range under it. Buttons CANCEL and SAVE as Figma. The red fill is kept for SAVE because DEC-028 has no
green button.

- Step 1: four numbered dropdowns of approved parents, shown as "Full name (username)". A parent chosen
  in one dropdown is not offered in the others. Next goes to Step 2.
- Step 2 (Developer-designed from D4, no Figma frame; client approval requested): one card per feeding
  day with the weekday, numeric date and dish; a checkbox per team member; a count ("1 of 2 parents");
  "No parent assigned" on an empty day; a warning Banner counting empty days; "Apply to all days" copies
  the first feeding day to the rest; Back; SAVE sends the whole week.
- A parent removed from the team in Step 1 drops off every day when saved.
- A server refusal stays on screen and the choices are kept.
