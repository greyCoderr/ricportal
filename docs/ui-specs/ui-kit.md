# UI kit gaps (Developer-designed)

Status: **Developer-designed, client approval requested.** Stamp and LedgerTable: spec only (built in Phases 3 and 5). Banner, EmptyState, ErrorState and the checkbox look: approved by the Developer on 2026-11-06 and built in P0-T12a.

Process: docs/DESIGN_GAPS.md. Style: docs/DESIGN_LANGUAGE.md and docs/tokens.md (existing tokens only, no new colors). The client's Figma has no frame for these components (docs/components.md, step A). If the client later adds one, the Figma frame wins by default.

---

## Stamp

| Part | Spec |
| --- | --- |
| Component | `Stamp`, `client/src/components/ui/Stamp.tsx` |
| Built in | **Phase 3** (report detail). Not built in P0-T12. Also used on submitted liquidation in Phase 6 |
| Used on | Report detail (Admin and Teacher) and submitted liquidation. Lists and tables use StatusBadge pills, never stamps (DESIGN_LANGUAGE rule 2) |
| Purpose | Shows the decision on one report as an outlined stamp, like the ink stamp on a paper form |
| Labels | From BR-07 only: **Submitted**, **Need Revision**, **Approved**. Shown uppercase by CSS; the DOM text keeps the BR-07 casing, so screen readers read words, not letters |
| Tones | Figma tones mapped to the BR-07 statuses (mapping in DEC-028, waiting for confirmation): Approved = success, Submitted = info, Need Revision = warning |
| Look | Rectangle, `border-2`, `rounded-cell` (2px), transparent background (no fill), padding `px-3 py-1`. Text `text-16`, SemiBold (600), uppercase, `tracking-label` (0.1em). The border and the text use the same text token: Approved `success` (#025B02, 8.40:1 on white), Submitted `info-text` (#1F4E96), Need Revision `warning-text` (#6B5900). The warning hue #EDF902 is never used, because its border would be 1.1:1 on white |
| Rotation | `-rotate-2` (2 degrees, the maximum in rule 2). No animation |
| Props | `status`: one of the three BR-07 statuses. No free text and no custom color |
| Layout | Inline element, placed to the right of the report title. Under 768 px it sits on its own line below the title, left-aligned |
| States | Static only: it is not interactive, so it has no hover, focus or disabled state |
| Accessibility | Plain text inside a `<span>`; the word carries the meaning, so color is never the only signal (rule 6). Rotation does not change the reading order. All three text colors pass 4.5:1 on `surface` |
| Acceptance | Each status shows its word and its tone; the text and border use only the text tokens listed; it is rotated 2 degrees at most; the hard-coded color test passes; no stamp appears in lists |

Text wireframe:

```
Accomplishment Report, October 2026        ┌───────────────┐
Libmanan RIC Children Center (example)     │ NEED REVISION │  (rotated 2 degrees)
                                           └───────────────┘
```

---

## LedgerTable

| Part | Spec |
| --- | --- |
| Component | `LedgerTable`, `client/src/components/ui/LedgerTable.tsx` |
| Built in | **Phase 5** (Purchase Request editor S-P5-02). Not built in P0-T12. Also used for the Summary of Disbursement view in Phase 6 |
| Purpose | Shows money rows the way the official forms do (DESIGN_LANGUAGE rule 1), so the screen matches the paper and the PDF |
| Data | Rows and the total come from the server as Decimal strings (BR-11, BR-18). The table never adds or rounds; it only shows the strings as PHP amounts with the money formatter built in Phase 5 |
| Props | `caption` (required, for example "Purchase Request, 10 March 2026"), `columns` (key, header, `align: "left" \| "right"`, `numeric: boolean`), `rows`, `total` (label and value, optional) |
| Markup | A real `<table>`: `<caption>`, `<thead>` with `<th scope="col">`, `<tbody>`, and the total row in `<tfoot>` with `<th scope="row">` for its label |
| Lines | Thin ruled lines: every body row has a 1px bottom rule in `border-subtle` (#949494). The header has a 1px bottom rule in `border` (black, rule 6: black = structure). No vertical lines, no zebra stripes, no card or shadow around the table |
| Numbers | Numeric columns are right-aligned with `tabular-nums`. Amounts are written `PHP 1,234.00`. Text columns are left-aligned |
| Total row | A single 1px rule in `border` above and a double rule below (`border-b-4 border-double`, black). Label and amount in SemiBold (600) |
| Type | Teacher and Admin screens are dense (rule 9): body `text-13`, header `text-13` Medium in `text-secondary`. Parents do not use LedgerTable (S-P5-04 uses cards) |
| Responsive | Under 768 px the table scrolls sideways inside a wrapper with `role="region"`, `aria-label` set to the caption and `tabIndex={0}`, so keyboard users can scroll it. The page itself never scrolls sideways |
| States | Loading: Skeleton rows. Empty: EmptyState with real names, for example "No ingredients listed for Chicken tinola yet." (rule 3; never "No data found"). Error: ErrorState with Retry |
| Accessibility | Caption names the table; headers have `scope`; the total row label is a row header; contrast: `text` on `surface` 21:1, row rules 3.03:1 |
| Acceptance | Numbers line up by digit; the total row has a single rule above and a double rule below; amounts show `PHP` and two decimals exactly as sent by the server; the table works at 360 px with sideways scroll inside its region; the hard-coded color test passes |

Text wireframe (desktop):

```
Purchase Request, 10 March 2026
 #  Ingredient        Unit   Qty       Unit cost         Total
──────────────────────────────────────────────────────────────  (header rule, black)
 1  Rice              kg     5.00    PHP 52.00     PHP 260.00
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -   (row rule, border-subtle)
 2  Chicken           kg     2.00   PHP 180.00     PHP 360.00
──────────────────────────────────────────────────────────────  (single rule above the total, black)
    Subtotal                                       PHP 620.00
══════════════════════════════════════════════════════════════  (double)
```

The sample names and amounts are examples only.

---

## Short specs for T12a (waiting for the Developer's approval)

Approved by the Developer on 2026-11-06 and built in P0-T12a. Existing tokens only. Status: Developer-designed, client approval requested.

### Banner

- **Purpose:** a message for a whole page or section, for example "This day is locked by your teacher. You can view it but not change it." (S-P5-04). Not a toast: it stays until the condition ends.
- **Tokens:** tones info, success, warning and danger. Fill `*-soft`; a 4px left border in the hue (`info`, `success`, `warning`, `danger`; decorative, the words carry the meaning); text and icon in `info-text`, `success`, `warning-text` and `danger-text` (5.80, 5.56, 6.55 and 5.38:1 on their fills). `rounded-control`, padding `p-3`, `text-15`, an optional title in SemiBold. The icon is a Lucide-style inline SVG, 20 px, 1px stroke: `circle-alert` for info, warning and danger, `circle-check` for success.
- **States:** static. An optional action is a Button (`sm`). No dismiss button unless a screen spec asks for one.
- **Accessibility:** `role="status"` for info and success, `role="alert"` for warning and danger. The icon is `aria-hidden`. Color is never the only signal.
- **Copy:** passed in by the screen, in plain words with real names (rule 3).

### EmptyState

- **Purpose:** shown when a list or section has nothing yet.
- **Tokens:** no card and no illustration (rule 7). Left-aligned. An optional Lucide-style icon, 24 px, `text-muted`, `aria-hidden`. Heading `text-16` SemiBold `text`; body `text-15` `text-secondary`; an optional action Button below.
- **States:** static.
- **Accessibility:** the heading level is a prop (default `h2`), so it fits the page outline.
- **Copy:** always given by the screen, with real names, for example "No students enrolled at {center} yet." Never "No data found". The component has no default text.

### ErrorState

- **Purpose:** shown when loading a section fails, and as the ErrorBoundary fallback.
- **Tokens:** left-aligned. Icon `circle-alert` 24 px in `danger-text`, `aria-hidden`. Heading `text-16` SemiBold `text`; message `text-15` `text-secondary`; a Retry button (secondary) when `onRetry` is given.
- **States:** static. Retry follows the Button states (loading while retrying).
- **Accessibility:** `role="alert"`, so the failure is announced once. Retry is a real `button`.
- **Copy:** heading from the screen, for example "Could not load the students of {center}." The message is the `ApiError` message from `lib/api.ts` (already in plain words, for example "Cannot reach the server. Please check your connection and try again."). Default for the ErrorBoundary: heading "Something went wrong on this page.", message "Reload the page to try again.", with a Reload button.

### Checkbox look

- **Purpose:** a native `input type="checkbox"` styled to the Figma choice box (361:2911). Figma draws no checked state, so the checked look is Developer-designed.
- **Tokens:** box 22 x 22 (`size-5.5`), `rounded-cell` (2px), 1px `border-subtle`, `bg-surface`. Checked: `bg-primary` and `border-primary`, with an inline check mark (Lucide `check`, stroke in `primary-contrast`, 2px stroke so it reads at 22 px). The label is `text-15` `text` beside the box with a gap of 12 px; the whole row is at least 44 px high and clicking the label toggles the box.
- **States:** default, hover (border `border`), focus-visible (2px black ring, 2px offset), checked, disabled (`opacity-50`, `cursor-not-allowed`), error (`aria-invalid` with a `danger-text` border and the message from FormField).
- **Accessibility:** a native checkbox, so Space toggles it and screen readers report checked or unchecked. The label is a real `label`. A one-of-many choice such as Male or Female uses native radio buttons with the same look, but round (`rounded-full`), built in Phase 2 with its form, not now.
- **Copy:** none of its own.
