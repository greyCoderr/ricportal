# Sprint shortcuts

Everything left out or simplified to reach the demo on Tue 2026-11-10. Each row says what the demo does instead and how to restore it in hardening.

## Removed from the Figma Login frame (241:1732, DEC-034)

| Element | Figma node | Instead | To restore |
| --- | --- | --- | --- |
| Stock photo in the right panel | 241:1101, overlay 241:1102 | A plain panel in the `nav` token | Get a licensed or client photo, add it to the panel with the overlay token |
| RIC emblem | 241:1100 | The word RICPORTAL only | After client approval (DESIGN_LANGUAGE rule 10), add the image next to the title |
| "Forgot password?" link | 241:1111 | Nothing; the approver resets passwords (BR-05, A-13) | Only if the client wants email later; a change request |
| Terms checkbox | 241:1117, 241:1118 | Nothing | Needs terms text from the client, then a required Checkbox on sign-up |
| "Email Address" label | 241:1108, 241:1106 | "Username" | Only if accounts move to email; a change request |

## Sprint plan CUT lists, applied from the start

| Stage | Cut item | What stays | To restore |
| --- | --- | --- | --- |
| S2 | Progress tab UI | The progress API (create, list, edit, soft delete) | A tab like Home visits |
| S2 | Previous school year view | Built in F3 as year cards on the list | A read-only banner on the list |
| S2 | Admin students-by-center screen | The API: `GET /api/students?centerId=`, summary and Child's Record reads for the Admin. The nav item is removed | A page with a center select and a read-only table |
| S3 | Replacing overlapping menu dates | Confirm rejects overlapping dates with a clear message | A replace option in preview and confirm |
| S3 | Calendar week view | Month on desktop, list on phones | A FullCalendar view button |
| S4 | Rate setting screen | The seeded `perChildDailyRate` | A Settings page for the Admin |
| S4 | Today's Feeding card on the Teacher home | The Calendar page | A card on the home page reading the calendar API |
| S4 | Autosave retry polish | Per-row Saving, Saved and Failed with one Retry button | Backoff and retry-all |
| S5 | Transmittal Checklist beyond the placeholder | A clean page titled "layout pending the official copy" (A-09) | The real layout from a clear copy |
| S5 | Admin queue filters | The full list, newest first | Filters by status, center and month |

## Student screens compared with Figma (258:5447, 78:260)

| Figma element | Instead | To restore |
| --- | --- | --- |
| Add enroll form: facility location, nickname, Jr/Sr, birth registered, birth place, home address, family members, disabilities, past ECCD experience, participation fee and other sections | Built in F3, stored in `profile_extra` and optional (D9, DEC-039) | Confirm with the client (docs/ui-specs/student-form.md), then make the agreed fields required |
| Student ID column (RIC 25-001) | A display code from the school year and row id (DEC-039), not stored | Decide a numbering rule with the client |
| Export List button | Not built; not in the sprint scope. The Enrollment Form PDF lists the children | A CSV or PDF export |
| Lists of earlier years (Student List for 2025, 2024...) | Built in F3 as Figma's cards with View All; earlier rows are read-only | Nothing |
| Site footer with contact and quick links | Built in F1 | Nothing |

## Purchase Request screens compared with the phase 5 layout

| Phase 5 item | Instead | To restore |
| --- | --- | --- |
| Editor rows inside the ledger table, with cards under 768 px | Since F2 the Figma table with a pencil on each row; the fields open under the row. LedgerTable is used for the read-only view (locked days and the Admin) | Nothing |
| Progress bar on the budget line | The budget line in words, and a warning sentence when over budget (warning-text) | A bar using tokens |
| Searchable multi-select of Parents | Since F2 the week team dropdowns and the day checkboxes (D4) | Add a search box if a center has many parents |
| Automatic retry when the connection returns | A Retry button on the row (S4 cut) | Listen for the online event |
| Replace-import guard (BR-08) | Not needed yet: S3 refuses any overlap, so nothing can be replaced | Add with the replace option |
| Parents panel in Figma 393:1133 (Parents assigned) | Shown since F2 (D2) | Nothing |

## Liquidation compared with phase 6

| Phase 6 item | Instead | To restore |
| --- | --- | --- |
| Signatories settings screen and endpoint | No screen (settings screens are out). The PDFs read approvedByName, approvedByTitle, notedByName and notedByTitle from the settings table; blank by default | A Settings page for the Admin |
| Blocking days link back to their day panels | A plain list of the days in the confirm dialog | Links that open the day panel |
| report_versions table | A version number on the report, and one snapshot per version | Add with file uploads (Objective 3) |

## Demo polish (D10 and F1)

| Item | What the demo does | To restore or finish |
| --- | --- | --- |
| Photo and emblem on Login | Restored with the client's permission (DEC-037); the first table's rows for them no longer apply | Nothing |
| Teacher SUBMIT REPORT | A "Coming soon" page (Objective 3). The liquidation Submit Report stays in the Calendar overlay | Build with file uploads in Objective 3 |
| Admin DASHBOARD | Real counts (F4) | Nothing further for the demo |
| Admin REPORTS | The liquidation queue only | Add the enrollment and accomplishment reports in Objective 3 |
| Teacher REPORT STATUS | Own liquidation submissions with status | Same |
| Teacher ADMIN FEEDBACK | Feedback on returned reports (F5) | Same |
| Notification bell with a count | Left out; there are no notifications | Build notifications if the client asks |
| Profile report cards, activity lists, date of birth, address, two-factor, sessions | Left out; only the D11 fields are shown | A change request with the client |
| Footer Facebook and Gmail icons | Shown as images; no Facebook address is in Figma | Link them when the client gives the page |
