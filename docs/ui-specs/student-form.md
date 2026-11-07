# Student form and Enrolled Students: field mapping

**For client confirmation (A-17, D9).** The form copies Figma "add enroll" 258:5447 and the list copies
"enrolled studs" 78:260. Please confirm the fields, which ones are required, and the dropdown lists.

## Which fields are required

Figma marks almost every field with `*`. The blueprint's rules decide for now: only the fields that have
always been required stay required (name, sex, date of birth, weight, height, parent or guardian).
Everything else is optional until the client confirms it (DEC-039).

## Fields with their own column

| Figma label | Column | Note |
| --- | --- | --- |
| 2a. Name: Last name, First name, Middle name | `last_name`, `first_name`, `middle_name` | Figma marks the middle name required; it stays optional |
| 3. Sex | `gender` | Figma draws square boxes; these are radios because only one can be chosen |
| 4a. Birth Order | `birth_order` | Dropdown 1 to 20 |
| 4b. No. of Siblings | `number_of_siblings` | Dropdown 0 to 20 |
| 5a. Date of Birth | `birthdate` | MM/DD/YYYY on screen (D7); Figma's hint says YYYY-MM-DD |
| 8. Religion | `religion` | Figma: dropdown, list unknown. A text field for now |
| 9. Ethnicity | `ethnicity` | |

## Fields the blueprint needs and Figma does not show

Kept, because the Enrollment Form PDF prints them. They sit at the end of section I.

| Label | Column |
| --- | --- |
| Weight (kg) | `weight_kg` |
| Height (cm) | `height_cm` |
| Parent or guardian | `parent_guardian_name` |
| Date enrolled | `enrolled_on` |

## Fields in `profile_extra` (JSON text, validated by `profileExtraSchema`)

| Figma label | Key | Note |
| --- | --- | --- |
| 1. Facility Location, Barangay, Municipality, Province, Region | `facilityLocation`, `facilityBarangay`, `facilityMunicipality`, `facilityProvince`, `facilityRegion` | Figma: dropdowns, lists unknown. Text fields. A new student starts with Libmanan, Camarines Sur, Region V |
| Jr/Sr | `suffix` | |
| 2b. Nickname | `nickname` | |
| 5b. Birth Registered | `birthRegistered` | YES or NO |
| 6. Birth Place | `birthPlace` | |
| 7. Home Address, Barangay, Municipality, Province, Region | `homeStreet`, `homeBarangay`, `homeMunicipality`, `homeProvince`, `homeRegion` | As for the facility |
| 11a to h, five rows | `familyMembers[]`: `fullName`, `birthday`, `relationship`, `sex`, `civilStatus`, `education`, `occupation`, `monthlyIncome` | Figma: dropdowns for c, e, f, g, lists unknown. Text fields |
| 12 Breastfeeding, months | `breastfed`, `breastfedMonths` | |
| 12 Supplemental Feeding, days | `supplemental`, `supplementalDays` | |
| 12 Food for School, kg | `riceDistribution`, `riceKg` | |
| 12 Assessment of Assistance | `assistance`, `assistanceGovernment`, `assistancePrivate`, `assistanceOthers`, `assistanceOthersText` | |
| 13 a, b, three rows | `disabilities[]`: `type`, `cause` | |
| 14 a to d, two rows | `eccd[]`: `serviceType`, `service`, `from`, `to` | |
| 15a Participation Fee | `feePaid`, `feeAmount` | |
| 15b Parents' Counterpart | `counterpartCash`, `counterpartInKind`, `counterpartNone` | |
| 16. Schedule | `scheduleCash`, `scheduleInKind` | |
| 17. Attendance, reason | `attendanceContinuing`, `attendanceDroppedOut`, `dropIllness`, `dropTransfer`, `dropOthers`, `dropOthersText` | |
| Accomplished By, Date Accomplished | `accomplishedBy`, `dateAccomplished` | |
| Name and Signature of ECCD Service Provider, Encoder ID | `providerName`, `encoderId` | |

Limits: text 120 characters, short text 20, whole form 6000 characters. Unknown keys are refused.

## Wording kept exactly as Figma, to confirm

- Two sections are both titled "II. Family Information".
- "12 The underwent the following" looks like it is missing "child".
- "16. Schedule" offers Cash and In Kind, which look like payment choices.

## Enrolled Students (78:260)

- Columns: #, Student ID, Student name, Age, Sex, Date Enrolled, Status, then edit and trash.
- **Student ID is a display code**: "RIC 26-007" from the school year and the row id, not stored. Figma shows "RIC 25-001"; the blueprint has no such field. It is unique but does not count 1, 2, 3. Please confirm the numbering rule.
- Date Enrolled is numeric (D7), where Figma shows "March 21, 2026".
- The trash icon archives (nothing is deleted). An archived row offers Restore.
- Under the list: Student List for the four earlier years, each with View All.
- Export List is not built; the Enrollment Form button opens the PDF list instead.
- Under 768 px each student is a card (361:3405).
