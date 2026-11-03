# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 3: Report Submission and Tracking

| Item | Value |
| --- | --- |
| Goal | Teachers upload monthly reports as files; the Admin reviews them; statuses and history are tracked |
| Depends on | Phase 2 gate |
| Branch and tag | `phase-3-reports`, tag `v0.3.0` |
| Rules | BR-06, BR-07, BR-20, A-08, A-15 |

**Build:** secure file storage, report submission, versions, review with feedback, resubmission, lists with filters, authorized download.

**Do NOT build:** liquidation reports (they arrive in Phase 6), the dashboard counts, email or push notifications, in-browser document editing, file previews other than download.

**Figma screens to read:** Teacher: My Reports list, Submit report dialog, Report detail with history; Admin: Submitted Reports queue, Review dialog.

**Data:** `file_assets`, `reports`, `report_versions`, `report_reviews`.

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /api/reports | Teacher | Multipart: type, year, month, file, note. Creates report and version 1 |
| POST /api/reports/:id/resubmit | Teacher | Multipart file; allowed only when NEED_REVISION |
| GET /api/reports | Teacher (own), Admin (all) | Filters: status, type, centerId, year, month; pagination |
| GET /api/reports/:id | Teacher (own), Admin | Report with versions and reviews |
| GET /api/reports/:id/versions/:n/file | Teacher (own), Admin | Authorized download |
| POST /api/reports/:id/review | Admin | Decision APPROVED or NEED_REVISION; feedback required for NEED_REVISION (max 1000 characters) |
| GET /api/reports/summary | Teacher, Admin | Counts by status in the user's scope |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P3-T01 | Shared schemas and enums for report type and status | shared/src | Used by both sides |
| P3-T02 | Prisma models and migration for files, reports, versions, reviews, unique (center, type, year, month) | schema.prisma | Migration applies |
| P3-T03 | File storage service: allowed types and size from config, extension and magic-byte check, random UUID names, write outside the web root, temp-then-move so a failed DB write leaves no orphan | modules/files | Tests: renamed .exe, empty file, 11 MB file, wrong mime, double extension all rejected |
| P3-T04 | Reports service: submit (BR-06), resubmit, list, detail; transactions for report plus version plus file | modules/reports | Second submit for the same month returns 409; resubmit only in NEED_REVISION |
| P3-T05 | Review service: approve and need revision with feedback, status machine guard (BR-07), idempotent repeats | modules/reports | Invalid transitions return STATE_INVALID |
| P3-T06 | Routes, guards, multipart error mapping (413 `PAYLOAD_TOO_LARGE` and 400 with friendly messages), authorized download with safe headers | reports routes | Another center's file returns 404; header is attachment with a sanitized name |
| P3-T07 | Frontend Teacher: My Reports list with filters, status badges, submit dialog (type, month, drop zone with type and size hints, optional note), upload progress and error messages | features/reports | Matches Figma; large file shows a clear message |
| P3-T08 | Frontend report detail: version history, Admin feedback timeline, download, upload revision button when NEED_REVISION | features/reports | History is in order; feedback is visible to the Teacher |
| P3-T09 | Frontend Admin: Submitted Reports queue (default filter SUBMITTED), center filter, review dialog (Approve, Need Revision with required feedback) with confirm | features/reports | Review updates the list immediately |
| P3-T10 | Polish and gate | all | Gate checklist ticked |

**Details.** Allowed month is any month up to the current one (late submissions allowed). Status colors: Submitted blue, Need Revision amber, Approved green. The Enrollment Form PDF from Phase 2 can be downloaded, signed on paper, scanned and uploaded here as type ENROLLMENT (A-15). The file drop zone shows accepted types and the size limit before upload.

**Edge cases to test:** upload interrupted; Unicode filenames; two Teachers uploading at once; a Teacher whose center changed; downloading a file after the report was approved; double-click on submit (second request is a safe 409).

**Tests required:** file validation matrix, status machine table, scoping, authorization on download, transaction rollback leaves no orphan file.

**Gate additions:** an upload and download round trip works on the production skeleton (check the storage folder permissions and disk space on Hostinger).
