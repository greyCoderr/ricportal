# UI kit components and their Figma sources

The record for P0-T12 (done in three steps: T12a, T12b, T12c). Each Figma node is read once.
Working copy: `EetVyXPcJxatZKCElGlqr6` (docs/figma-link.txt). Token values are in docs/tokens.md.

## Figma calls

| Date | Step | Call | Node | Result |
| --- | --- | --- | --- | --- |
| 2026-11-05 | T12a step A | `create_session` | file | Session for the P0-T12 reads |
| 2026-11-05 | T12a step A | `get_metadata` | `0:1` | Page "RIC teacher" only. The tool has no depth option, so the whole page came back (about 520 KB, saved locally and parsed; no extra calls) |
| 2026-11-05 | T12a step B | `get_design_context` | 152:597 | Button set "View Profile" |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2417 | Mobile `Action` button |
| 2026-11-05 | T12a step B | `get_design_context` | 102:454 | Icon button set (edit) |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2690 | Mobile `Form field` |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2349 | Mobile `Input` (search field; it has no chevron, the select field is shown inside 361:2984) |
| 2026-11-05 | T12a step B | `get_design_context` | 361:3381 | `Narrative writing area` (textarea) |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2909 | `Sex choices` (square choice boxes) |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2984 | Mobile `Card` (with form fields and select fields inside) |
| 2026-11-05 | T12a step B | `get_design_context` | 267:9808 | Admin dashboard card: per-side borders |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2415 | Mobile `Status` pill |
| 2026-11-05 | T12a step B | `get_design_context` | 361:2576 | `refresh-cw` icon (SVG checked as text from Figma's asset link, not an MCP call) |

| 2026-11-06 | Sprint S0 | `get_design_context` | 166:910 | Teacher sidebar: 290 wide, black; items 262 x 53, Light 16, tracking 0.1em, white; selected #FF8282, radius 10, left strip #D32F2F; labels Home, Enrolled Students, Calendar, Child’s Record, Submit Report, Report Status, Admin Feedback, Profile |
| 2026-11-06 | Sprint S0 | `get_metadata` | no node, 267:9688 | Page list (0:1 RIC teacher, 393:1101 parent, 267:9688 admin); Admin page structure. Not counted in the sprint limit of 25 reads |

Calls before the sprint: 13. Sprint reads (limit 25): 3 (166:910 sidebar, 241:1732 Login, 393:1133 PARENT CALENDAR, which returned layout only: a month calendar, a Purchase Request list and a Parents panel; DEC-024 and S-P5-04 decide what a Parent sees). The Teacher frames 78:260, 258:5447 and 166:1553 were only read for labels from the saved page metadata.

## Values read in step B

Colors that are not tokens are written as read, with the token they map to. Contrast is on white.

| Node | Size | Radius | Border | Fill | Text | States shown |
| --- | --- | --- | --- | --- | --- | --- |
| 152:597 Button "View Profile" | 135 x 40 | 8 | Default 1px #AAAAAA; Variant2 1px white | Default white; Variant2 #003E00 (dark green, not a token) | Montserrat Medium 13; Default #003E00, Variant2 white. Raster eye icon (PNG) 16 px at left | Default and Variant2 (filled, probably hover or selected) |
| 361:2417 `Action` | 326 x 48, padding 12, gap 8 | 6 | 1px #BFBFBF | white | Montserrat SemiBold 13 #151515; Lucide `eye` 20 px | Default only |
| 102:454 Icon button | 45 x 43 | none | none | none | Raster edit icon 24 px (green PNG). Variant2 adds the word "Edit" below: Regular 15, black, letter-spacing 1.5px | Default and Variant2 (hover shows the label) |
| 361:2690 `Form field` | column, gap 7 | | | | Label Montserrat Medium 14 #151515, line height 1.4; required mark " *" in #D32F2F (`primary`) | |
| 361:2349 `Input` (also 361:2692) | 326 x 48 (min height 48), padding 12 | 6 | 1px #BFBFBF | white | Placeholder Regular 14 #666666 (5.74:1), line height 1.45 | Default only |
| Select field (361:2996, inside 361:2984) | as Input, gap 8 | 6 | 1px #BFBFBF | white | "Select..." Regular 14 #666666; Lucide `chevron-down` 16 px, stroke #666666 | Default only |
| 361:3381 Textarea | 326 x about 300 | **0** | 1px #BFBFBF | white | none | Default only |
| 361:2911 Choice box (in 361:2909) | box 22 x 22; row min height 44, gap 12 | 2 | 1px #BFBFBF | white | Label Regular 14 #151515 | Unchecked only. Used for Male and Female, which is a one-of-two choice |
| 361:2984 Card | 326 wide, padding 16, gap 14 | 8 | 1px #BFBFBF | white | Title SemiBold 16 #151515 | Shadow 0 2px 5px 0 black 9% (not one of the three shadow tokens) |
| 267:9808 Dashboard card | 225 x 225 | 10 | **Bottom only, 4px #025B02 (`accent`)**; no border on the other sides | white | | `shadow-card` |
| 361:2415 Status pill | padding 9 x 5 | 6 | none | #FFE3E3 (not a token) | "Needs Revision", SemiBold 11, #D32F2F (4.11:1 on its fill, fails AA) | |
| 361:2576 `refresh-cw` | 20 x 20 | | | | Stroke #D32F2F | |

## Icon style: confirmed

The mobile layouts use **Lucide** icons. The SVG path data matches Lucide's `refresh-cw` and `chevron-down` scaled from 24 to 20 and 16 px, with `stroke-linecap="round"`. The stroke is 1px at the drawn size (no `stroke-width`, so the default 1), thinner than Lucide's default 2 at 24 px (1.67 at 20 px). Icon colors seen: #D32F2F (`primary`) and #666666. The desktop Teacher frames use raster PNG icons (152:597 eye, 102:454 edit).

## Conflicts with docs/tokens.md and DESIGN_LANGUAGE.md

1. **Two control styles.** Desktop (241:xxxx login, 258:5447 add enroll; tokens.md): inputs 44 high, radius 8, labels Medium 15. Mobile (361:xxxx): inputs 48 high, radius 6, labels Medium 14, border #BFBFBF, text #151515, placeholder #666666. Radius 6 and size 14 are not tokens.
2. **Status pill.** Mobile 361:2415 shows "Needs Revision" in red (#D32F2F on #FFE3E3, 4.11:1, fails AA). DEC-028 maps Need Revision to warning, and BR-07 says "Need Revision". The Admin badges (267:9763 to 267:9770) use radius 10, Medium 12 and the 24% tints.
3. **Green button.** 152:597 is dark green #003E00 (not a token; `accent` is #025B02). DESIGN_LANGUAGE rule 6 says red = action.
4. **Card shadow.** 361:2984 uses a 9% shadow that is not one of the three shadow tokens (rule 7).
5. **Textarea radius 0** while the inputs next to it are rounded (6).
6. **Square boxes for a one-of-two choice** (Male or Female): that is radio behavior drawn as checkboxes. No checked state is drawn.
7. **Icon button 45 x 43** is just under 44 px high. Its label appears only on hover, so the icon has no visible name otherwise.
8. **Mixed icon styles**: raster PNG on desktop and Lucide vectors on mobile (BACKLOG).

## What page 0:1 contains (step A)

- Page `0:1` is named **RIC teacher**. Admin frames (267:xxxx, for example the dashboard card 267:9808) and the Parent frames (393:xxxx) are on other pages and were not opened.
- **No component sheet and no style sheet** on this page. The components are local component sets placed next to the screens.
- Desktop Teacher frames (1920 x 1080): 166:1553 RIC calendar, 175:1023 RIC dashboard, 78:268 submit report, 78:276 RIC 4, 78:284 report status, 88:695 profile, 78:260 enrolled studs, 169:3189 and 254:4572 Child's record, 258:5447 add enroll. Also 241:1732 Login (1280 x 1020).
- Mobile layouts, 390 wide (361:xxxx to 380:xxxx), lying loose on the page with no parent frame. They use auto-layout-style names: `Input`, `Form field`, `Status`, `Action`, `Page action`, `Card`, `Choice` and `Selection` (Sex choices 361:2909), `Narrative writing area` 361:3381, `File drop area` 361:2713, `Divider`.

Local component sets (variants are named `Property 1=Default`, `Variant2`, ...):

| Set (frame) | Variants | Size | Likely use |
| --- | --- | --- | --- |
| 152:597 "Frame 3" | 152:598 Default, 152:600 Variant2 | 135 x 40 | Button (two states) |
| 102:454 "Group 41" | 102:453 Default, 102:455 Variant2 | 45 x 43 | Icon button (row actions, trash) |
| 34:242 "Rectangle 17", 34:275 "Rectangle 18" | 4 each (34:241 to 34:259, 34:274 to 34:284) | 650 x 104 | List item or row, unknown |
| 160:631 "Frame 4", 160:659 "Frame 5" | 3 each (160:630 to 160:635, 160:658 to 160:662) | 1076 x 91 | Table or list row |
| 160:709 to 160:711 | 2 | 36 x 36 | Small control, unknown |
| 310:857, 310:859 | 2 | 23 x 22 and 79 x 23 | Small control, unknown |
| 77:xxx, 84:xxx, 129:xxx, 166:6xx/7xx | Default and selected | 262 x 53, 252 x 53 | Sidebar nav items (P0-T13) |
| 166:911 "Component 4" | 166:910 HOME, 246:2707 to 246:3007 | 290 x 785 | Sidebar (P0-T13) |

Not found on this page: modal or dialog, drawer, pagination, a checkbox component, a select component (the mobile `Input` with `chevron-down` is a select field), toast, spinner, skeleton, empty state, banner, stamp. Tables on desktop frames are drawn with loose lines (78:260 enrolled studs: Line 8 to Line 21, 1543 wide).

## Icons (step A)

Two styles on this page:

1. **Desktop Teacher frames: raster images**, coloured flat icons placed as image fills. Layer names: `trash 5`, `plus 1`, `location-pin 2`, `logout 1`, `eye 2`, `check 2`, `reload 1`, `document 1`, `file 1`, `pencil 1`, `hour-glass (1) 1`, `message 1`, `downloads 2`, `cloud-computing 1`, `send 1`, `view 1`, `edit 1`.
2. **Mobile layouts: vector icon frames** with kebab-case names that match the **Lucide** icon set exactly: `chevron-down` (16), `chevron-right`, `circle-check` (18 to 22), `circle-alert`, `circle`, `eye` (20), `pencil`, `bell` (22), `calendar-days` (22), `refresh-cw`, `trash-2`, `download`, `cloud-upload`, `upload`, `plus`, `user-plus`, `file-plus`, `message-square`, `message-circle`. `refresh-cw` and `circle-alert` are Lucide names, not Font Awesome names. The metadata shows no vector children, so the stroke style is confirmed by one read in step B.

## Icons in code

- **Icons adapted from Lucide (https://lucide.dev), ISC license.** No icon package is installed; the path data is copied for the icons used: `check`, `chevron-down`, `circle-alert`, `circle-check`, `eye`, `loader-circle`, `refresh-cw`, `x`. The notice at the top of `client/src/components/ui/icons.tsx` holds the ISC license (Copyright (c) 2026 Lucide Icons and Contributors) and the MIT license (Copyright (c) 2013-present Cole Bemis) that Lucide lists for icons derived from Feather: here `check`, `chevron-down` and `x`.
- **Version checked: lucide-static 1.70.0**, fetched 2026-11-06 from cdn.jsdelivr.net/npm/lucide-static@1.70.0/icons/<name>.svg and /LICENSE. Seven of eight shapes matched. `circle-check` differed: its check is now `m16 9-5.5 5.5L8 12` (it was `m9 12 2 2 4-4`); fixed. `icons.test.tsx` pins every shape to 1.70.0.
- **Stroke width:** one constant, `ICON_STROKE = 1.5`, with `vector-effect: non-scaling-stroke`, so the stroke is 1.5 px at every icon size. Figma draws 1 px; 1.5 is the Developer's accessibility judgement (DEC-028). One approved exception: the checkbox check mark is 2px (`Icon` takes `strokeWidth` for it).
- Icons are `currentColor`, decorative (`aria-hidden`) unless given a label, and 20 px by default.

## Component record

Filled in steps T12a to T12c. Source is Figma, or Developer-designed with its spec in docs/ui-specs/ui-kit.md. Common to all controls: focus ring `focus-visible:outline-2 outline-offset-2 outline-text` (DEC-028); disabled `opacity-50`, `cursor-not-allowed`, `aria-disabled`.

| Component | File | Figma node(s) | Source | Built from tokens |
| --- | --- | --- | --- | --- |
| Button | `ui/Button.tsx` | 241:1105, 258:5832 (primary); 361:2417 (secondary) | Figma; hover, disabled and loading added with tokens | primary: `bg-primary`, `text-primary-contrast`, hover `bg-primary-hover` (#B32828). secondary: `bg-surface`, 1px `border-subtle`, hover `border`. sm `h-8` (32), md `h-11` (44, default). `rounded-control`, Medium 13. Loading: Spinner, `aria-busy`, `aria-disabled`, still focusable, clicks and form submit blocked. No green variant (152:597, BACKLOG) |
| IconButton | `ui/Button.tsx` | 102:454 | Figma; 44 x 44, label on focus added (DEC-028) | `size-11`, `aria-label`, the label shown below on hover and focus (Regular 15, `tracking-label`), icon 24 px |
| Input | `ui/Input.tsx` | 241:1103, 258:5480; 361:2349 (values not used, DEC-028) | Figma desktop values | `h-11`, `rounded-control`, 1px `border-subtle`, hover `border`, `text-16` on phones and `md:text-15` from 768 px (no iOS zoom on focus), placeholder `text-placeholder`, error `aria-invalid:border-danger-text` |
| Textarea | `ui/Textarea.tsx` | 361:3381 | Figma, with the input radius (DEC-028) | As Input, `min-h-24`, `resize-y` |
| Select | `ui/Select.tsx` | 361:2996 | Figma | Native `select`, as Input, `appearance-none`, chevron-down 16 px `text-muted`. `placeholder` prop: a disabled, hidden empty first option, selected by default unless `value` or `defaultValue` is given |
| FormField | `ui/FormField.tsx` | 361:2690; label size from 258:5476 | Figma | Label Medium 15 `text`; required mark " *" `text-primary` (`aria-hidden`, control gets `required`); hint `text-13 text-muted`; error `text-13 danger-text`; both linked by `aria-describedby`; error sets `aria-invalid` |
| Card | `ui/Card.tsx` | panel 361:2984; stat 267:9808 | Figma (panel without the 9% shadow) | panel: `rounded-control`, 1px `border-subtle`, `p-4`, no shadow. stat: `rounded-card`, `border-b-4 border-accent`, `shadow-card` |
| Badge | `ui/Badge.tsx` | 267:9763 to 267:9770 | Figma | `*-soft` fill, AA text token, `rounded-card`, Medium 12 |
| StatusBadge | `ui/StatusBadge.tsx` | 267:9763 to 267:9770 | Figma tones, BR-07 labels (DEC-028) | Submitted info, Need Revision warning, Approved success, Declined danger. The mobile red pill 361:2415 is not used |
| Spinner | `ui/Spinner.tsx` | none | Infrastructure | Lucide `loader-circle`, `animate-spin`, `motion-reduce:animate-none`; `role="status"` with a label, decorative without |
| Skeleton, SkeletonGroup | `ui/Skeleton.tsx` | none | Infrastructure | Skeleton: `bg-skeleton` (alias of `header`), `rounded-cell`, still, `aria-hidden`. SkeletonGroup: `aria-busy="true"` and visually hidden "Loading..." text; a scan test fails if a file renders Skeleton without SkeletonGroup |
| ErrorBoundary | `ui/ErrorBoundary.tsx` | none | Infrastructure | Class component; optional `fallback({ error, reset })`. Default: ErrorState "Something went wrong on this page.", "Reload the page to try again." and a Reload button |
| Icon | `ui/icons.tsx` | 361:2576 and the mobile icon names | Lucide geometry | See Icons in code |
| Checkbox | `ui/Checkbox.tsx` | 361:2911 (unchecked box) | Figma box; checked look Developer-designed, approved | Native checkbox, 22 px, `rounded-cell`, `border-subtle`, hover `border`; checked `bg-primary` with a 2px check in `primary-contrast`; row `min-h-11`, gap 12, `text-15`; error `aria-invalid:border-danger-text` |
| Banner | `ui/Banner.tsx`, `ui/tones.ts` | none | Developer-designed, approved | `*-soft` fill, `border-l-4` in the hue, AA text token, icon `circle-alert` or `circle-check`; `role=status` for info and success, `alert` for warning and danger; optional title and action |
| EmptyState | `ui/EmptyState.tsx` | none | Developer-designed, approved | Left-aligned, no card; optional icon 24 `text-muted`; heading `text-16` SemiBold (level prop); body `text-15 text-secondary`; no default text |
| ErrorState | `ui/ErrorState.tsx` | none | Developer-designed, approved | `role=alert`; icon `circle-alert` 24 `danger-text`; heading and message; secondary Retry button with loading |
| Modal, Drawer, ConfirmDialog | `ui/Modal.tsx`, `ui/Drawer.tsx`, `ui/ConfirmDialog.tsx`, `ui/useNativeDialog.ts` | none | Developer-designed from tokens (DEC-028) | Native dialog with showModal; Escape through cancel; backdrop `overlay`; Drawer is a bottom sheet under 768 px and a right panel from md |
| Table, Pagination | `ui/Table.tsx`, `ui/Pagination.tsx` | 78:260 (ruled lines) | Figma lines, tokens | Caption, scoped headers, sideways scroll inside a focusable region, right-aligned tabular numbers. `cardsOnPhone`: cards under 768 px; with `cardsUntilDesktop`, cards until 1280 px and always on touch screens (DEC-047) |
| Tabs | `ui/Tabs.tsx` | none | Developer-designed | tablist with buttons at least 44 px high; only the open panel is rendered |
| LedgerTable | `ui/LedgerTable.tsx` | none | Developer-designed, approved spec in ui-kit.md | Ruled rows, right-aligned tabular numbers, total row with a single rule above and a double rule below; built in S4 as the sprint plan asks |
| Stamp | `ui/Stamp.tsx` | none | Developer-designed, approved spec in ui-kit.md | Outlined, 2px, uppercase, rotated 2 degrees, BR-07 words; built in S5 as the sprint plan asks |
| Toast | `components/toast` | none | Aligned to Banner | Same tone classes and icons as Banner (`tones.ts`), plus `shadow-panel`; API unchanged (success, error uses danger, info) |

## Demo polish Figma calls (limit 120)

| Date | Stage | Call | Node | Result |
| --- | --- | --- | --- | --- |
| 2026-11-07 | F1 | `create_session` | file | Session for the polish reads |
| 2026-11-07 | F1 | `get_metadata` | 393:1101 | Parent page: PARENT LOGIN 393:1102, PARENT CALENDAR 393:1133 |
| 2026-11-07 | F1 | `get_design_context` | 241:1732 | Login desktop: layout, texts, photo, emblem, waves |
| 2026-11-07 | F1 | `get_design_context` | 88:695 | Teacher profile: sidebar, top bar, footer (output truncated at the tool limit) |
| 2026-11-07 | F1 | `download_assets` | 268:10485, 268:10498, 268:10507 | Footer logos: DSWD, seal, MAO |
| 2026-11-07 | F1 | `download_assets` | 241:1085 | Login waves |
| 2026-11-07 | F1 | `download_assets` x3 | 241:1101 | Login photo at 1.5x (868 KB), 0.85x (380 KB), 0.7x (280 KB, kept) |
| 2026-11-07 | F1 | `get_metadata` | 267:9688, 0:1 | Admin and Teacher pages, saved locally and parsed |
| 2026-11-07 | F1 | `get_screenshot` | 267:9689, 378:16539, 380:1149 | Admin dashboard, Admin Profile mobile, Admin phone login |

| 2026-11-07 | F2 | `get_screenshot` | 166:1553, 393:1133, 378:15722 | Teacher, Parent and Admin phone calendars |
| 2026-11-07 | F2 | `get_design_context` | 378:15461, 393:1759, 393:1816 | Calendar cells, arrow tag (#A40000), pink card |

| 2026-11-07 | F3 | `get_screenshot` | 78:260, 258:5447 | Enrolled Students, add enroll (labels read from the saved page metadata) |

| 2026-11-07 | F4 | `get_screenshot` | 268:12661, 267:9862, 267:9887, 268:11404 | Reports, RIC Teachers, Admin Profile, Admin Calendar |

| 2026-11-07 | F5 | `get_screenshot` | 175:1023, 78:284, 78:276 | Teacher Home, Report Status, Admin Feedback |

Polish calls so far: 31 of 120.

## Polish layout components

| Component | File | Figma node(s) | Source |
| --- | --- | --- | --- |
| AppShell | `app/layouts/AppShell.tsx` | 166:910, 267:9689, 111:959 | Figma; the mobile drawer is Developer-designed (DEC-037) |
| AppFooter | `app/layouts/AppFooter.tsx` | 268:10479, 267:9689 | Figma |
| StatusPage | `app/pages/StatusPage.tsx` | none | Developer-designed from tokens |
| ProfilePage | `features/auth/pages/ProfilePage.tsx` | 88:695, 378:16539 | Figma, D11 fields only |
| DayPanels | `features/calendar/components/DayPanels.tsx` | 393:1759, 393:1816, 166:1553 | Figma |
| PurchaseItemsTable | `features/purchase/components/PurchaseItemsTable.tsx` | 393:1766 to 393:1814, 166:1553 | Figma; the row's edit fields are Developer-designed |
| AssignParentsModal | `features/purchase/components/AssignParentsModal.tsx` | 166:1553 (Step 1) | Figma Step 1; Step 2 is Developer-designed from D4 |
| DateInput | `ui/DateInput.tsx` | none | Masked MM/DD/YYYY text field (D7), built on Input |
| StudentForm, StudentExtraSections | `features/students/components` | 258:5447 | Figma layout and labels |

## Polish Round 2 frames read (docs/POLISH_PLAN_2.md)

- 267:9689 ADMIN dashboard, 1920 x 1080: design-context read (sparse response, 2026-11-08).
- 175:1023 RIC dashboard (Teacher Home), 1920 x 1671: design-context read (sparse response, 2026-11-08).
- 88:695 profile, 1920 x 1367: design-context read (2026-11-08).
- 267:9689, 268:11404 (Admin Calendar with the upload panel), 267:9862 (RIC Teachers): screenshots (2026-11-08).
- 166:1553 (Teacher Calendar), 78:260 (Enrolled Students), 175:1023 (Teacher Home), 78:284 (Report Status), 78:276 (Admin Feedback), 258:5447 (Add Student): screenshots (2026-11-08).

## Polish Round 3 Figma calls (limit 60)

| Date | Stage | Call | Node | Result |
| --- | --- | --- | --- | --- |
| 2026-11-08 | H1 | `create_session` | file | Session for Round 3 |
| 2026-11-08 | H1 | `get_metadata` | 241:1732 | Login: fields 479 x 50 in a 1280 x 1020 frame |
| 2026-11-08 | H1 | `get_metadata` | 267:9862 | RIC Teachers: the content is one flat image (267:9873) |
| 2026-11-08 | H1 | `get_screenshot` | 267:9862 | Card icons cropped from it (Total, Active, Inactive), table columns with Date Approved |
| 2026-11-08 | H1 | `get_metadata` | 267:9689 | Admin dashboard: avatar 41 at 16 from the top, cards 225 x 225, left column 753, calendar 708, upload box 494 x 98 |
| 2026-11-08 | H1 | `get_screenshot` | 267:9689 | Admin dashboard at 1920 |
| 2026-11-08 | H1 | `get_metadata` | 268:11404 | Admin Calendar: calendar 955 x 699 beside the upload panel 575 wide |
| 2026-11-08 | H1 | `get_metadata` | 166:1553 | Teacher Calendar: grid 1270 x 874, header avatar 70 at 12 from the top; footer Quick links put "Child’s Record" after Calendar |
| 2026-11-08 | H2 | `create_session` | file | Session for H2 |
| 2026-11-08 | H2 | `get_screenshot` | 88:695 | Teacher Profile: detail columns and report cards, different from the Admin frame (DEC-049) |

Round 3 calls so far: 10 of 60.
