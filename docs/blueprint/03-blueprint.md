# 4. System Blueprint (Single Source of Truth)

Claude reads this section at the start of every session (it is stored under docs/blueprint/). If the code and this section disagree, stop, report the conflict in docs/DECISIONS.md, and fix one of them the same day.

## 4.1 Roles and permission matrix

A = Administrator (MAO), T = RIC Teacher, P = Parent. "Own" means the user's own center. Anything not listed is forbidden.

| Capability | A | T | P | Built in |
| --- | --- | --- | --- | --- |
| Check service health (`GET /api/health`), no login | Public | Public | Public | P0 |
| Log in, log out, change own password | Yes | Yes | Yes | P1 |
| Manage RIC Children Centers | Yes | No | No | P1 |
| Create, edit, disable Teacher accounts; reset Teacher password | Yes | No | No | P1 |
| Sign up as a Parent | Public | Public | Public | P1 |
| Approve, decline, disable Parents; reset Parent password | No | Own center | No | P1 |
| Add, edit, archive students; view own student list | No | Own | No | P2 |
| View student lists and Child's Records of all centers (read-only) | Yes | No | No | P2 |
| Child's Record entries: One-on-One Conferences, Home Visitations, Progress | Read-only | Own (create, edit, delete) | No | P2 |
| Generate Enrollment Form PDF | Any center | Own | No | P2 |
| Upload and submit reports, upload revisions | No | Own | No | P3 |
| Review reports (approve, need revision, feedback) | Yes | No | No | P3 |
| Upload DSWD food rotation file | Yes | No | No | P4 |
| View feeding calendar | All centers | Own | Own assigned days (P5) | P4 / P5 |
| Assign Parents to feeding days | No | Own | No | P5 |
| Open, fill and lock Purchase Requests | No | Own | Fill assigned days only | P5 |
| Set per-child daily rate | Yes | No | No | P5 |
| Generate liquidation PDFs; Submit Report | View/download | Own | No | P6 |
| Dashboard and monitoring | Yes | No | No | P7 |

Health is the only route that is public with no login (DEC-001). It returns only `status`, `db` and `time`. The permission matrix test (P1-T12) lists it as Public and expects 200, or 503 when the database is down, for every role and with no login.

## 4.2 Glossary and labels

| Term | Meaning |
| --- | --- |
| RIC Children Center | One of the 28 centers in the MAO list (address column). Some barangays have more than one |
| RIC Teacher / RIC Worker | The person responsible for one center. The UI label comes from one constant (`labels.ts`) so the term can change in one line (A-01) |
| MAO | Municipal Agriculture Office of Libmanan. The Administrator |
| DSWD food rotation file | The Excel menu file (SF_MENU_for_30_days.xlsx). One file serves all centers |
| PR / PR No. | Purchase Request and its number, e.g. SF-2026-003, taken from the DSWD file |
| Feeding day | A date that has a menu in an imported DSWD file |
| Liquidation | The set of forms: Purchase Request, Summary of Disbursement, Transmittal Checklist |
| Child's Record | Per-child record of basic information plus repeating entries: One-on-One Conference with the Parent, Home Visitation and Progress |

## 4.3 Technology stack

| Layer | Choice | Rule |
| --- | --- | --- |
| Language | TypeScript (strict) everywhere | No JavaScript files in src |
| Frontend | React with Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS | Server state only in TanStack Query. No global store unless a task requires one |
| Calendar | FullCalendar (React plugins: daygrid, list, interaction only if needed) | Read-only calendar. No drag and drop |
| Backend | Node.js LTS, Express, Zod validation, pino logging, helmet, express-rate-limit, cookie-parser | Layered modules (4.4) |
| Database | MySQL with Prisma ORM and Prisma Migrate | Only migrations change the schema |
| Auth | bcrypt hashing, JWT in an httpOnly cookie, same-origin | No tokens in localStorage |
| Excel import | exceljs | Parse in a pure function with fixtures |
| PDF | pdfmake on the server | Verify the peso sign renders; fallback text is "PHP" |
| File upload | multer plus a magic-byte check (file-type) | See BR-20 |
| Tests | Vitest, Supertest, Testing Library, Playwright (3 end-to-end flows) | Separate test database |
| Quality | ESLint, Prettier, TypeScript project references, GitHub Actions | `npm run check` runs everything |

> **Decision gate at the end of Phase 0**
>
> If Prisma will not run on the Hostinger plan (engine binary or memory limits), decide **in Phase 0** to switch the data layer to Drizzle ORM or Kysely with mysql2. Do not discover this in Phase 5.

## 4.4 Architecture rules and folder structure

**Layering (backend).** `routes` (HTTP only) calls `controller` (parse, call service, shape response) calls `service` (business rules, transactions, permissions-by-scope) calls `repository` (Prisma queries only). Rules:

- Prisma is imported only in `*.repository.ts` and `db.ts`.
- Controllers contain no business logic. Services never read `req` or `res`.
- Every route declares its guards in one line: `authenticate, requireRole("TEACHER"), validate(schema)`.
- Center scoping is applied in the service through one helper (`scopeToCenter(user)`), never ad hoc.
- Each module is a folder. A module never imports another module's repository, only its service.

**Frontend.** `features/<module>` contains `api.ts` (typed calls), `hooks.ts` (TanStack Query), `components/`, `pages/`. Shared UI lives in `components/ui`. Pages compose components; components do not call fetch directly.

```text
ricportal/
  CLAUDE.md                  project memory for Claude
  docs/                      SPEC, DATA_MODEL, API, BUSINESS_RULES, UI_MAP, PHASE_LOG, BACKLOG, DEPLOY
  .claude/                   settings.json (hooks), skills/, agents/
  .github/workflows/ci.yml
  package.json               npm workspaces: shared, server, client
  shared/src/                zod schemas, enums, constants (roles, statuses, units), types
  server/
    prisma/                  schema.prisma, migrations/, seed.ts
    test/fixtures/           SF_MENU_for_30_days.xlsx and bad-file fixtures
    src/
      server.ts  app.ts
      config/env.ts
      core/                  db.ts logger.ts errors.ts response.ts asyncHandler.ts scope.ts
      core/middleware/       authenticate.ts requireRole.ts validate.ts errorHandler.ts rateLimit.ts
      modules/
        auth/ centers/ users/ students/ child-records/ reports/ files/
        menu/ calendar/ assignments/ purchase-requests/ liquidation/ dashboard/ settings/ pdf/
        (each: *.routes.ts *.controller.ts *.service.ts *.repository.ts *.schemas.ts *.test.ts)
  client/src/
    app/                     router.tsx providers.tsx layouts/
    components/ui/           Button Input Select Modal Drawer Table Badge Toast ...
    features/                auth centers teachers parents students reports calendar assignments purchase-requests liquidation dashboard settings
    lib/                     api.ts format.ts date.ts labels.ts
    styles/                  tokens from Figma
```

**Naming.** Files `kebab-case.ts`; React components `PascalCase.tsx`; DB tables `snake_case` plural via Prisma `@@map`; API paths plural nouns; enums `UPPER_SNAKE`; boolean fields start with `is` or `has`; dates in the API are `YYYY-MM-DD`, timestamps are ISO 8601 UTC.

**Scalability posture.** The API is stateless (no in-memory sessions); every list endpoint is paginated (default 20, max 100); no N+1 queries (use `include` or one grouped query); indexes on every foreign key and on (center_id, feeding_date); PDF generation runs through a small concurrency limit (2 at a time) so a burst cannot freeze the server; all limits (upload size, rate limits, page size) come from config.

## 4.5 Data model (target)

Tables are added in the phase that first needs them (see "Built in"). Types: `DATE` is date-only; money is `DECIMAL(12,2)`; every table has `created_at`, `updated_at`.

| Table | Key fields | Notes | Built in |
| --- | --- | --- | --- |
| settings | key (PK), value | Per-child daily rate (default 25.00), current school year, form signatory names | P0 |
| centers | id, name, barangay, address, is_active | 28 seeded from the MAO list. Unique name | P1 |
| users | id, role, username (unique, case-insensitive), password_hash, full_name, mobile, center_id (null for admin), status (ACTIVE, PENDING, DECLINED, DISABLED), must_change_password, failed_login_count, locked_until, token_version, last_login_at | Parent extras in parent_profiles | P1 |
| parent_profiles | user_id (PK), child_name (optional) |  | P1 |
| students | id, center_id, school_year, last_name, first_name, middle_name, gender (M, F), birthdate DATE, weight_kg, height_cm, parent_guardian_name, enrolled_on DATE, status (ACTIVE, ARCHIVED); optional Child's Record basics: birth_order, number_of_siblings, religion, ethnicity | Age is computed, never stored (BR-01). The optional fields come from the paper's ERD; confirm them against the Figma form (A-17) | P2 |
| conference_notes | id, student_id, note_date DATE, note_time, notes, created_by, deleted_at | One-on-One Conference with the Parent | P2 |
| home_visits | id, student_id, visit_date DATE, observation, parent_info, remarks, created_by, deleted_at | Home Visitation form | P2 |
| child_progress | id, student_id, note_date DATE, progress_notes, created_by, deleted_at | Child's progress entries (the paper's "Create Child's Progress" process) | P2 |
| file_assets | id, storage_key, original_name, mime, size_bytes, sha256, uploaded_by | Files never served statically | P3 |
| reports | id, center_id, teacher_id, type (ACCOMPLISHMENT, ENROLLMENT), period_year, period_month, status (SUBMITTED, NEED_REVISION, APPROVED), current_version | Unique (center_id, type, period_year, period_month). LIQUIDATION type and period range added in P6 | P3 |
| report_versions | id, report_id, version_no, file_id, note, submitted_by, submitted_at |  | P3 |
| report_reviews | id, report_id, version_no, reviewer_id, decision, feedback |  | P3 |
| menu_batches | id, sheet_name, file_name, pr_no, pr_date DATE, period_start, period_end, uploaded_by, source_file_id | One batch per sheet | P4 |
| menu_days | id, batch_id, feeding_date DATE UNIQUE, day_no, day_name, menu_name |  | P4 |
| feeding_assignments | id, center_id, feeding_date, parent_id, assigned_by | Unique (center_id, feeding_date, parent_id) | P5 |
| purchase_requests | id, center_id, feeding_date, menu_day_id, pr_no, status (OPEN, LOCKED, NO_FEEDING), enrolled_count, rate_per_child, budget, locked_at, locked_by | Unique (center_id, feeding_date). Snapshots set on lock | P5 |
| purchase_items | id, purchase_request_id, item_no, description, unit, quantity DECIMAL(10,3), unit_cost DECIMAL(10,2) NULL, filled_by, version | Total = quantity x unit_cost, computed | P5 |
| liquidation_snapshots | id, report_id, version_no, payload (JSON), created_at | Immutable copy of what was submitted. Added to reports in P6 with period_start, period_end | P6 |

## 4.6 Business Rules register

Tasks cite these by ID. If a rule changes, change it here first.

| ID | Rule |
| --- | --- |
| BR-01 | Age is calculated from birthdate in full years as of today (Asia/Manila). The Enrollment summary counts ages 2, 3 and 4 by gender; other ages are accepted with a warning and counted in an "Other" row (A-04) |
| BR-02 | Teachers and Parents only ever see data of their own center. Admin sees all. Enforced in the service layer on every query |
| BR-03 | A Parent sign-up is PENDING. Only the Teacher of the chosen center can approve or decline. PENDING, DECLINED and DISABLED users cannot log in and see a clear message |
| BR-04 | Admin creates Teacher accounts and assigns one center. One active Teacher per center (A-02) |
| BR-05 | Password reset is done by the approver: Admin resets Teacher, Teacher resets Parent. A temporary password is shown once, and the user must change it at next login. No email is sent |
| BR-06 | One report per center, type and month. A Teacher may submit only when none exists or the latest is NEED_REVISION |
| BR-07 | Report status flow: SUBMITTED to APPROVED or NEED_REVISION (Admin only, feedback required for NEED_REVISION). NEED_REVISION to SUBMITTED by Teacher resubmission. APPROVED is final |
| BR-08 | One DSWD file serves all centers. Each sheet is one batch. feeding_date is unique. Replacing overlapping dates needs explicit confirmation and is refused if any Purchase Request exists on those dates |
| BR-09 | Calendar days are date-only strings (YYYY-MM-DD) in Asia/Manila. Never convert them through JS Date or ISO timestamps |
| BR-10 | Daily budget = number of ACTIVE students in the center for the current school year x per-child daily rate (A-03). Computed live while OPEN, snapshotted on lock |
| BR-11 | One Purchase Request per center per feeding day. Items numbered 1 to n. Money uses Decimal. Server computes totals. Rounding is half-up to 2 decimals |
| BR-12 | While a PR is OPEN: the Teacher can add or delete ingredient rows and edit any field; an assigned Parent can edit unit, quantity and unit cost of existing rows only (A-14). LOCKED, NO_FEEDING or submitted PRs are read-only. The Teacher can unlock until the day is part of a submitted liquidation report |
| BR-13 | The Teacher plans assignments weekly (Monday to Sunday). Each feeding day has zero or more APPROVED Parents of the same center. Next week is assigned again |
| BR-14 | A Parent sees only the days they are assigned to (A-06) |
| BR-15 | The Teacher can mark a feeding day NO_FEEDING (A-05). Such days are excluded from budget, the Summary of Disbursement and totals |
| BR-16 | Submitting a liquidation requires every feeding day in the range to be LOCKED or NO_FEEDING. It creates an immutable snapshot, and the days become submitted-locked. NEED_REVISION unlocks those days; APPROVED is final |
| BR-17 | PDFs follow the official layouts. Signature lines are blank except printed names set in Settings (A-10). PR No. comes from the import |
| BR-18 | Summary of Disbursement total = sum of daily PR subtotals; each row shows date, menu, PR No. and amount |
| BR-19 | bcrypt cost 12; login throttled (5 failures lock the account 15 minutes); httpOnly, SameSite=Lax cookie, Secure in production; one generic login error; every route has an explicit role guard and scope. While an account is locked, every login attempt (right or wrong password) returns 429 RATE_LIMITED with "Too many attempts. Try again in 15 minutes." and a `Retry-After` header giving the remaining seconds; the login rate limiter returns the same status, message and header, also for unknown usernames, so existence is never revealed. Pending, declined and disabled messages appear only after correct credentials (DEC-026) |
| BR-20 | Uploads: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10 MB (A-08); extension and magic bytes must both match; random storage names; stored outside the web root; downloaded only through an authorized endpoint |
| BR-21 | Development and test data are fake. No personal data or passwords in logs. Students are archived, not deleted. Real data exists only in production |
| BR-22 | Child's Record entries are soft-deleted (deleted_at). The Teacher of the center creates, edits and deletes them. The Admin has read-only access (A-16). Parents never see them |

## 4.7 Assumptions register (safe defaults so the build is never blocked)

Each default is configurable or isolated so a client answer changes one place. These match Annex A section F.

| ID | Assumption (default used) | Where to change | Open question to client |
| --- | --- | --- | --- |
| A-01 | UI term is "RIC Teacher" | `labels.ts` | RIC Teacher or RIC Worker? |
| A-02 | One active Teacher per center | Validation in teachers service | Can two workers share a center? |
| A-03 | Per-child daily rate is PHP 25.00 (sample: PHP 450 for 18 children) | Settings, Admin screen | Confirm the rate |
| A-04 | Ages outside 2 to 4 accepted with a warning; summary has an "Other" row | Enrollment summary function | Are other ages allowed? |
| A-05 | Weekend items (Nutribun, Nutri Cookie) get a Purchase Request like other days; Teacher can mark NO_FEEDING | Teacher decision per day | Do weekends need a PR? |
| A-06 | A Parent sees only their own assigned days | Calendar service filter | Can parents see others? |
| A-07 | Parent sign-up fields: full name, username, mobile, center, child's name (optional), password | Shared Zod schema | Confirm fields |
| A-08 | Report files: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, max 10 MB | Config | Confirm types and size |
| A-09 | Transmittal Checklist layout is pending a clear copy | Built last in P6 | Send a clear flat copy |
| A-10 | Printed names for Approved by and Noted by are Settings fields, blank by default; Requested/Prepared by is the Teacher | Settings, Admin screen | Who signs? |
| A-11 | Summary of Disbursement period defaults to the calendar month; custom range allowed | Liquidation UI | Confirm period |
| A-12 | Current school year is a Setting; there is no promote or carry-over feature | Settings | How does rollover work? |
| A-13 | No email: password reset by the approver (BR-05) | Auth module | Confirm |
| A-14 | Parents cannot add or delete ingredient rows | PR service | Can parents add extra items? |
| A-15 | Enrollment Form is generated as a PDF; the signed copy is uploaded through Reports (ENROLLMENT) | Reports | Confirm |
| A-16 | Admin has read-only access to Student lists and Child's Records, as the paper's Level 0 diagram shows ("Child's Record Information" goes to the Admin) | Students service | Confirm with the MAO |
| A-17 | Optional Child's Record fields (birth order, number of siblings, religion, ethnicity) are included because the paper's ERD lists them; the Figma form is the final authority on fields | Student schema | Confirm against the Figma form |
| A-18 | The Teacher home page shows a "Today's Feeding" card (the paper's "Check Today's Event" process). The Parent home page is the My Schedule calendar only (Figma PARENT CALENDAR 393:1133), with today highlighted; Parents get no "Today's Feeding" card (DEC-024) | Home pages | None |

## 4.8 API conventions

| Topic | Convention |
| --- | --- |
| Base | `/api`, JSON, cookie auth. Same origin, so no CORS |
| Success | `{ "data": ..., "meta": { ... } }` (meta holds page, pageSize, total) |
| Error | `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ { "field": "birthdate", "message": "..." } ] } }` |
| Status codes | 200 OK, 201 Created, 204 No Content, 400 validation, 401 not logged in, 403 role not allowed, 404 not found (also used when a row belongs to another center), 409 conflict (version, duplicate, wrong state), 413 payload too large (request body or uploaded file), 422 business rule failed, 429 throttled, 500 unexpected, 503 a dependency such as the database is not answering (DEC-020) |
| Error codes | `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `STATE_INVALID`, `PAYLOAD_TOO_LARGE` (413, DEC-014), `RULE_VIOLATION`, `RATE_LIMITED`, `INTERNAL`, `SERVICE_UNAVAILABLE` (503, DEC-020) |
| IDs | Integer auto-increment internally; never expose password hashes, token_version or storage_key |
| Lists | `?page=1&pageSize=20&sort=field:asc&q=search` |
| Dates | `YYYY-MM-DD` for days; ISO 8601 UTC for timestamps. Week parameter is the Monday date |
| Idempotency | PUT, DELETE and state transitions are safe to repeat; a repeated approve returns the current state |

## 4.9 Status machines

| Object | States | Allowed transitions (who) |
| --- | --- | --- |
| User | PENDING, ACTIVE, DECLINED, DISABLED | PENDING to ACTIVE or DECLINED (Teacher); DECLINED to ACTIVE (Teacher); ACTIVE to DISABLED and back (Admin for Teacher, Teacher for Parent) |
| Report | SUBMITTED, NEED_REVISION, APPROVED | SUBMITTED to APPROVED or NEED_REVISION (Admin); NEED_REVISION to SUBMITTED (Teacher) |
| Purchase Request | OPEN, LOCKED, NO_FEEDING | OPEN to LOCKED or NO_FEEDING (Teacher); LOCKED or NO_FEEDING to OPEN (Teacher, unless part of a submitted liquidation) |

## 4.10 From Figma screen to functional spec (template)

The prototype shows how a screen looks. This template adds how it behaves. Fill one per screen before building it, and keep it in docs/UI_MAP.md.

| Field | What to write |
| --- | --- |
| Screen ID and name | e.g. S-P5-03 Purchase Request editor |
| Figma frame | Link or node id |
| Role and route | e.g. Teacher, `/calendar/:date/purchase-request` |
| Purpose | One sentence |
| Data shown | Each field with its API source |
| Actions | Each button or input: what it calls, success behaviour, failure behaviour |
| Validation | Per field: required, type, range, message text |
| States | Loading, empty, error, forbidden, read-only |
| Permissions | Who can see it and who can change it (cite BR-xx) |
| Navigation | Where it comes from and goes to |
| Responsive | What changes under 768 px |
| Acceptance checks | 3 to 6 testable statements |

**Worked example: Purchase Request editor (Teacher).**

| Field | Spec |
| --- | --- |
| Purpose | Teacher lists the ingredients to buy for one feeding day and sees the cost against the budget |
| Data shown | Feeding date and menu name (menu_days); PR No. (menu_batches); status badge; table rows: Item No., Unit, Item Description, Qty, Unit Cost, Total Cost; Sub-total; Budget line "Budget PHP 450.00 = 18 children x PHP 25.00" |
| Actions | "Add ingredient": POST items, new row focused. Edit a cell: PATCH item with version after 600 ms of no typing; row shows Saving, Saved or Failed with Retry. "Delete row": confirm, DELETE. "Lock day": POST lock. "No feeding": confirm, POST no-feeding. "Unlock": POST unlock |
| Validation | Description 1 to 80 characters. Quantity greater than 0, up to 3 decimals. Unit from the fixed list. Unit cost 0 to 100000, 2 decimals. Messages appear under the cell |
| States | Loading skeleton rows; empty table with "No ingredients yet. Add the first item." and the Add button; error panel with Retry; read-only mode with a banner "This day is locked" |
| Permissions | Teacher (own center) edits while OPEN. Assigned Parent edits unit, quantity, unit cost only. Others get 403. Admin read-only |
| Responsive | Under 768 px each row becomes a card with labelled fields; subtotal and budget stay pinned at the bottom |
| Acceptance | Totals equal quantity x unit cost for each row; sub-total equals the sum; exceeding budget shows an amber warning but does not block; two editors changing the same row trigger the conflict message; a locked day cannot be edited from any client |

## 4.11 Target ERD specification (the source for the final ERD)

The final ERD is generated from the real Prisma schema. It must show the entities and relationships below. It must **not** copy the paper's ERD, which has these problems: one `calendar` entity holds menu, ingredients, price, quantity and activity; `enrolledStudents` stores a single `studentList` field instead of one row per student; there is no link between a Parent and the calendar days; Parents have no password or approval status; the report status is stored twice (a column and an entity); reports have no file, month or version; the Child's Record keeps conferences and home visits as single fields although a child has many entries; there is no liquidation structure; and `barangays` replaces the 28 centers.

| Entity | Relationships (cardinality) |
| --- | --- |
| centers | has many users (Teachers and Parents), students, reports, assignments and purchase requests (1 to N each). A center has at most one active Teacher (A-02) |
| users | a Teacher or Parent belongs to one center (N to 1); an Admin belongs to none. A Parent has one parent_profile (1 to 1) |
| students | belongs to one center (N to 1); has many conference_notes, home_visits and child_progress (1 to N each) |
| reports | belongs to one center and one Teacher (N to 1 each); has many report_versions (1 to N) and many report_reviews (1 to N); a LIQUIDATION report has many liquidation_snapshots (1 to N) |
| report_versions | belongs to one report; references one file_asset (N to 1) |
| menu_batches | has many menu_days (1 to N); references the uploaded file_asset |
| menu_days | one row per feeding date (date is unique) |
| feeding_assignments | links one center, one feeding date (menu_day) and one Parent user (N to 1 each) |
| purchase_requests | one per center and feeding date; references one menu_day; has many purchase_items (1 to N); may reference the submitted LIQUIDATION report (N to 1) |
| purchase_items | belongs to one purchase_request |
| settings | key and value pairs, no relationships |

## 4.12 Target DFD specification (the source for the final DFD)

The final DFD is generated from this specification and checked against the real routes. It must **not** copy the paper's DFD, which has these problems: process numbers repeat (4.2 and 5.0 appear twice) and data store IDs repeat for different stores (D3 is both Calendar Data and Report Data; D9 for Calendar Data in the Parent diagram); Student Registration, Parent sign-up, Parent approval, Admin account management, the DSWD file upload, the dashboard and the submission of the liquidation report are missing; "Admin Feedback" is drawn inside the Teacher diagram; the Admin diagram has no flow for approving or returning a report with a status decision.

**External entities:** Administrator (MAO), RIC Teacher, Parent.

**Data stores:** D1 Users and Accounts; D2 Centers; D3 Student Records; D4 Child's Records; D5 Reports (files, versions, reviews); D6 Menu Schedule (DSWD batches and days); D7 Feeding Assignments; D8 Purchase Requests and Items; D9 Liquidation Submissions (snapshots); D10 Settings.

**Level 0 (context) flows.**

| Entity | Sends to the system | Receives from the system |
| --- | --- | --- |
| Administrator | Login details; center and Teacher account details; DSWD food rotation file; report decision and feedback; per-child rate and signatory settings | Login result; dashboard summary (RIC Teacher count, enrolled students, report counts); submitted reports; student and Child's Record information; calendar and liquidation information |
| RIC Teacher | Login details; Parent approval decisions; student details; Child's Record entries; report files and revisions; Parent assignments; ingredient list; purchase entries; lock or no-feeding choice; liquidation submission | Login result; pending Parent requests; student list and age summary; Enrollment Form PDF; report status and feedback; calendar and today's menu; budget and totals; liquidation forms PDF; submission status |
| Parent | Sign-up details; login details; purchase entries (unit, quantity, unit cost) | Approval status; assigned schedule with menu and ingredients; totals |

**Level 1 processes (each process number is unique; each store ID means one store).**

| Process | Sub-processes | Reads and writes |
| --- | --- | --- |
| 1.0 Authenticate and manage accounts | 1.1 Log in; 1.2 Sign up as Parent; 1.3 Approve or decline Parent; 1.4 Manage centers and Teacher accounts; 1.5 Change or reset password | D1, D2 |
| 2.0 Manage students | 2.1 Register or update student; 2.2 Archive student and view previous year; 2.3 Record One-on-One Conference, Home Visitation and Progress; 2.4 Generate Enrollment Form | D3, D4, D10 |
| 3.0 Manage reports | 3.1 Submit report file; 3.2 Review report (status and feedback); 3.3 Revise and resubmit; 3.4 View status and history | D5 |
| 4.0 Manage feeding calendar | 4.1 Import DSWD file; 4.2 View calendar and today's menu; 4.3 Assign Parents weekly | D6, D7 |
| 5.0 Manage purchase requests and liquidation | 5.1 Enter ingredients to buy; 5.2 Enter purchase details; 5.3 Lock day or mark no feeding; 5.4 Generate liquidation forms; 5.5 Submit liquidation report | D8, D9, D5, D10 |
| 6.0 Monitor | 6.1 View dashboard summary; 6.2 View centers and Teachers | D1, D2, D3, D5 |
| 7.0 Maintain settings | 7.1 Set per-child daily rate and form signatory names; 7.2 Set current school year | D10 |

Each Level 1 diagram shows one external entity's view, uses only these process and store IDs, and shows no flow directly between two data stores.
