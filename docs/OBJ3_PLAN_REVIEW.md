# Review of docs/OBJ3_PLAN.md (as an attacker and as a tester)

Written 2026-11-16 in Plan 5, stage J1d. One pass over the plan as it stands at v0.9.8-demo. The plan
itself is not changed by this review; the Developer decides which points go into it. Nothing here was
run: every point comes from reading the plan and the current code.

How to read the tables: "Plan" says where the plan touches the point (section or task) or "nothing" when
it is silent. Weight: A = decide before any Objective 3 code; B = add to a task; C = note for the manual
or the client.

## 1. Summary

- The plan covers the main upload risks (size, type by content, random names, scoped download, no static
  route, no orphan file on a failed transaction).
- The biggest open risk is not a security one: **storage is designed before anyone has checked that the
  host keeps files** (R-01). If Hostinger's disk is not kept across deployments, sections 3 and 6 change.
- The biggest functional gap: **one file per report** (R-02). A paper report photographed with a phone is
  several images.
- As an attacker I would try, in this order: fill the disk (G-01), send a file that passes the checks but
  is something else (G-03 to G-06), and abuse the file name (G-09, G-10). None of these gives access to
  another center's data; they cost availability or put a harmful file in front of the Admin.
- There is no way to remove a file that was uploaded by mistake (G-13). With children's personal data in
  Enrollment Forms this needs a decision.
- 31 tests the plan does not name are listed in section 4.

## 2. Gaps seen as an attacker

| Id | Gap | Plan | What can happen | Suggested answer | Weight |
| --- | --- | --- | --- | --- | --- |
| G-01 | No limit on how much one Teacher or center can store | Section 6 item 7 has a rate limit only; section 4 allows "any month up to the current one" with no earliest month | A logged-in Teacher uploads 10 MB for both types for every month back to any year: 240 MB per year of history, without end. One stolen Teacher account can fill the disk and stop uploads for all 28 centers | An earliest allowed month (for example the start of the current school year, or the date the center was created); a size quota per center; refuse uploads when free space is under a set amount, with a clear 503 | A |
| G-02 | Multipart limits other than file size are not set | Section 6 item 1: size, one file, one field | multer's defaults allow unlimited text fields of 1 MB each; many large fields use memory before any check runs | Set `fields`, `fieldSize`, `parts` and `headerPairs` limits; test with 1000 fields | B |
| G-03 | The stored `mime` has no stated source | Section 3 lists the column; section 6 item 3 says the browser's type is not used for the decision | If the browser's value is stored and later sent as `Content-Type` on download, a Teacher chooses the type the Admin's browser sees | Store the type derived from the content check; on download send that, or `application/octet-stream`, never a client value | B |
| G-04 | DOC and XLS are accepted on the 8-byte OLE signature alone | Section 6 item 3 | Any OLE file passes as .doc or .xls: an installer (.msi), a message file, a macro workbook | Accept the risk and say so, or drop DOC and XLS (ask the client, Q6), or read the OLE directory for the `WordDocument` or `Workbook` stream | A |
| G-05 | Macro files and active PDFs | Section 6 item 7 and risk row "Office files with macros" | A .docm renamed .docx still holds `word/document.xml` and passes; a PDF can hold scripts and launch actions. The Admin opens it on the office computer | Refuse archives that contain `vbaProject.bin`; tell the Admin in the manual to open files in Protected View; decide on scanning (Q4) | B |
| G-06 | Reading the ZIP to find one entry | Section 6 item 3; Q1 default "exceljs's ZIP reader is already installed" | A 10 MB archive can expand to gigabytes if entries are inflated to look inside; exceljs's reader is a dependency of a dependency, not ours to import | Read only the central directory (names, no inflating); declare whatever package is used in package.json, which needs the Developer's approval | A |
| G-07 | PDF signature position | Section 6 item 3: "the first bytes" | The PDF format allows the header within the first 1024 bytes; some scanners write bytes before it. A strict check refuses real scans; a loose one accepts files that start as something else | Decide strict (offset 0) and test with files from the clients' real scanner and phones before fixing the rule | B |
| G-08 | Order of the guards and the body | Nothing | If the upload middleware runs before authenticate and requireRole, anyone can make the server receive 10 MB | State and test: authenticate, requireRole, rate limit, then multer. An anonymous upload is refused before the body is read | B |
| G-09 | Characters in the original name used for display | Section 6 item 4 cleans the name for the header only | A name with a right-to-left override shows as `report‮fdp.exe`-style text in the Admin's list; very long names break layouts | Remove control and bidirectional characters before storing; show the type from the content check next to the name | B |
| G-10 | Windows names | Section 6 item 4 | Names such as `CON.pdf`, a trailing dot or space, or a colon are harmless on disk (the stored name is a UUID) but can fail or misbehave when the Admin saves the download on Windows | Clean these in the download name; test | C |
| G-11 | `UPLOAD_DIR` is trusted as given | Section 3 | A wrong value (inside `client/dist`, a relative path, a folder that does not exist) makes files public or uploads fail at the first use | Check at startup: absolute, exists, writable, not inside the client folder; refuse to start otherwise, like the env checks | B |
| G-12 | No check that the file on disk is the one that was uploaded | Section 3 stores `sha256` and never uses it | A file changed or swapped on the host is served as the Teacher's submission | Compare the hash when streaming (or in a periodic check) and answer with a clear error | C |
| G-13 | No removal of a wrong upload | Q2 covers replacing before review; nothing covers removal | A file with another center's children, or a private document, stays downloadable by the Teacher and the Admin for good, also after Need Revision (old versions are kept) | Decide: an Admin action that removes the file of one version and keeps the row with "removed by the Admin on <date>"; or state that files are never removed | A |
| G-14 | No record of who downloaded a file | Nothing | Enrollment Forms hold children's names and birthdates; there is no way to answer "who opened this" | A small download log (file id, user id, time), no names | C |
| G-15 | Files on a shared host are stored as they are | Section 3 | Anyone with access to the hosting account reads them | File permissions for the folder (owner only); say in the manual who has hosting access. Encryption is beyond Annex A | C |
| G-16 | Cross-site upload | Nothing | Multipart is a "simple" request type that browsers send without a preflight. Only SameSite=Lax on the cookie stops another site from posting a file as a logged-in Teacher | Also check the `Origin` header on the upload routes, or require a custom header that a plain form cannot send | B |
| G-17 | Slow uploads | Nothing | Many connections that send a body very slowly hold the server's connections | Set the Node server's request and header timeouts; the rate limit per user | C |
| G-18 | The rate limit is per address | Section 6 item 7 | Behind a proxy all users share an address (see AUD-016 and docs/DEPLOY.md); a limit per address then limits everyone or no one | Key the upload limit by user id | B |
| G-19 | Photo data | Nothing | A phone photo carries the place and time it was taken | Tell the client; stripping it needs an image library, which is a new dependency | C |
| G-20 | Temporary files after a crash | Section 6 item 5 handles a failed transaction, not a stopped process | Files stay in `<UPLOAD_DIR>/tmp`, and a file moved just before a crash has no row | On start, delete files in `tmp` older than an hour; a check script that lists files with no row and rows with no file | B |

## 3. Risky assumptions

| Id | Assumption in the plan | Why it is risky | Suggested answer | Weight |
| --- | --- | --- | --- | --- |
| R-01 | A folder on the host is kept across deployments and has enough space (section 3, risk row 1, Q3 "ask at the deployment phase") | Everything about storage rests on it, and it is checked last. If the answer is no, the choices are files in the database (TiDB's free plan is small) or an outside file store (not in the agreement) | Check it first: a half-hour trial on the host, or a written answer from Hostinger support, before O3-T02 | A |
| R-02 | One file per report version (sections 3 and 5) | A printed report photographed with a phone is several JPG files; a Teacher without a scanner cannot make one PDF | Ask the client how Teachers will produce the file. Either several files per version (one more table row per file) or "PDF only for more than one page", stated in the screen | A |
| R-03 | 12 to 15 working days (section 10) | The estimate comes from reading, the Figma frames for these screens were never opened (78:268, 78:276, 78:284), and "RIC 4 78:276" as Admin Feedback is a guess | Read the three frames (6 Figma calls) before fixing the estimate | A |
| R-04 | Moving routes between modules changes no behaviour (O3-T05, 1.5 days) | It touches every report route that the demo uses; the service and repository are shared with liquidation submit | Do it as its own commit and gate, with the whole db project run before and after | B |
| R-05 | A unique index on (center, type, period start) also fits liquidation reports (section 3) | It is true only if no two existing reports share those three values. The local database has demo and practice data; TiDB was never looked at | The count query in O3-T02 runs on both databases before the migration is written, not after | B |
| R-06 | The row lock as fallback for BR-06 (section 3, way 2) | The same kind of lock was used for AUD-003 and AUD-006 and ran only on MariaDB; TiDB's locking differs in details | Run the concurrent tests against TiDB once before go-live (the Developer, DEC-016) | B |
| R-07 | `reports.teacher_id` stays the uploader (section 2) | After AUD-021 the Teacher Profile shows only reports of the Teacher's current center. If a Teacher is replaced, who may resubmit a returned report: the new Teacher of the center (by center scope, yes), and whose name shows as submitter of version 2? | `report_versions.submitted_by` already answers the second part; say in the plan that the center's current Teacher resubmits | B |
| R-08 | The host passes a 10 MB body through (nothing in the plan) | Proxies in front of Node often stop bodies at 1 MB and answer with their own HTML page. The client's `lib/api.ts` reads that as "Cannot reach the server" | Check the limit on the host with R-01; make the client show a size message for a 413 that is not ours | B |
| R-09 | The Teacher notices a returned report (no notifications, by agreement) | With monthly reports a Need Revision can sit unseen | Already in scope as the Home card and Admin Feedback; make the count of returned reports visible on Home for all types (O3-T10 says so; keep it) | C |
| R-10 | "The audit items AUD-005, AUD-006, AUD-015 and AUD-019 are done in J4 first" (risk row 8) | They are now fixed in J1d, and J1d also added a login limiter that the plan expects from J4 | Update the plan's risk row and section 6 item 7 when the plan is next edited | C |
| R-11 | Password-protected Office files | A protected .docx is an OLE file, not a ZIP: the content check refuses it with "wrong type" | Decide: refuse with a message that says why, and say it in the drop zone text | C |

## 4. Tests the plan does not name

Each line is one test or one small group. "Task" is where it would go.

### Upload and storage (O3-T03)

1. A file of exactly 10 MB is accepted; 10 MB plus 1 byte answers 413.
2. A 1-byte file and a file that holds only its signature are refused or accepted by a stated rule.
3. Upper-case and mixed-case extensions (`.PDF`, `.Docx`).
4. No extension, only an extension (`.pdf`), a trailing dot or space, a 255-character and a 256-character name.
5. A name with quotes, a semicolon, a line break, a path (`..\..\x.pdf`), a null byte, emoji, and a right-to-left override: stored text and the download header are both checked.
6. Cross types: an .xlsx archive named .docx and the reverse; a PDF named .jpg; a PNG named .jpg.
7. A .docm (with `vbaProject.bin`) named .docx (G-05), once the rule is decided.
8. An archive with a very large declared size: the check does not inflate it (G-06); memory is measured.
9. A password-protected .docx (R-11).
10. Real files: at least one scan and one phone photo from the clients' own devices, and one file each made by Word, Excel, LibreOffice and Google Docs export.
11. The client stops sending half-way: no file is left in `tmp`, no row is written.
12. The disk is full or the folder is read-only: the answer is a clear 503, not 500, and nothing is half written.
13. `tmp` and the final folder on different drives: the move still works or fails cleanly.
14. `UPLOAD_DIR` missing, relative, or inside the client folder: the server refuses to start (G-11).
15. 1000 text fields, and a 5 MB `note` field (G-02).
16. An upload with no login is refused before the body is read (G-08): the time and the bytes read are checked.

### Rules and concurrency (O3-T04, O3-T05)

17. The month rule at the edge: 23:59 and 00:00 Asia/Manila on the last day of a month; December to January; February in a leap year for `period_end`.
18. Month 0, month 13, year 1999, year 9999, and the earliest allowed month once G-01 is decided.
19. Resubmit sent twice at once: one new version, one 409, and the loser's file is deleted.
20. Admin review and Teacher resubmit at the same moment on one report.
21. A download that is running while a new version is uploaded still completes with the old file.
22. A Teacher moved to another center (AUD-021): cannot see, download or resubmit the old center's reports; the old center's new Teacher can.
23. A disabled Teacher, a Teacher who must change the password, and a Teacher with no center: all refused.
24. A review with Need Revision on a file report changes no Purchase Request of any other report.
25. Counts: dashboard, Teacher Home and Teacher Profile with reports of all three types and all three statuses, for two centers.

### Download (O3-T06)

26. The file is missing on disk: 404 with the plan's message, and the log holds the file id only.
27. `Content-Type`, `Content-Disposition`, `nosniff` and `no-store` are present for every allowed type; the type is never taken from the upload request (G-03).
28. A 10 MB download does not hold the whole file in memory (streamed); a client that stops half-way leaves no open file handle.
29. Version 0, a version that does not exist, a version of a LIQUIDATION report, and a version number of another report: all 404.

### Client (O3-T07 to O3-T09)

30. The session ends during an upload: the page says so and asks to log in again; nothing is saved.
31. A 413 that comes from a proxy as an HTML page shows the size message, not "Cannot reach the server" (R-08). The drop zone works with the keyboard and announces progress and errors to a screen reader; the Submit button cannot be pressed twice.

## 5. Points where the plan is sound

Checked and found complete enough: the storage key never leaves the server; the path is built only from
the database value; files are never under a static route; the report is scoped before the file is opened;
a failed transaction deletes the file and has a test; the existing review transaction is reused instead of
copied; every new route goes into the permission matrix; liquidation keeps snapshots and is not mixed with
file versions; statuses stay those of BR-07.
