# Open questions for the clients

Questions the Developer should ask the clients (the RIC capstone authors and the MAO). Written in Plan 5
J5 (2026-11-18). Each has the default the build uses until there is an answer, so nothing is blocked.
Changes they already need to make in their paper are in docs/PAPER_CHANGES.md; the full comparison with
Annex A is docs/ANNEX_A_CHANGES.md. Technical questions for the Developer alone (Objective 3) stay in
docs/OBJ3_PLAN.md section 11.

## Accounts and security

| # | Question | Default used now | Source |
| --- | --- | --- | --- |
| OQ-01 | Is one shared default password for resets acceptable, or should each reset give a one-time password shown once to the approver? | The shared default password, changed at next login | AUD-011, D6 |
| OQ-02 | Anyone who knows a username can keep that account locked by typing wrong passwords (5 tries lock it 15 minutes). Is that accepted? | Accepted; the approver can clear the lock with a reset | AUD-024, BR-19 |
| OQ-03 | "RIC Teacher" or "RIC Worker" in the screens? | RIC Teacher | A-01 |
| OQ-04 | Can two Teachers share one center? | No, one active Teacher per center | A-02 |
| OQ-05 | Are the Parent sign-up fields right (full name, username, mobile, center, child's name optional, password)? | As listed | A-07 |

## Students

| # | Question | Default used now | Source |
| --- | --- | --- | --- |
| OQ-06 | Are children outside ages 2 to 4 allowed? | Accepted with a warning; the summary has an "Other" row | A-04 |
| OQ-07 | Is the field list of the student form right, including the extra Figma fields? | docs/ui-specs/student-form.md | A-17, D9 |
| OQ-08 | What is the Student ID rule (Figma shows "RIC 25-001")? | A display code from the school year and row number, not stored | DEC-039 |
| OQ-09 | How does the school year roll over? | The Admin sets the current school year (J3 b); no automatic promotion | A-12 |
| OQ-10 | Should the Admin see student lists and Child's Records? | Yes, read-only | A-16 |

## Feeding program and liquidation

| # | Question | Default used now | Source |
| --- | --- | --- | --- |
| OQ-11 | What is the per-child daily rate? | PHP 25.00 (PHP 450 for 18 children) | A-03 |
| OQ-12 | Do weekend items (Nutribun, Nutri Cookie) need a Purchase Request? | Yes; the Teacher can mark a day No feeding | A-05 |
| OQ-13 | Is a team of at most 4 Parents per week right? | 4 | D4 |
| OQ-14 | May Parents add rows, change descriptions and delete rows they added? | Yes, on their assigned open days | D3 |
| OQ-15 | May Parents see the whole center calendar with the names of the assigned Parents? | Yes; details only on their own days | D2 |
| OQ-16 | May a day with no rows, or with rows missing quantity or cost, be locked and submitted? | Yes; the Teacher decides | AUD-027 |
| OQ-17 | Who signs the forms (Approved by, Noted by), with which titles? | Blank lines; the Admin will set them in System settings (J3 b) | A-10 |
| OQ-18 | Is the Summary of Disbursement period the calendar month? | The month, with a custom range allowed | A-11 |
| OQ-19 | Please send a clear, flat copy of the Transmittal Checklist | A placeholder page | A-09 |
| OQ-20 | Will the DSWD menu always come as `.xlsx`? | `.xlsx` only; `.xls` must be saved as `.xlsx` first | DEC-045 |

## Reports (Objective 3, before it starts)

| # | Question | Default used now | Source |
| --- | --- | --- | --- |
| OQ-21 | Which file types and size are allowed for report uploads? | PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 10 MB | A-08 |
| OQ-22 | Is the Enrollment Form PDF, signed and uploaded as the Enrollment report, the right flow? | Yes | A-15 |
| OQ-23 | The Figma report screens show statuses and filters beyond Submitted, Need Revision and Approved. Which ones are wanted? | Only the three statuses (BR-07) | OBJ3_PLAN risks |
| OQ-24 | Is virus scanning of uploaded files expected? | No; stated in the manual | OBJ3_PLAN Q4 |

## Screens

| # | Question | Default used now | Source |
| --- | --- | --- | --- |
| OQ-25 | Are numeric dates (MM/DD/YYYY) acceptable where Figma shows long dates? | Numeric, long dates only in headings | D7 |
| OQ-26 | Do you approve the screens designed without a Figma frame (Parent sign-up, Request sent, the Parent day panel, Admin Enrolled Students, RIC Teacher Profile)? | As built | DEC-025, docs/UI_MAP.md |
| OQ-27 | Is the Teacher home without a separate "Today's Feeding" card acceptable (the calendar marks today)? | As in the Figma RIC dashboard | A-18, DEC-053 |
