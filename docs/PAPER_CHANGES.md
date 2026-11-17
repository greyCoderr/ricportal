# Changes the clients must make in their paper

What the clients' paper (Chapters 1 to 3) says that no longer matches the agreement or the system
built. Written in Plan 5 J5 (2026-11-18) from docs/blueprint/01-context.md section 2.5 (D-01 to D-15)
and the decisions taken since. The final ERD and DFD are drawn in Phase 8; the clients should replace
theirs with those, not edit theirs by hand.

| # | Where in the paper | The paper says | Change it to | Source |
| --- | --- | --- | --- | --- |
| PC-01 | Objectives | 1 Student, 2 Feeding and Liquidation, 3 Document tracking | Align with Annex A (1 Student, 2 Document tracking, 3 Feeding), or ask the Developer to align Annex A | D-01 |
| PC-02 | Chapter 2, report statuses | On Process, Need Revision, Submitted | Submitted, Need Revision, Approved | D-02, BR-07 |
| PC-03 | How reports are made | Teachers create Accomplishment and Enrollment reports in the system | Teachers upload them as files; the Enrollment Form is also generated as a PDF | D-03, A-15 |
| PC-04 | Level 0 DFD, Child's Record | The Admin receives child records | The Admin views them read-only | D-04, A-16 |
| PC-05 | ERD and login | Email and password for Teacher and Admin; Parent has no password | Everyone logs in with a username and password; no email is sent; the approver resets passwords to a default that must be changed at next login | D-05, BR-05 |
| PC-06 | ERD, Barangays | Teachers assigned to a barangay | The unit is the RIC Children Center (28 centers); a center records its barangay | D-06 |
| PC-07 | ERD, calendar | One calendar entity with menu, ingredients, price, quantity and activity | Separate menu days, Parent assignments, Purchase Requests and purchase items (use the Phase 8 ERD) | D-07 |
| PC-08 | Calendar activities | Teachers update calendar information | Teachers assign Parents and manage Purchase Requests; they add no custom activities | D-08 |
| PC-09 | Parent view | The Parent views the scheduled menu | The Parent sees the whole center calendar and the Purchase Request of their assigned days, where they add and edit rows | D-09, D2, D3 |
| PC-10 | Table 3.1, languages | HTML, CSS, JavaScript, PHP | TypeScript, React, Node.js, Express, MySQL (MariaDB locally, TiDB Cloud in production) | D-10, DEC-005 |
| PC-11 | Methodology | The text says RAD; Figure 3.1 shows Agile | Make the text and the figure agree | D-11 |
| PC-12 | Leftover wording | "applications", "application forms", "online application of RIC teachers" | Remove; there is no application feature | D-12 |
| PC-13 | DFD process 4.1 | "Check Today's Event" | The calendar and the Teacher home's mini calendar mark today; describe it that way | D-13, A-18 |
| PC-14 | DFD, report review | Separate reportStatus and reportFeedback entities | One status on the report plus review records with feedback | D-14 |
| PC-15 | ERD, liquidation | No liquidation structure | Purchase Requests, items, report snapshots and a LIQUIDATION report type | D-15 |
| PC-16 | Feeding program description | Teachers assign Parents | Weekly teams of up to 4 Parents per center; each day gets 0 to 4 of them | D4 |
| PC-17 | Screens and forms | Long dates | Dates appear as MM/DD/YYYY | D7 |
| PC-18 | Features list | (absent) | Add: profile pages for every role, Child's Record page with conferences, home visits and progress, Export List, login lockout | docs/ANNEX_A_CHANGES.md |
