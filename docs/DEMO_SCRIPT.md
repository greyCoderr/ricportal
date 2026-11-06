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
| Parent, Sibujo | parent1, parent2, parent3 | Demo2026! |

## 10 minute click path

**Objective 1: Student Registration and Management**

1. Log in as **admin**. Open **RIC Teachers**, then **Add RIC Teacher**: Full name "Liza Ramos", username `teacher.bahay`, center Bahay. Show the temporary password shown once. (Sibujo already has its Teacher from the seed. The next seed removes this account, so the step can be repeated.)
2. Log out. Open **Sign up**. Create a Parent for Sibujo: username `rosa.demo`, mobile 09171234567, password Parent2026pw. Show **Request sent**. Try to log in as `rosa.demo`: the waiting-for-approval message shows.
3. Log in as **teacher.sibujo**. Open **Parent Requests**, approve Rosa.
4. Open **Enrolled Students**: 18 children of Sibujo. Search for "Dela". **Add Student**: type a birthdate and show the age preview; try a birthdate 6 years ago and show the warning. Save.
5. Open a child: tabs **Profile**, **One-on-One Conferences**, **Home Visits**. Add a conference note and a home visit.
6. Back on the list, **Enrollment Form**, **Open PDF**: 30 rows, the age summary, signature lines.

**Objective 2: Feeding Program and Liquidation**

7. As **admin**, open **Menu Imports**. The history shows the two batches from the seed. Upload `server/test/fixtures/SF_MENU_for_30_days.xlsx`: the preview shows 2 sheets of 42 days, and because these dates already have menus, it refuses with a clear message. (Replacing overlapping dates is cut. Importing into an empty database is covered by the automated demo path test.)
8. Open **Calendar**: go to September 2026 for the first day, Egg Caldereta, and December for the last, Sinigang na Baboy, on 9 December. Open a day to see its details. Choose **Sibujo** in the center select, open this week's locked day, and show the read-only Purchase Request.
9. As **teacher.sibujo**, open **Assignments**: this week's cards with Parents and status. Assign a Parent to a day.
10. Open **Calendar**, then a day that shows Open. In **Purchase Request**, add an ingredient, and type a quantity and unit cost. Show Saving, then Saved, the total, the sub-total and the budget line.
11. Log in as **parent1** (a second browser or a private window helps). **My Schedule** shows only assigned days. Open one and enter unit, quantity and unit cost. The total and subtotal update. There is no budget anywhere.
12. As the Teacher, **Lock day**. The Parent's screen shows the locked banner after a refresh, and cells are read-only.
13. As the Teacher, on **Calendar** choose **Liquidation Forms**. Open a Purchase Request PDF and the Summary PDF. Choose **Submit Report**: the dialog lists the days that are not ready. To submit in the demo, set From and To to the day you locked (or the seeded locked day), then **Submit Report**.
14. As **admin**, open **Reports**, then the report: the Submitted stamp and the snapshot. **Need Revision** with feedback.
15. As the Teacher, open **Report Status**, the report: the feedback shows. On the Calendar the day is open again. Lock it, and submit the same period again: version 2.
16. As **admin**, **Approve**: the Approved stamp. The day can no longer be unlocked.

**API-only:** the Admin's students-by-center screen is cut. The API is covered by automated tests (`GET /api/students?centerId=`).

## Not built

Out of the sprint scope: report file uploads and report tracking screens (Objective 3), Admin dashboard, settings screens, CI, the `/__ui` gallery, deployment, email.

Cut or simplified: see docs/SPRINT_SHORTCUTS.md (Progress tab, previous school year view, Admin students-by-center screen, replacing overlapping menu dates, calendar week view, rate setting, Today's Feeding card, Admin queue filters, and the Transmittal Checklist, which is a placeholder page until the official copy arrives).

## Check by hand before the demo

Nothing has been opened in a real browser by the developer tooling: automated checks cover the API and component logic. Please try these once:

- [ ] Dialogs: Tab stays inside, Escape closes, focus returns to the button that opened it.
- [ ] Drawer: right panel on desktop, bottom sheet on a narrow window.
- [ ] FullCalendar: month on desktop, list on a narrow window; the dish names are readable; a click and Enter on a dish open the panel; today has a red top rule.
- [ ] The Teacher's Purchase Request editor fits and is usable in the wide Drawer.
- [ ] The Login page at phone width (360 px).
- [ ] The PDFs next to the photos of the official forms.
- [ ] Two browsers on one day: Teacher and Parent editing the same row shows "Updated by someone else. Your change was not saved."
