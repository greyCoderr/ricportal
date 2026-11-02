# 2. Project Context and Scope

## 2.1 What RICPortal is

RICPortal is a web system for the Rural Improvement Club (RIC) program of the Municipal Agriculture Office (MAO) of Libmanan, Camarines Sur, headed by the Municipal Agriculturist. It is the capstone project of Vince Timothy B. Bragais and Princes D. Banico (Central Bicol State University of Agriculture, Sipocot). The Developer builds it under Agreement GD-2026-001.

**Problem today.** RIC Teachers travel to the MAO to submit reports, cannot easily track whether a report was received, reviewed, approved or returned, and keep feeding-program records (menus, assigned parents, ingredients, budget, expenses) and student records on paper.

**Users.** Administrator (MAO), RIC Teachers (one per RIC Children Center; 28 centers in the MAO list) and Parents.

## 2.2 The three modules (names are fixed; do not use objective numbers in code or UI)

| Module | What it does |
| --- | --- |
| Student Registration and Management | Teachers register students and keep the Child's Record. The Enrollment Form is generated as a PDF. Teachers can view the previous school year's list |
| Document Submission and Tracking | Teachers upload monthly reports as files (Accomplishment, Enrollment). The Admin reviews them: Submitted, Need Revision, Approved |
| Feeding Program and Liquidation | The Admin uploads the DSWD menu Excel file; a calendar shows menus; Teachers assign Parents weekly; Teachers and Parents enter purchases; the system fills the Purchase Request, Summary of Disbursement and Transmittal Checklist as PDFs; the Teacher submits the monthly report |

Plus: login, roles, centers and accounts; Admin dashboard (number of RIC Teachers, total enrolled students, report status).

## 2.3 Features by role (from Annex A)

| Role | Can do |
| --- | --- |
| Administrator | Manage centers and Teacher accounts; reset Teacher passwords; view students and Child's Records (read-only); review reports with feedback; upload the DSWD file; view calendars and liquidation of any center; set the per-child daily rate and form signatory names; see the dashboard |
| RIC Teacher | Approve Parents; manage students and Child's Record entries; generate the Enrollment Form; submit and revise reports; view the calendar; assign Parents weekly; list ingredients; lock days; enter purchases; generate liquidation PDFs; submit the monthly liquidation report |
| Parent | Sign up (needs Teacher approval); see assigned feeding days with the menu and ingredients; enter unit, quantity and unit cost for the assigned days while the day is open |

## 2.4 Explicitly out of scope

AI or machine learning; custom calendar activities created by teachers; receipt or photo uploads for purchases; a recipe or ingredient database; a mobile application; integration with DSWD or any external government system; payroll; Daily Time Record; automated medical or nutritional assessment; SMS, email or push notifications; live or real-time features; migration of old paper records; extra user roles; extra forms beyond those in Annex A; offline mode. Anything else not in Annex A is a change request (Agreement Section 9), not part of this build.

## 2.5 Decisions where the clients' paper and the agreement disagree

The clients' paper (Chapters 1 to 3) was reviewed. Where it disagrees with Annex A or with working software, this table is the resolved decision. The Developer will tell the clients to update the paper; Claude must build to the decision column.

| ID | Topic | Paper says | Decision for the build |
| --- | --- | --- | --- |
| D-01 | Objective numbering | Objectives: 1 Student, 2 Feeding and Liquidation, 3 Document tracking | Annex A orders them 1 Student, 2 Document tracking, 3 Feeding. Numbering is a label only. Build by module name. The Developer will align the paper or Annex A |
| D-02 | Report statuses | "On Process, Need Revision, Submitted" (Chapter 2) | Submitted, Need Revision, Approved (BR-07) |
| D-03 | How reports are made | Teachers "create" Accomplishment and Enrollment reports in the system | Reports are uploaded as files (Annex A). The Enrollment Form is also generated as a PDF (A-15) |
| D-04 | Admin and Child's Record | Admin receives child records (Level 0 diagram) | Admin has read-only access (A-16) |
| D-05 | Login identity | ERD uses email and password for Teacher and Admin; Parent has no password | Everyone logs in with a username and password. No email is sent (BR-05, A-13) |
| D-06 | Barangays | A Barangays entity with teachers assigned to a barangay | The unit is the RIC Children Center (28). Some barangays have more than one. A center has a barangay name field |
| D-07 | Calendar data | One `calendar` entity holds menu, ingredients, price, quantity and activity | Menu days, assignments, purchase requests and purchase items are separate tables (4.5) |
| D-08 | Calendar activities | "Updating calendar information" by teachers | Teachers cannot add custom activities. They assign Parents and manage purchase requests |
| D-09 | Parent view | Parent can view the scheduled menu | Parent sees only assigned days (A-06) |
| D-10 | Programming language | Table 3.1: HTML, CSS, JavaScript, PHP | The system uses TypeScript, React, Node.js, Express and MySQL (Agreement 3.4). The clients must update Table 3.1 |
| D-11 | Methodology | Text describes RAD; Figure 3.1 shows Agile | Not a build matter. The Developer will tell the clients to make them agree |
| D-12 | Leftover wording | "applications", "application forms", "online application of RIC teachers" | Not part of any module. Do not build an application feature |
| D-13 | Today's event | DFD process 4.1 "Check Today's Event" | Included as the "Today's Feeding" card (A-18) |
| D-14 | Report review | DFD shows reportStatus and reportFeedback as separate entities and a status column on the report | One status on the report, plus review records with feedback (4.5) |
| D-15 | Liquidation data | ERD has no liquidation structure | Purchase requests, items, snapshots and a LIQUIDATION report type (Phases 5 and 6) |
