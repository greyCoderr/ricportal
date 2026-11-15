# Objective 3 Plan: Report File Uploads and Review

Written Sat 2026-11-14 in Plan 5, stage J1c. This is a plan only: no code, no migration and no dependency
was added. Objective 3 does not start until the Developer says so. The module name in code and UI is
"Document Submission and Tracking" (blueprint 2.2); "Objective 3" is the Plan 5 label for it.

Sources: docs/blueprint/01-context.md (Annex A scope), docs/phases/phase-3.md, blueprint 4.5, 4.6 (BR-06,
BR-07, BR-20), 4.7 (A-08, A-15), docs/SPRINT_SHORTCUTS.md, docs/figma-inventory.md, and the code as it is
at v0.9.8-demo.

## 1. Scope

### In scope (Annex A, module Document Submission and Tracking)

| # | Item | Today | Objective 3 |
| --- | --- | --- | --- |
| 1 | Teacher uploads a monthly report as a file: Accomplishment or Enrollment | `/submit-report` says "Coming soon" | A real Submit Report page |
| 2 | Versions and files: each submission and each revision keeps its file | Liquidation keeps one snapshot per version; no file table | `file_assets` and `report_versions` |
| 3 | Review flow: Submitted, then Approved or Need Revision with feedback, then resubmit (BR-07) | Built for liquidation reports | Reused unchanged for the two file types |
| 4 | Teacher Report Status for every type, with the file, the versions and the Admin's feedback | Liquidation only | All three types, filter by type and month |
| 5 | Teacher Admin Feedback for every type | Liquidation only | All three types |
| 6 | Admin Reports for all types: queue, filters, download, review | Liquidation queue with a status filter | Type tabs, center and month filters, download |
| 7 | Real dashboard counts: Enrollment and Accomplishment reports submitted | The counts are real but always 0 | They count the new reports; Recent Reports tabs by type |
| 8 | The signed Enrollment Form is uploaded as type ENROLLMENT (A-15) | PDF can be generated | Same upload page, type Enrollment |

### Not in scope

Liquidation reports stay as they are (generated from Purchase Requests, never uploaded). No file preview
in the browser, no editing of documents, no email, SMS or push notifications, no receipt or photo uploads
for purchases, no report types other than the two above (blueprint 2.4). Figma's "Rejected", "Pending",
"Approved with Remarks" and "Resolved" are not agreed statuses (DEC-028, DEC-041): they are not built
unless the client asks through a change request.

## 2. What already exists and is reused

| Piece | Where | Use in Objective 3 |
| --- | --- | --- |
| `reports` table with `type` (LIQUIDATION, ENROLLMENT, ACCOMPLISHMENT), `period_start`, `period_end`, `status`, `current_version`, `submitted_at` | `schema.prisma` | Kept. A monthly report stores the first and last day of its month |
| `report_reviews` and the review transaction (status guard, feedback, one decision only) | `liquidation.repository.ts` `review` | Reused. Its "reopen the days" step changes nothing for a report without Purchase Requests |
| `GET /api/reports`, `GET /api/reports/:id`, `POST /api/reports/:id/review`, `GET /api/reports/feedback` | `liquidation.routes.ts` | Kept at the same paths; moved into `modules/reports` (task O3-T05) |
| Center scope (`scopeToCenter`, `assertCenterAccess`) and the permission matrix test | `core/scope.ts`, `permissions.db.test.ts` | Every new route gets a row |
| Upload pattern: multer in memory, size limit, extension plus signature, own error text | `menu.routes.ts` | Same pattern, with disk storage and more types |
| Pages: Reports, Report detail, Admin Feedback, Teacher Home Report Tracking, Admin Recent Reports | `client/src/features/reports`, `features/home`, `features/dashboard` | Extended, not rebuilt |
| Stamp, StatusBadge, Tabs, Table, Modal, Pagination | `client/src/components/ui` | Used as they are |

## 3. Data model changes (additive only)

One migration, `objective3_report_files`. Nothing existing is changed or dropped.

| Table | Columns | Notes |
| --- | --- | --- |
| `file_assets` (new) | id, storage_key VARCHAR(64) unique, original_name VARCHAR(255), mime VARCHAR(100), size_bytes INT, sha256 CHAR(64), uploaded_by INT, created_at | `storage_key` is a random UUID with no extension. It is never sent to the client (blueprint 4.8) |
| `report_versions` (new) | id, report_id (FK reports), version_no INT, file_id (FK file_assets), note VARCHAR(500) NULL, submitted_by INT, submitted_at DATETIME, created_at, updated_at | Unique (report_id, version_no). Index (file_id) |
| `reports` (existing) | no new column | A monthly report uses `period_start` = first day and `period_end` = last day of the month, so lists, filters and display codes work for all types |

BR-06 (one report per center, type and month). Two ways, to be chosen in O3-T02:

1. A unique index on `reports` (center_id, type, period_start). It also holds for liquidation reports,
   because overlapping periods are already refused. The migration fails if two existing reports share a
   center, type and start date, so the task first counts such rows on the local and the TiDB database
   (the Developer runs the TiDB query, DEC-016).
2. If duplicates exist: no index; the submit transaction locks the center row (`SELECT ... FOR UPDATE`, as
   AUD-003 does for Purchase Requests) and then checks.

The paper's `report_versions` for liquidation (SPRINT_SHORTCUTS "report_versions table") is not needed:
liquidation versions keep using `liquidation_snapshots`. A file report has versions; a liquidation report
has snapshots; `current_version` counts both.

Where files live: one folder outside the web root, from a new setting `UPLOAD_DIR` (required in
production). Files are written as `<UPLOAD_DIR>/<storage_key>`. On Hostinger the folder must be outside
`public_html` and must survive a deployment; this is checked at the deployment gate, not now.

## 4. Business rules

| Rule | How it is enforced | Test |
| --- | --- | --- |
| BR-06 one report per center, type and month; submit only when none exists or the latest is NEED_REVISION | `POST /api/reports` answers 409 CONFLICT when a report exists for that month, whatever its status; a returned report is revised with `POST /api/reports/:id/resubmit`, which needs NEED_REVISION | Second submit 409; resubmit while SUBMITTED or APPROVED 409 STATE_INVALID; two submits at the same moment give one 201 and one 409 |
| BR-06 detail: the month is any month up to the current one in Asia/Manila (phase 3) | Service check with `manilaToday` | Next month 400; this month and a month last year 201 |
| BR-07 SUBMITTED to APPROVED or NEED_REVISION (Admin, feedback required for NEED_REVISION); NEED_REVISION to SUBMITTED by resubmit; APPROVED is final | The existing conditional updates | The status table test, run for all three types |
| BR-20 types PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10 MB; extension and content must both match; random names; outside the web root; download only through an authorized endpoint | Section 6 | The file matrix in O3-T03 |
| BR-02 a Teacher sees and downloads only the own center's reports; the Admin all | `assertCenterAccess` on the report before the file is opened | Another center's report and file answer 404 |
| A-15 the signed Enrollment Form is uploaded as ENROLLMENT | Same upload | Covered by the type parameter |

## 5. Endpoints

All under `/api`, cookie session, standard `{ data, meta }` and error shapes.

| Method and path | Role | Request | Answers |
| --- | --- | --- | --- |
| POST /reports | Teacher | Multipart: `type` (ENROLLMENT or ACCOMPLISHMENT), `year`, `month`, `file`, `note` (optional, 500) | 201 report with version 1. 400 fields or file type; 409 a report exists for that month; 413 over 10 MB |
| POST /reports/:id/resubmit | Teacher, own center | Multipart: `file`, `note` | 200 report with the new version. 409 STATE_INVALID unless NEED_REVISION; 404 other center; 400 for a LIQUIDATION report (it is resubmitted from the Calendar) |
| GET /reports | Teacher (own center), Admin (all) | Existing `status`, `page`, `pageSize`; new `type`, `centerId` (Admin), `year`, `month` | 200 page of reports. `centerId` of another center for a Teacher 404 |
| GET /reports/summary | Teacher, Admin | Optional `type` | 200 counts by status in the caller's scope |
| GET /reports/:id | Teacher (own center), Admin | none | 200 report with `versions` (number, original file name, size, note, submitted time) and `reviews`. No storage key |
| GET /reports/:id/versions/:n/file | Teacher (own center), Admin | none | 200 the file, `Content-Disposition: attachment` with a cleaned name, `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`. 404 other center, unknown version, or a LIQUIDATION report |
| POST /reports/:id/review | Admin | Existing body `decision`, `feedback` | Unchanged |
| GET /reports/feedback | Teacher | Existing | Unchanged; rows gain `type` |
| GET /dashboard/summary | Admin | none | Unchanged shape; `submittedByType` becomes non-zero |

The existing snapshot and report PDF routes stay for LIQUIDATION only and answer 404 for the file types.

## 6. Upload security design (BR-20)

1. Size: multer limit of 10 MB (`UPLOAD_MAX_BYTES`), one file, one field. Over the limit answers 413 with
   our own text. An empty file answers 400.
2. Storage during the request: memory (as the menu import does) is the simplest and 10 MB is small, but two
   PDFs at once on a small host is 20 MB plus copies. Proposed: multer disk storage into
   `<UPLOAD_DIR>/tmp` with a random name, then the checks, then a rename into place. Decided in O3-T03 after
   measuring memory on this laptop.
3. Type: the extension (lower case, the last one only) must be in the list, and the first bytes must match
   it: `%PDF-` for PDF; `FF D8 FF` for JPG; the 8-byte PNG signature; `D0 CF 11 E0` for DOC and XLS; the ZIP
   signature for DOCX and XLSX plus the entry `word/document.xml` or `xl/workbook.xml` in the archive, so a
   renamed ZIP is refused. The browser's `Content-Type` is not trusted and not used for the decision.
   The blueprint names the `file-type` package for this; it is not installed. Open question Q1.
4. Names: the stored name is a random UUID. The original name is kept only as text for display and for
   the download header, cut to 255 characters; path separators, control characters and quotes are removed
   before it is used in `Content-Disposition`, and a UTF-8 `filename*` is sent for other scripts.
5. Order of work, so nothing is left behind: write to the temporary name, compute SHA-256, check type and
   size, start the database transaction (file row, report, version), move the file to its final name,
   commit. If the transaction fails, delete the file. A test makes the transaction fail and checks that
   the folder is empty.
6. Download: the report is loaded and scoped first; only then is the path built from the `storage_key`
   read from the database (never from the request). The file is streamed. Files are never under a static
   route, and `express.static` serves only `client/dist`.
7. Limits: the upload routes get their own rate limit (J4 adds the limiter for login; the same helper is
   used here). The PDF text and Office macros are not opened or scanned by the server; a file is only
   stored and returned as an attachment. Virus scanning is not in Annex A (open question Q4).
8. Logs: file names can hold personal names, so they are not logged (BR-21); the log holds the file id.

## 7. Screens and Figma frames

Each frame is read once (design context plus one screenshot) when its task starts, within the Figma call
limit of the plan that runs Objective 3. Node ids are from docs/figma-inventory.md.

| Screen | Route | Role | Figma frame | Today | Work |
| --- | --- | --- | --- | --- | --- |
| Submit Report | `/submit-report` | Teacher | submit report 78:268 | "Coming soon" | Form: type, month and year, file drop zone with the allowed types and 10 MB shown before upload, note, progress, errors under the fields |
| Report Status | `/reports` | Teacher | report status 78:284; mobile 378:15917 | Liquidation list with a status filter | Type, year and month filters, search by code; details column shows versions, download, feedback and "Upload revision" when Need Revision |
| Report detail | `/reports/:id` | Teacher, Admin | none found; the details column of 78:284 and the Admin panel of 268:12661 are the nearest | Liquidation detail with Stamp and PDFs | A file variant: versions with download, review timeline; no snapshot tables |
| Admin Feedback | `/admin-feedback` | Teacher | RIC 4 78:276 (to confirm when read) | Liquidation feedback | Adds the type and a link to upload the revision |
| Reports | `/reports` | Admin | ADMIN3 268:12661; mobile 378:15917 | Liquidation queue | Type tabs (All, Enrollment, Accomplishment, Liquidation), center and month filters, download, review dialog |
| Admin Dashboard | `/` | Admin | ADMIN 267:9689 | Two cards always 0, one Recent Reports list | Real counts; Recent Reports tabs by type as the frame shows |
| Teacher Home | `/` | Teacher | RIC dashboard 175:1023 | Report Tracking and Recent Reports for liquidation | Include the new types; Quick Action "Submit Report" opens the real page |
| Teacher Profile | `/profile` | Teacher | profile 88:695 | Counts and list for liquidation | Count and list all types |

Screens with no client frame (the file variant of Report detail, the upload progress and error states, the
"Upload revision" dialog) follow docs/DESIGN_LANGUAGE.md and go through the ricportal-design-gap skill;
they are listed for client approval. The ricportal-ui-states skill applies to every screen (loading, empty,
error, forbidden, read-only).

## 8. Tasks

Tests are written first and seen failing, as in every task. "Days" are working days for one developer with
Claude, including the tests and the documents of the task.

| Id | Task | Files | Tests | Done when | Days |
| --- | --- | --- | --- | --- | --- |
| O3-T01 | Shared schemas: upload fields (type, year, month, note), list query (type, centerId, year, month), DTOs for versions and the summary; allowed types and size as shared constants for the drop zone text | `shared/src/reports.ts` | Schema tests: bad month, next month, long note, unknown type | Client and server import the same schemas | 0.5 |
| O3-T02 | Migration: `file_assets`, `report_versions`; the BR-06 index or the lock (section 3) after counting duplicates; `UPLOAD_DIR` and `UPLOAD_MAX_BYTES` in the env schema | `schema.prisma`, one migration, `config/env.ts` | Env tests; migration applies on the test database | `migrate deploy` passes locally; DATA_MODEL.md updated | 0.5 |
| O3-T03 | Files module: receive, check (section 6), store, delete on failure, open for download | `modules/files/*` | The file matrix: each allowed type accepted; renamed .exe, empty file, 11 MB, wrong content for the extension, double extension, ZIP renamed to .docx, name with path parts all refused; failed transaction leaves no file | Matrix passes; nothing is written outside `UPLOAD_DIR` | 2 |
| O3-T04 | Reports service: submit (BR-06, month rule), resubmit, in one transaction with the file | `modules/reports/*` | Second submit 409; two at once: one 201, one 409; resubmit only in NEED_REVISION; scope tests | BR-06 and BR-07 tests pass for both types | 1 |
| O3-T05 | Move list, detail, review, feedback from `modules/liquidation` into `modules/reports`; add filters, summary and versions; liquidation keeps preview, submit, snapshot and PDFs | `modules/reports/*`, `modules/liquidation/*`, `api.ts` | Every existing liquidation and report test passes unchanged; new filter and summary tests; the status table for three types | No route path changes; the matrix test lists the new routes | 1.5 |
| O3-T06 | Routes: multipart errors to 400 and 413 with our text, download with safe headers, rate limit, negative permission tests | `reports.routes.ts`, `permissions.db.test.ts` | Another center's file 404; Parent 403; header is attachment with a cleaned name; Unicode name round trip | ricportal-endpoint-checklist done for each route; API.md updated | 1 |
| O3-T07 | Teacher Submit Report page | `features/reports/pages/SubmitReportPage.tsx`, api, hooks | Page tests: validation before sending, 409 and 413 messages, progress, success goes to Report Status | Matches 78:268 at 1440 and 390 | 1.5 |
| O3-T08 | Report Status, the file variant of Report detail, Upload revision, Admin Feedback with types | `features/reports/*` | Versions in order; feedback visible; revision button only in Need Revision; liquidation views unchanged | Matches 78:284 | 1.5 |
| O3-T09 | Admin Reports for all types: tabs, center and month filters, download, review on a file report | `features/reports/pages/ReportsPage.tsx` | Filters call the API with the right query; review updates the list; liquidation review unchanged | Matches 268:12661 | 1 |
| O3-T10 | Counts and previews: Admin dashboard cards and Recent Reports tabs, Teacher Home, Teacher Profile | `features/dashboard`, `features/home`, `auth.repository.ts` (teacher summary counts all types) | Count tests on the test database; the two cards are no longer always 0 | Numbers equal the database | 0.5 |
| O3-T11 | Gate: security-reviewer agent on the upload and download paths, full check in batches, browser check of every changed page for the three roles at 1440, 1366 and 390, demo seed with two sample reports, documents (API, DATA_MODEL, UI_MAP, BUSINESS_RULES, CHANGELOG, SPRINT_SHORTCUTS rows closed) | docs, `server/prisma/demo-seed.ts` | Demo flow test extended: upload, Need Revision, revision, Approve | All checks pass; tag | 1.5 |

Order: T01, T02, T03, T04, T05, T06 (server complete and tested), then T07 to T10, then T11. T05 can run
before T03 if the Developer wants the move reviewed alone.

## 9. Risks

| Risk | Effect | Answer |
| --- | --- | --- |
| Storage on Hostinger: folder outside the web root, kept across deployments, disk space | Uploads lost or public | Deployment is postponed; `UPLOAD_DIR` is a setting; the gate of the deployment phase does an upload and download round trip (phase 3 gate addition). 28 centers x 2 reports x 12 months x 10 MB is at most about 6.7 GB a year; real files are far smaller. Ask the host's limit (Q3) |
| The database holds the rows but the files are on disk | A backup of only one of them breaks downloads | Document the backup of both together; the download answers 404 with a clear message when the file is missing, and logs the file id |
| Moving routes between modules (O3-T05) | Liquidation review breaks | The move changes no path and no behaviour; all existing tests must pass unchanged before anything is added |
| The BR-06 unique index on existing data | Migration fails on TiDB | Count duplicates first; fall back to the lock |
| Office files with macros, or a harmful PDF | The Admin opens a harmful file | Files are downloaded as attachments, never shown in the page; types are checked by content. No scanning (Q4) |
| Memory on a small host with several uploads | Slow or stopped server | Disk storage for uploads, the size limit, the rate limit |
| Figma frames show statuses and filters that are not agreed | Scope grows | Build BR-07 statuses only; list the differences for the client (docs/OPEN_QUESTIONS.md in J5) |
| Findings from the audit that touch this work: AUD-005 and AUD-006 (500 on a double click), AUD-015 (transaction limits), AUD-019 (personal data in error logs) | The new submit has the same weaknesses | Do those three small items in J4 before Objective 3, or as O3-T00 |

## 10. Estimate

| Part | Working days |
| --- | --- |
| Server: O3-T01 to O3-T06 | 6.5 |
| Client: O3-T07 to O3-T10 | 4.5 |
| Gate: O3-T11 | 1.5 |
| Sum | 12.5 |
| Allowance for review rounds with the Developer and Figma differences (about 20%) | 2.5 |
| Total | 15 |

So: about 12 to 15 working days, three working weeks. The estimate assumes the answers to Q1 and Q2 do not
change the design, that Objective 2 is finished and tagged first (Plan 5, J6), and that there is no
deployment work inside it. It is an estimate from reading the code, not from a trial.

## 11. Open questions for the Developer (answers needed before O3-T02)

| # | Question | Default if no answer |
| --- | --- | --- |
| Q1 | Add the `file-type` package (named in blueprint 4.3) for the content check, or write the seven signatures ourselves with no new dependency? | Our own checks, no dependency; exceljs's ZIP reader is already installed for the DOCX and XLSX entry check |
| Q2 | May a Teacher replace a file while the report is still SUBMITTED and not yet reviewed (a wrong file uploaded by mistake)? BR-06 says no | No: the Admin returns it with Need Revision |
| Q3 | What disk space does the Hostinger plan give, and is a folder outside `public_html` kept across deployments? | Ask at the deployment phase |
| Q4 | Does the client expect virus scanning of uploads? It is not in Annex A | No scanning; say so in the manual |
| Q5 | Is the report month chosen by the Teacher (any month up to now), and may one month have both an Enrollment and an Accomplishment report? | Yes to both (phase 3 details; BR-06 is per type) |
| Q6 | Are the file types and the 10 MB limit of A-08 confirmed by the client? | Keep A-08 |
