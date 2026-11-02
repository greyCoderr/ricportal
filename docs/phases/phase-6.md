# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 6: Liquidation Forms (PDF) and Submit Report

| Item | Value |
| --- | --- |
| Goal | The system fills in the Purchase Request, Summary of Disbursement and Transmittal Checklist as PDFs, and the Teacher submits the monthly liquidation to the Admin |
| Depends on | Phase 5 gate |
| Branch and tag | `phase-6-liquidation`, tag `v0.6.0` |
| Rules | BR-16, BR-17, BR-18, A-09, A-10, A-11 |

**Build:** three PDF generators, the liquidation preview, snapshot and submission, Admin review of liquidation reports using the Phase 3 review flow, unlock on NEED_REVISION, signatory settings.

**Do NOT build:** the dashboard, new report types other than LIQUIDATION, e-signatures, email, bulk export, extra forms beyond the three in Annex A.

**Figma screens to read:** the overlay "Liquidation Forms" on the calendar page (tabs: Purchase Requests, Summary of Disbursement, Transmittal Checklist), the Submit Report confirmation, Admin: liquidation report detail, Settings: form signatories.

**Data changes (additive):** add `LIQUIDATION` to the report type; add `period_start` and `period_end` to `reports` (null for other types); add `liquidation_snapshots`; add `submitted_report_id` to `purchase_requests`; add Settings keys for `approvedByName`, `approvedByTitle`, `notedByName`, `notedByTitle`.

| Method and path | Role | Purpose |
| --- | --- | --- |
| GET /api/liquidation/preview?from=&to= | Teacher | Days, items, subtotals and total; flags days that are not LOCKED or NO_FEEDING |
| GET /api/liquidation/pdf/purchase-request?date= | Teacher, Admin | One day PDF |
| GET /api/liquidation/pdf/summary?from=&to= | Teacher, Admin | Summary of Disbursement PDF |
| GET /api/liquidation/pdf/transmittal?from=&to= | Teacher, Admin | Transmittal Checklist PDF |
| POST /api/liquidation/submit | Teacher | Body: from, to. Creates the report and snapshot |
| GET /api/reports/:id/snapshot | Admin, Teacher | Snapshot for the submitted version |
| GET, PATCH /api/settings/signatories | Admin | Printed names and titles |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P6-T01 | Migration: report type, period fields, snapshots, `submitted_report_id`, signatory settings | schema.prisma | Migration applies without touching existing rows |
| P6-T02 | Liquidation data builder: gather days, PRs and items in the range into one typed structure used by preview, PDFs and snapshots | modules/liquidation/builder.ts | One structure feeds all three outputs |
| P6-T03 | Purchase Request PDF: layout below; items continue on extra pages with the header repeated and the sub-total on the last page | modules/pdf/purchase-request.ts | Visually matches the official form photo |
| P6-T04 | Summary of Disbursement PDF: layout below; about 20 rows per page with the header repeated and the grand total at the end | modules/pdf/summary.ts | Visually matches the official form photo; total equals the sum of daily subtotals |
| P6-T05 | Transmittal Checklist PDF built from the clear copy of the form. **If the clear copy has not arrived by Day 17, build a neutral placeholder layout behind a flag, mark it "layout pending", and raise it with the clients (Agreement clause 7.2)** | modules/pdf/transmittal.ts | Matches the official copy, or the placeholder is flagged in PHASE_LOG.md |
| P6-T06 | Submit service (BR-16): validation of every day, one transaction creating report, version and snapshot and marking Purchase Requests submitted-locked; overlap with an existing submission returns 409 | modules/liquidation | Failure leaves no partial data |
| P6-T07 | Extend the review flow for LIQUIDATION: NEED_REVISION unlocks the Purchase Requests of that range; resubmission creates a new snapshot version; APPROVED is final | modules/reports | State machine tests pass for the new type |
| P6-T08 | PDFs for submitted reports come from the snapshot, not live data | modules/pdf | Editing data after submission cannot change an approved PDF |
| P6-T09 | Settings: signatory names and titles (Admin) | modules/settings | Printed on the PDFs; blank by default |
| P6-T10 | Permission matrix entries and scoping tests | server/test | Matrix green |
| P6-T11 | Frontend overlay "Liquidation Forms" on the calendar page with the three tabs, preview tables, download buttons and period picker (default current month) | features/liquidation | Matches Figma |
| P6-T12 | Frontend Submit Report: confirmation dialog with totals and the list of any blocking days; success state; read-only banner afterward | features/liquidation | Blocking days link back to their day panels |
| P6-T13 | Frontend Admin: liquidation report detail (forms from the snapshot, review actions) in the Reports queue; signatories settings screen | features/reports, features/settings | Approve and Need Revision work |
| P6-T14 | Polish and gate | all | Gate checklist ticked |

**Purchase Request PDF layout (official form).** Header left: Local Government of LIBMANAN, CAMARINES SUR; Standard Form Number SF-GOOD-59; Revised on May 24, 2004. Header right: PRN line; "SUPPLEMENTARY FEEDING (Name of Project)"; "LIBMANAN CAMARINES SUR (Location of Project)". Then "Standard Form No. PURCHASE REQUEST", a centered title PURCHASE REQUEST, "LGU-Libmanan, Camarines Sur", "Agency / Procuring Entity". Fields: Department, Section, PR No. (from import), PR date, SAI No., Date. Table columns: ITEM NO., UNIT, ITEM DESCRIPTION, QTY, UNIT COST, TOTAL COST. The first line of the description column shows the menu name as a heading; ingredient rows follow. Sub-total at the bottom. "Purpose / Remarks: Supplementary Feeding Program CY: [year]". Signature table: Requested by (Signature, Printed Name, Designation, Date) with the Teacher's name filled in, and Approved by with the configured printed name and title (blank by default).

**Summary of Disbursement layout (official form).** Header: MUNICIPAL SOCIAL WELFARE & DEVELOPMENT OFFICE, PROVINCE OF CAMARINES SUR, MUNICIPALITY OF LIBMANAN. Then Name of Child Development Center (center name) and Barangay. Title SUMMARY OF DISBURSEMENT and "Date: [from] to [to]". Table: Date, Particular (menu name), Statement of Market Purchase No. (the PR No.), Total Amount. TOTAL at the end. Bottom: Prepared by with the Teacher's name and worker title (left or right as on the form), Noted by with the configured name and title. Money format: PHP with thousands separators and two decimals.

**Font and glyph check.** Confirm the peso sign renders in the PDF font. If it does not, print "PHP". Decide once and apply to all PDFs.

**Edge cases to test:** a day with no items; many items spilling to a second page; a long menu name; a month with 31 days; NO_FEEDING days excluded from totals; a range that starts before the first imported date; Submit with one day still OPEN (blocked with a list); concurrent Submit by two browser tabs; NEED_REVISION then resubmit; totals match across PR, Summary and snapshot.

**Tests required:** builder totals, PDF smoke tests (start with %PDF, expected page counts), snapshot immutability, submit validation, unlock and relock, scoping.

**Gate additions:** a human compares each generated PDF with the official form photos; the clients confirm the Transmittal Checklist layout, or the gap is logged and reported.
