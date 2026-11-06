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
| S2 | Previous school year view | The `schoolYear` filter on the API | A school year select and a read-only banner on the list |
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
| Add enroll form: facility location, nickname, Jr/Sr, birth registered, birth place, home address, family members, disabilities, past ECCD experience, participation fee and other sections | Only the blueprint's student fields (4.5, field rules in phase 2). The blueprint wins on business rules, and A-17 asks to confirm the fields with the client | Confirm with the client, then add columns by migration |
| Student ID column (RIC 25-001) | Not shown; the blueprint has no such field | Decide a numbering rule with the client |
| Export List button | Not built; not in the sprint scope. The Enrollment Form PDF lists the children | A CSV or PDF export |
| Lists of earlier years (Student List for 2025, 2024...) | Previous school year view cut (above) | A school year select |
| Site footer with contact and quick links | Not built | A footer in the layout |
