# Data Model

Tables and columns that exist now, with a Mermaid erDiagram of the current schema.

Source of truth: `server/prisma/schema.prisma`. Migrations: `server/prisma/migrations` (created with `prisma migrate dev`, never by hand).

## Whole schema (Plan 5 J5, 2026-11-18)

Drawn from `server/prisma/schema.prisma` after the last migration
(`20261108073559_polish3_login_events`). 18 tables. Only keys and the columns the rules depend on are
shown; every table also has `created_at` and most have `updated_at`. Dates of the calendar are DATE,
money is DECIMAL, ids are INT. Soft delete (BR-22) is `deleted_at` on the three Child's Record tables.
This is the working diagram, not the final ERD of Phase 8.

```mermaid
erDiagram
  centers ||--o{ users : "has"
  centers ||--o{ students : "enrolls"
  centers ||--o{ feeding_assignments : "has"
  centers ||--o{ week_team_members : "has"
  centers ||--o{ purchase_requests : "has"
  centers ||--o{ reports : "has"
  users ||--o{ login_events : "logs in"
  users ||--o| parent_profiles : "Parent extra"
  users ||--o{ feeding_assignments : "assigned Parent"
  users ||--o{ week_team_members : "team Parent"
  users ||--o{ reports : "Teacher submits"
  students ||--o{ conference_notes : "has"
  students ||--o{ home_visits : "has"
  students ||--o{ child_progress : "has"
  menu_batches ||--o{ menu_days : "imports"
  menu_days ||--o{ purchase_requests : "menu of the day"
  purchase_requests ||--o{ purchase_items : "rows"
  reports |o--o{ purchase_requests : "submitted days"
  reports ||--o{ report_reviews : "reviews"
  reports ||--o{ liquidation_snapshots : "versions"

  settings {
    varchar key PK
    text value
  }
  centers {
    int id PK
    varchar name UK
    boolean is_active
  }
  users {
    int id PK
    enum role "ADMIN TEACHER PARENT"
    varchar username UK
    int center_id FK
    enum status "ACTIVE PENDING DECLINED DISABLED"
    boolean must_change_password
    int failed_login_count
    datetime locked_until
    int token_version
  }
  login_events {
    int id PK
    int user_id FK
    datetime created_at
  }
  parent_profiles {
    int user_id PK, FK
    varchar child_name
  }
  students {
    int id PK
    int center_id FK
    varchar school_year
    varchar last_name
    varchar first_name
    date birthdate
    decimal weight_kg
    decimal height_cm
    enum status "ACTIVE ARCHIVED"
    text profile_extra
  }
  conference_notes {
    int id PK
    int student_id FK
    date note_date
    datetime deleted_at
  }
  home_visits {
    int id PK
    int student_id FK
    date visit_date
    datetime deleted_at
  }
  child_progress {
    int id PK
    int student_id FK
    date note_date
    datetime deleted_at
  }
  menu_batches {
    int id PK
    varchar pr_no
    date period_start
    date period_end
    int uploaded_by
  }
  menu_days {
    int id PK
    int batch_id FK
    date feeding_date
    varchar menu_name
  }
  feeding_assignments {
    int id PK
    int center_id FK
    date feeding_date
    int parent_id FK
  }
  week_team_members {
    int id PK
    int center_id FK
    date week_start
    int parent_id FK
  }
  purchase_requests {
    int id PK
    int center_id FK
    date feeding_date
    int menu_day_id FK
    enum status "OPEN LOCKED NO_FEEDING"
    decimal rate_per_child
    decimal budget
    int submitted_report_id FK
  }
  purchase_items {
    int id PK
    int purchase_request_id FK
    int item_no
    decimal quantity
    decimal unit_cost
    int created_by
    int version
  }
  reports {
    int id PK
    int center_id FK
    int teacher_id FK
    enum type "LIQUIDATION ENROLLMENT ACCOMPLISHMENT"
    date period_start
    date period_end
    enum status "SUBMITTED NEED_REVISION APPROVED"
    int current_version
  }
  report_reviews {
    int id PK
    int report_id FK
    int version_no
    enum decision "APPROVED NEED_REVISION"
    text feedback
  }
  liquidation_snapshots {
    int id PK
    int report_id FK
    int version_no
    json payload
  }
```

Unique keys besides the primary keys: `centers.name`, `users.username` (stored in lowercase),
`students (center_id, school_year, last_name, first_name, birthdate)`,
`feeding_assignments (center_id, feeding_date, parent_id)`,
`week_team_members (center_id, week_start, parent_id)`, `purchase_requests (center_id, feeding_date)`,
`liquidation_snapshots (report_id, version_no)`. A Purchase Request that does not exist yet is shown
as NOT_OPENED by the API; it is not a stored status.

## settings

Key and value pairs (blueprint 4.5). No relationships and no foreign keys.

| Column | Type | Notes |
| --- | --- | --- |
| key | VARCHAR(64), primary key | Setting name |
| value | TEXT, not null | Always a string. Numbers such as the rate are stored as text and read as Decimal where they are used (P5) |
| created_at | DATETIME(3) | Default now |
| updated_at | DATETIME(3) | Set by Prisma on every update |

Seeded defaults (`npm run db:seed`, idempotent; an existing value is never overwritten):

| key | value |
| --- | --- |
| perChildDailyRate | "25.00" (A-03) |
| currentSchoolYear | "2026-2027" (default; to be confirmed with the clients) |

```mermaid
erDiagram
  settings {
    varchar_64 key PK
    text value
    datetime created_at
    datetime updated_at
  }
```

## Sprint S1: centers, users, parent_profiles

Migration `20261106120950_auth_centers_users`.

| Table | Columns | Notes |
| --- | --- | --- |
| centers | id, name (unique), barangay, address, is_active, created_at, updated_at | 28 seeded from docs/seed-centers.md |
| users | id, role (ADMIN, TEACHER, PARENT), username (unique, stored lowercase), password_hash, full_name, mobile, center_id, status (ACTIVE, PENDING, DECLINED, DISABLED), must_change_password, failed_login_count, locked_until, token_version, last_login_at, password_changed_at (nullable), created_at, updated_at | Index (center_id, role, status). center_id is null for the Admin |
| login_events | id, user_id, created_at | One row per successful login (Plan 3 D7). Index (user_id, created_at). Deleted with the user |
| parent_profiles | user_id (PK), child_name, created_at, updated_at | Deleted with the user |

## Sprint S2: students and Child's Record

Migration `20261106133914_students_child_records`.

| Table | Columns | Notes |
| --- | --- | --- |
| students | id, center_id, school_year, last_name, first_name, middle_name, gender (M, F), birthdate DATE, weight_kg DECIMAL(5,2), height_cm DECIMAL(5,1), parent_guardian_name, enrolled_on DATE, status (ACTIVE, ARCHIVED), birth_order, number_of_siblings, religion, ethnicity, created_at, updated_at | Unique (center_id, school_year, last_name, first_name, birthdate). Index (center_id, school_year, status). No age column |
| conference_notes | id, student_id, note_date DATE, note_time, notes, created_by, deleted_at, created_at, updated_at | Soft delete |
| home_visits | id, student_id, visit_date DATE, observation, parent_info, remarks, created_by, deleted_at, created_at, updated_at | Soft delete |
| child_progress | id, student_id, note_date DATE, progress_notes, created_by, deleted_at, created_at, updated_at | Soft delete. API only in the sprint |

## Sprint S3: menu

Migration `20261106141444_menu_batches_days`. The uploaded file is not stored.

| Table | Columns | Notes |
| --- | --- | --- |
| menu_batches | id, sheet_name, file_name, pr_no, pr_date DATE, period_start DATE, period_end DATE, uploaded_by, created_at, updated_at | One batch per sheet |
| menu_days | id, batch_id, feeding_date DATE (unique), day_no, day_name, menu_name, created_at, updated_at | The name is stored as in the file; the screen formats it |

## Sprint S4: assignments and Purchase Requests

Migration `20261106142715_assignments_purchase_requests`.

| Table | Columns | Notes |
| --- | --- | --- |
| feeding_assignments | id, center_id, feeding_date DATE, parent_id, assigned_by, created_at, updated_at | Unique (center_id, feeding_date, parent_id) |
| purchase_requests | id, center_id, feeding_date DATE, menu_day_id, pr_no, status (OPEN, LOCKED, NO_FEEDING), enrolled_count, rate_per_child DECIMAL(10,2), budget DECIMAL(12,2), locked_at, locked_by, created_at, updated_at | Unique (center_id, feeding_date). The budget fields are the snapshot set on lock (BR-10) and are null otherwise |
| purchase_items | id, purchase_request_id, item_no, description, unit, quantity DECIMAL(10,3), unit_cost DECIMAL(10,2), filled_by, version, created_at, updated_at | Totals are computed, never stored. `version` guards against stale edits |

## Sprint S5: reports and liquidation

Migration `20261106152044_reports_liquidation`. Additive. `report_versions` and `file_assets` are skipped (sprint plan).

| Table | Columns | Notes |
| --- | --- | --- |
| reports | id, center_id, teacher_id, type (LIQUIDATION), period_start DATE, period_end DATE, status (SUBMITTED, NEED_REVISION, APPROVED), current_version, submitted_at, created_at, updated_at | Index (center_id, period_start) |
| report_reviews | id, report_id, version_no, reviewer_id, decision, feedback, created_at, updated_at | One per decision |
| liquidation_snapshots | id, report_id, version_no, payload JSON, created_at | Unique (report_id, version_no). Immutable: never updated |
| purchase_requests (added) | submitted_report_id | Set on submit; cleared on Need Revision |

## Demo polish (F2)

- `purchase_items.created_by` INT NULL: who added the row (D3). Null on older rows.
- `week_team_members`: id, center_id (FK centers), week_start DATE (a Monday), parent_id (FK users), assigned_by, created_at. Unique (center_id, week_start, parent_id). The team of at most 4 parents for one week (D4); the limit is enforced in the service.

## Demo polish (F3)

- `students.profile_extra` TEXT NULL: the extra fields of the Figma form as JSON text, validated with `profileExtraSchema` on the way in and out (D9). Not the Json type (polish plan, section 3). Mapping: docs/ui-specs/student-form.md.

## Polish Round 2 (G2)

Migration `20261107162151_polish2_report_types_profile_fields`, additive.

- `ReportType` gains ENROLLMENT and ACCOMPLISHMENT. Nothing creates them before Objective 3.
- `users` gains nullable `email` (120), `address` (255), `position` (120), `sex` (10), `birth_date` (DATE) and `qualification` (160). Each user edits their own.
