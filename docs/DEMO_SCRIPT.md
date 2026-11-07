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

### Admin: the new pages

1. Show the **Login** page with the client's photo and emblem. Log in as **admin**.
2. **DASHBOARD**: it fits one screen. The six cards: Registered RIC Teacher, Total Enrolled Students, Reports Submitted, Enrollment Reports Submitted, Accomplishment Reports Submitted, Reports for Revision. **Say this:** the Enrollment and Accomplishment cards stay 0 until Objective 3. Then Quick Actions (Centers and Menu Imports are here), Recent Reports and the calendar. **CALENDAR** shows the **Upload Menu/Food Rotation** panel at all times: choose a file, **Upload & Process**, check the preview, confirm. **View import history** opens Menu Imports.
3. **RIC TEACHERS**: the cards, search and filters. **Add New Teacher**: Full name "Liza Ramos", username `teacher.bahay`, center Bahay, password left blank. (Sibujo already has its Teacher. The next seed removes this account, so the step can be repeated.)
4. On that row, click the check button in the Action column. It goes dark and says Disabled, the Status badge turns red and the row is muted. Hover over it for the tooltip. Click it again, so the account is Active before the next section.
5. **PROFILE**: **Edit Profile** and **Change Password**.

### Default password reset

6. In **RIC TEACHERS**, on Liza Ramos, choose **View Profile**. **Edit** and the reset are here now. Choose **Reset to default password** and confirm. Only a confirmation shows, never a password.
7. Log out. Log in as `teacher.bahay` with the default **RICPortal2026!**. The **Change your password** page blocks everything else until a new one is chosen. Choose one, then log out.
8. The same works for a Teacher on a Parent: **PARENT REQUESTS**, Show Active, **Reset to default**. A Teacher can reset only Parents of their own center, and the Admin only Teachers.

### Objective 1: Student Registration and Management

9. Open **Sign up**. Create a Parent for Sibujo: username `rosa.demo`, mobile 09171234567, password Parent2026pw. Show **Request sent**. Try to log in as `rosa.demo`: the waiting-for-approval message shows.
10. Log in as **teacher.sibujo**. **HOME**: the real counts. **PARENT REQUESTS**: approve Rosa.
11. **ENROLLED STUDENTS**: 18 children. Search for "Dela". **Add Student**: the full form. Type a birthdate as MM/DD/YYYY and show the age preview; try 02/30/2020 and show the message; try a birthdate 6 years ago and show the warning. Fill a family row and save.
12. Open a child: tabs **Profile** (with the new fields), **One-on-One Conferences**, **Home Visits**. Add a conference note and a home visit.
13. Back on the list, **Enrollment Form**, **Open PDF**: 30 rows, numeric birthdates, the age summary, signature lines.

### Objective 2: the menu and the calendar

14. As **admin**, from the **DASHBOARD** open **Menu Imports**. The history shows the two batches from the seed. Upload `server/test/fixtures/SF_MENU_for_30_days.xlsx`: the preview shows 2 sheets of 42 days, and because these dates already have menus, it refuses with a clear message. (Replacing overlapping dates is cut. Importing into an empty database is covered by the automated demo path test.)
15. **CALENDAR**: September 2026 for the first day, Egg Caldereta, and December for the last, Sinigang na Baboy, on 9 December. Choose **Sibujo** in the center select, tap this week's locked day, and show the read-only Purchase Request below the calendar.

### Assign Parents modal

16. As **teacher.sibujo**, **CALENDAR**, **Assign Parents**. The arrows change the week.
17. **Step 1**: four dropdowns showing "Full name (username)". The seed's team of four is already chosen. A parent chosen in one dropdown is not offered in the others. Choose **Next**.
18. **Step 2**: one card per feeding day with the dish, a checkbox per team member and a count. Clear a day: "No parent assigned" and a warning appear. **Apply to all days** copies the first day to the rest. **SAVE** sends the whole week at once.
19. The **Assigned Parents** panel under the calendar shows the new names.
20. Tap a day that is open. In the **Purchase Request** panel use the pencil on a row and type a quantity and unit cost. Show Saving, then Saved, the Price, the Total and the budget line. **Add ingredient**.

### Parent flow

Use a second browser or a private window, so the Teacher stays logged in. **Check who is assigned first:** step 18 changes it. Log in again as a Parent named in the **Assigned Parents** panel for that day.

21. Log in as **parent1**. **CALENDAR** shows the whole center: a check mark on their own days, and the assigned parents' names on every day.
22. Tap a day that is not theirs: "You are not assigned to this day." The Purchase Request stays hidden.
23. Log in as a Parent assigned to the second feeding day of the week (**parent2** from the seed). **Add ingredient**. Use the pencil on the Teacher's row and change it. **Delete** shows only on rows this Parent added. There is no budget anywhere.
24. As the Teacher, **Lock day**. The Parent's screen shows the locked banner after a refresh, with no pencils and no Add ingredient.

### Liquidation and review

25. As the Teacher, **Liquidation Forms**. Open a Purchase Request PDF. The one-line month summary under the panels opens the **Summary** tab directly. Choose **Submit Report**: the dialog lists the days that are not ready. To submit in the demo, set From and To to the day you locked (or the seeded locked day), then **Submit Report**.
26. As **admin**, **REPORTS**: the status cards, the queue, **Filter Reports**. Open the report: the Submitted stamp and the snapshot. **Need Revision** with feedback.
27. As the Teacher, **ADMIN FEEDBACK**: the note, and **Revise Report**. **REPORT STATUS**: the steps and the feedback. On the Calendar the day is open again. Lock it, and submit the same period again: version 2.
28. As **admin**, **Approve**: the Approved stamp. The day can no longer be unlocked.
29. **SUBMIT REPORT** in the Teacher menu is a clear "Coming soon" page (Objective 3).

**API-only:** the Admin's students-by-center screen is cut. The API is covered by automated tests (`GET /api/students?centerId=`).

## Not built

Out of scope: report file uploads and report tracking for other report types (Objective 3), settings screens, notifications, CI, the `/__ui` gallery, deployment, email.

Cut or simplified: see docs/SPRINT_SHORTCUTS.md (Progress tab, Admin students-by-center screen, replacing overlapping menu dates, calendar week view, rate setting, Export List, and the Transmittal Checklist, which is a placeholder page until the official copy arrives).

## Visual checklist before the demo

Layout at every width from 360 to 1920 px, the calendar, the sidebar, the phone menu and the Assign Parents modal were checked in a real browser (Chromium) with the older demo data; see docs/POLISH_LOG.md. These remain for you:

- [ ] Run `npm run db:seed:demo` first. The local database holds practice data from the save-flow check.
- [ ] If `npm start` says port 3000 is in use, an earlier server is still running. Close it first, or restart the laptop.
- [ ] Rehearse the click path once yourself, then run the seed again. The save flows passed in the browser, including a report taken to Approved; see docs/POLISH_LOG.md.
- [ ] Show **REPORTS** on a screen at least 1366 px wide. Below that, the Admin's table scrolls inside its box to reach Actions.
- [ ] Log in on a real phone if you have one on the same network.
- [ ] Compare the login photo on the demo screen. It is exported small to stay under 300 KB and may look soft.
- [ ] **PDFs** next to the photos of the official forms.
