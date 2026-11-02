# 5. Build Phases

Each phase follows the same layout: summary, Build, Do NOT build, Figma screens, data, API, tasks, details, tests and gate additions. The task tables are written so that one row can be used directly as a task prompt.

> **Order of work inside every phase**
>
> Data and rules first, then tests, then API, then static screens from Figma, then wiring, then polish, then the gate. Never leave a phase with half-wired screens.

## Phase 2: Student Registration and Child's Record

| Item | Value |
| --- | --- |
| Goal | Teachers keep their center's student list and Child's Record, and generate the official Enrollment Form PDF |
| Depends on | Phase 1 gate |
| Branch and tag | `phase-2-students`, tag `v0.2.0` |
| Rules | BR-01, BR-02, BR-21, BR-22, A-04, A-12, A-16 |

**Build:** students CRUD with search and archive, school years and the read-only previous year list, One-on-One Conference notes, Home Visitation records, Enrollment Form PDF with the age summary, Admin read-only student overview, a Settings page with the current school year.

**Do NOT build:** reports and uploads, the calendar, feeding, budget (which needs the student count later), dashboard cards, promote or carry-over of students to the next school year, any write access for the Admin to the Child's Record.

**Figma screens to read:** Student list, Add and Edit student, Student profile with tabs (Profile, One-on-One Conferences, Home Visits, Progress), Enrollment Form dialog, Admin: students by center, Settings.

**Data:** `students`, `conference_notes`, `home_visits`, `child_progress` (4.5). Settings key `currentSchoolYear` becomes editable by the Admin.

| Method and path | Role | Purpose |
| --- | --- | --- |
| GET /api/students | Teacher (own), Admin (any) | Filters: schoolYear, q, gender, status, centerId (Admin), pagination |
| POST /api/students | Teacher | Create in the current school year |
| GET, PATCH /api/students/:id | Teacher (own); Admin read | View, edit (not allowed in previous school years) |
| POST /api/students/:id/archive, /restore | Teacher | Status change |
| GET, POST /api/students/:id/conferences | GET: Teacher (own), Admin. POST: Teacher | List and create notes |
| PATCH, DELETE /api/conferences/:id | Teacher | Edit and soft delete |
| GET, POST /api/students/:id/progress | GET: Teacher (own), Admin. POST: Teacher | List and create progress entries |
| PATCH, DELETE /api/progress/:id | Teacher | Edit and soft delete |
| GET, POST /api/students/:id/home-visits | GET: Teacher (own), Admin. POST: Teacher | List and create |
| PATCH, DELETE /api/home-visits/:id | Teacher | Edit and soft delete |
| GET /api/students/summary | Teacher, Admin | Counts by age and gender for a school year |
| GET /api/enrollment-form.pdf | Teacher, Admin | Query: schoolYear, dateStarted, centerId (Admin). Streams a PDF |
| GET, PATCH /api/settings/school-year | Admin | Current school year |

| ID | Task | Files | Done when |
| --- | --- | --- | --- |
| P2-T01 | Shared Zod schemas: student, conference note, home visit, enrollment query | shared/src | Used by both sides |
| P2-T02 | Prisma models `students`, `conference_notes`, `home_visits`, `child_progress` with indexes (center_id, school_year, status) and migrate | schema.prisma | Migration applies |
| P2-T03 | `computeAge(birthdate, today)` pure function in Asia/Manila with `ageBucket`; unit tests | modules/students/age.ts | Tests: birthday today, day before, 29 February, year end, future date rejected |
| P2-T04 | Students service and repository: list (scoped, search by name, filters, sort, pagination), create, update, archive, restore, duplicate check | modules/students | Duplicate (same name and birthdate in center and year) returns 409; previous school year rows are read-only (422) |
| P2-T05 | Students routes and controllers with guards; permission matrix entries | students routes | Matrix test green |
| P2-T06 | Summary function: count by age bucket (2, 3, 4, Other) and gender | students service | Matches a hand-counted fixture of 18 children |
| P2-T07 | Child's Record services: conference notes, home visits and progress entries (create, list newest first, edit, soft delete). Teacher of the center writes; Admin reads only | modules/child-records | Admin write returns 403 and Admin read works; another center's Teacher gets 404 |
| P2-T08 | Settings: current school year GET and PATCH (Admin); helper `getCurrentSchoolYear()` | modules/settings | Teacher create uses it; format validated `YYYY-YYYY` |
| P2-T09 | PDF base: pdfmake setup, font embedding, a `pdf/` helper with page header, table helper and concurrency limit | modules/pdf | A test PDF renders with the peso sign or the "PHP" fallback decided |
| P2-T10 | Enrollment Form PDF: header texts, center name, barangay, date started, number of enrollees, 30-row table, blank rows, repeat on extra pages, summary table, signature lines (Punong Barangay, and worker title from labels) | modules/pdf/enrollment-form.ts | Visually matches the official form photo; 18 students and 45 students both paginate correctly |
| P2-T11 | Frontend student list: table, search, school year select, status filter, pagination, read-only banner for previous years, empty state | features/students | Matches Figma; keyboard accessible |
| P2-T12 | Frontend add and edit student form with all validation messages and the age preview | features/students | All validation rules below pass; busy state on save |
| P2-T13 | Frontend student profile with tabs; conference notes and home visit lists and forms (add, edit, delete with confirm) | features/students | Entries appear newest first; delete asks for confirmation |
| P2-T14 | Frontend Enrollment Form dialog (school year, date started) that opens the PDF; Admin students-by-center page (center select, read-only table and counts, and a read-only view of a student's Child's Record) and Settings page for the school year | features/students, features/settings | PDF opens; Admin sees counts and the read-only Child's Record |
| P2-T15 | Polish and gate | all | Gate checklist ticked |

**Student field rules.** Last name and first name 1 to 60 characters (letters, spaces, dot, hyphen, apostrophe, accents); middle name optional; gender M or F; optional birth order (1 to 20), number of siblings (0 to 20), religion and ethnicity (up to 40 characters each); birthdate in the past, age 0 to 10 (outside 2 to 4 shows a warning, A-04); weight 3 to 40 kg (2 decimals); height 40 to 140 cm (1 decimal); parent or guardian name 2 to 100 characters; enrolled_on defaults to today.

**Enrollment Form layout (from the official form).** Header: Republic of the Philippines, Province of Camarines Sur, Municipality of Libmanan; title ENROLLMENT FORM. Left block: Name of Center, Barangay. Right block: Date Started, No. of Enrollees. Table columns: NO., NAME (Last, First M.), GENDER M/F, BIRTHDATE mm/dd/year, AGE, WEIGHT, HEIGHT, PARENT/GUARDIAN; 30 rows per page. Below: summary table with rows 2 yrs old, 3 yrs old, 4 yrs old and columns Male, Female, plus a Total row. Signature lines at the bottom: Child Development Worker (printed name filled from the Teacher) and Punong Barangay (blank). Keep the form text exactly as shown on the official copy.

**Edge cases to test:** names with ñ and apostrophes; the same child in two school years; archived students excluded from the summary; a center with 0 students; 31 students (second page); a Teacher changing the school year filter back and forth.

**Tests required:** age function, summary counts, scoping, duplicate rule, read-only previous year, soft delete ownership, PDF smoke test (starts with %PDF, page count for 18 and 45 students).

**Gate additions:** a human compares the generated PDF with the photo of the official form and signs off in PHASE_LOG.md.
