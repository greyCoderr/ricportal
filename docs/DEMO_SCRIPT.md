# RICPortal demo script

Demo: Tue 2026-11-10, on localhost. Objectives 1 and 2. All data here is fake.

## Start

Run these one at a time. Close other heavy apps first: this laptop has run out of memory before.

1. Start MySQL in XAMPP.
2. On the morning of the demo: `npm run db:seed:demo`. It restores the demo state and unlocks the demo accounts. **Run it that morning:** it fills the week it is run in and the next one, and its locked day is the first feeding day of the week it is run in.
3. `npm run dev`, then open http://localhost:5173.

Or on one port: `npm run build`, then `npm start`, then open http://localhost:3000. Do not run tests or lint during the demo.

## Accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | admin | Admin2026! |
| RIC Teacher, Sibujo | teacher.sibujo | Demo2026! |
| Parents, Sibujo | parent1, parent2, parent3, parent4 | Demo2026! |

A new account or a reset password uses the default **RICPortal2026!**, and a change is forced at the next login. All fake, local only.

## What the seed sets up

- 18 children at Sibujo, and the menu from the DSWD file.
- This week and next week: a team of all four Parents, and two of them on each feeding day.
- The first feeding day of this week is locked. The second is partly filled, with rows by the Teacher and by **parent2**. The third has only the list.

## 15 minute click path

**Shell and Admin**

1. Show the **Login** page with the client's photo and emblem. Log in as **admin**.
2. **DASHBOARD**: the real counts, Quick Actions (Centers and Menu Imports are here), Recent Reports and the calendar.
3. **RIC TEACHERS**: the cards, search and filters. **Add New Teacher**: Full name "Liza Ramos", username `teacher.bahay`, center Bahay, password left blank. (Sibujo already has its Teacher. The next seed removes this account, so the step can be repeated.)
4. On that row: **Disable** shows the red Disabled badge, the muted row and **Enable**. **Reset to default** shows only a confirmation, never a password.
5. **PROFILE**: **Edit Profile** and **Change Password**.

**Objective 1: Student Registration and Management**

6. Log out. Open **Sign up**. Create a Parent for Sibujo: username `rosa.demo`, mobile 09171234567, password Parent2026pw. Show **Request sent**. Try to log in as `rosa.demo`: the waiting-for-approval message shows.
7. Log in as **teacher.sibujo**. **HOME**: the real counts. **PARENT REQUESTS**: approve Rosa.
8. **ENROLLED STUDENTS**: 18 children. Search for "Dela". **Add Student**: the full form. Type a birthdate as MM/DD/YYYY and show the age preview; try 02/30/2020 and show the message; try a birthdate 6 years ago and show the warning. Fill a family row and save.
9. Open a child: tabs **Profile** (with the new fields), **One-on-One Conferences**, **Home Visits**. Add a conference note and a home visit.
10. Back on the list, **Enrollment Form**, **Open PDF**: 30 rows, numeric birthdates, the age summary, signature lines.

**Objective 2: Feeding Program and Liquidation**

11. As **admin**, from the **DASHBOARD** open **Menu Imports**. The history shows the two batches from the seed. Upload `server/test/fixtures/SF_MENU_for_30_days.xlsx`: the preview shows 2 sheets of 42 days, and because these dates already have menus, it refuses with a clear message. (Replacing overlapping dates is cut. Importing into an empty database is covered by the automated demo path test.)
12. **CALENDAR**: September 2026 for the first day, Egg Caldereta, and December for the last, Sinigang na Baboy, on 9 December. Choose **Sibujo** in the center select, tap this week's locked day, and show the read-only Purchase Request below the calendar.
13. As **teacher.sibujo**, **CALENDAR**, **Assign Parents**: Step 1 shows the team of four. **Next**: one card per day with the dish, the checkboxes, the count and a warning when a day is empty. **Apply to all days**, then **SAVE**.
14. Tap a day that is open. In the **Purchase Request** panel use the pencil on a row and type a quantity and unit cost. Show Saving, then Saved, the Price, the Total and the budget line. **Add ingredient**.
15. Log in as **parent1** (a second browser or a private window helps). **CALENDAR** shows the whole center, with a check mark on their own days and the assigned parents' names on every day. Tap a day that is not theirs: "You are not assigned to this day."
16. Log in as **parent2**, tap the second feeding day of the week. Add a row, edit the Teacher's row, delete their own row: **Delete** shows only on rows they added. There is no budget anywhere.
17. As the Teacher, **Lock day**. The Parent's screen shows the locked banner after a refresh, with no pencils.
18. As the Teacher, **Liquidation Forms**. Open a Purchase Request PDF. The one-line month summary under the panels opens the **Summary** tab directly. Choose **Submit Report**: the dialog lists the days that are not ready. To submit in the demo, set From and To to the day you locked (or the seeded locked day), then **Submit Report**.
19. As **admin**, **REPORTS**: the status cards, the queue, **Filter Reports**. Open the report: the Submitted stamp and the snapshot. **Need Revision** with feedback.
20. As the Teacher, **ADMIN FEEDBACK**: the note, and **Revise Report**. **REPORT STATUS**: the steps and the feedback. On the Calendar the day is open again. Lock it, and submit the same period again: version 2.
21. As **admin**, **Approve**: the Approved stamp. The day can no longer be unlocked.
22. **SUBMIT REPORT** in the Teacher menu is a clear "Coming soon" page (Objective 3).

**API-only:** the Admin's students-by-center screen is cut. The API is covered by automated tests (`GET /api/students?centerId=`).

## Not built

Out of scope: report file uploads and report tracking for other report types (Objective 3), settings screens, notifications, CI, the `/__ui` gallery, deployment, email.

Cut or simplified: see docs/SPRINT_SHORTCUTS.md (Progress tab, Admin students-by-center screen, replacing overlapping menu dates, calendar week view, rate setting, Export List, and the Transmittal Checklist, which is a placeholder page until the official copy arrives).

## Check by hand before the demo

**No page of this polish has been opened in a real browser by the developer tooling.** The Playwright connection failed, so the plan's screenshots and width checks did not run. Automated checks cover the API, component logic and source patterns, not how the pages look. Please go through this list once, with the browser's device toolbar:

- [ ] Every page at 360, 390, 768, 1024, 1280, 1440 and 1920 px: no sideways page scroll, and the sidebar turns into the menu under 1024 px.
- [ ] Compare with Figma at 1440x900 and 390x844: Login 241:1732 and 393:1102; Teacher Home 175:1023; Enrolled Students 78:260; student form 258:5447; Calendar 166:1553; Parent calendar 393:1133; Admin Dashboard 267:9689; RIC Teachers 267:9862; Reports 268:12661; Report Status 78:284; Admin Feedback 78:276; Profile 88:695; footer 268:10479.
- [ ] Sidebar: scroll a long page. LOGOUT stays at the bottom of the window. On a short window the menu scrolls inside the sidebar.
- [ ] The calendar: the month title and arrows work; tapping a cell and a dish both select the day; today is filled; the selected day has a dark red ring; dish names are readable; dots show on a phone.
- [ ] The login photo at a large window: it is exported small to stay under 300 KB and may look soft. The waves image position.
- [ ] Student form: the family table at 1280 px is the tightest part.
- [ ] Dialogs: Tab stays inside, Escape closes, focus returns to the button that opened it. The phone menu closes on a backdrop tap.
- [ ] Drawer: right panel on desktop, bottom sheet on a narrow window.
- [ ] The PDFs next to the photos of the official forms.
- [ ] Two browsers on one day: Teacher and Parent editing the same row shows "Updated by someone else. Your change was not saved."
