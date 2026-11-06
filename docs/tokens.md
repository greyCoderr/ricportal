# Design tokens

The tokens live in `client/src/styles/tokens.css` (Tailwind `@theme`). That file is the only place in the client that holds color values (DEC-022). Tailwind's default colors, font sizes, radii and shadows are reset; spacing uses Tailwind's default scale.

Source of every value:

- **Earlier session**: read from Figma in an earlier session, node ids as listed (original file; the working copy keeps the same ids).
- **2026-11-04**: read from Figma on 2026-11-04 in the working copy `EetVyXPcJxatZKCElGlqr6`, each node read once.
- **DEC-023**: RICPortal adjustment for WCAG AA, decided by the Developer.

Contrast is WCAG 2.x. Text needs 4.5:1; borders of controls need 3:1. A translucent fill is measured after mixing it over white (`surface`). The contrast test (`client/test/contrast.test.ts`) has no known failures.

## Colors

| Token | Value | Use | Figma node | Source |
| --- | --- | --- | --- | --- |
| `primary` | #D32F2F | Buttons, links, title (brand red) | 241:1105 button, 241:1097 title and links | Earlier session |
| `primary-contrast` | #FFFFFF | Text on primary | 258:5833 "Save Student" text | 2026-11-04 |
| `primary-hover` | #B32828 | Hover on primary buttons: `primary` mixed with 15% black, no new hue | none (Figma has no hover for the red button) | DEC-028 |
| `accent` | #025B02 | Admin dashboard cards and tiles | 267:9808 card border, 267:9826 tile icon box | 2026-11-04 |
| `accent-soft` | #025B02 at 24% | Quick-action tile fill | 267:9816 | 2026-11-04 |
| `success` | #025B02 | Approved badge (same value as accent) | 267:9767 | 2026-11-04 |
| `success-soft` | #025B02 at 24% | Approved pill | 267:9763 | 2026-11-04 |
| `warning` | #EDF902 | Pending hue: fills, borders, icons only. Never text | 267:9768 | 2026-11-04 |
| `warning-soft` | #EDF902 at 24% | Pending pill | 267:9764 | 2026-11-04 |
| `info` | #2D69C7 | For Review hue | 267:9769 | 2026-11-04 |
| `info-soft` | #2D69C7 at 24% | For Review pill | 267:9765 | 2026-11-04 |
| `danger` | #FF0000 | Rejected hue. A separate token from primary | 267:9770 | 2026-11-04 |
| `danger-soft` | #FF0000 at 24% | Rejected pill | 267:9766 | 2026-11-04 |
| `text` | #000000 | Main text | 241:1116 | Earlier session |
| `text-secondary` | #3C3C3C | Secondary text | 241:1115 | Earlier session |
| `text-muted` | #757575 | Helper text | 258:5474 | 2026-11-04 |
| `text-placeholder` | #757575 | Placeholders | 241:1106 (original #BFBFBF) | DEC-023 |
| `warning-text` | #6B5900 | Pending badge text, over-budget notes | 267:9768 (original #EDF902) | DEC-023 |
| `info-text` | #1F4E96 | For Review badge text | 267:9769 (original #2D69C7) | DEC-023 |
| `danger-text` | #A30000 | Rejected badge text, error text | 267:9770 (original #FF0000) | DEC-023 |
| `surface` | #FFFFFF | Page and input background | 241:1730 | Earlier session |
| `border` | #000000 | Input and button border, 1px | 241:1103 | Earlier session |
| `border-subtle` | #949494 | Form fields and panels in add enroll | 258:5480 (original #BFBFBF) | DEC-023 |
| `header` | #F0F0F0 | Top bar | 258:5454 | 2026-11-04 |
| `nav` | #000000 | Sidebar background | 166:658 | Earlier session |
| `nav-text` | #FFFFFF | Sidebar text | 258:5471 | 2026-11-04 |
| `nav-selected` | #FF8282 | Selected nav item background | 77:290 | Earlier session |
| `nav-selected-text` | #000000 | Selected nav item text | 77:290 (original #FFFFFF) | DEC-023 |
| `overlay` | black at 35% | Image overlay | 241:1102 | Earlier session |
| `skeleton` | `var(--color-header)` (#F0F0F0) | Alias for Skeleton blocks, so a later change of the skeleton color does not touch the header | none | DEC-028 |

The 24% tints are stored as `#RRGGBB3D`. Hex alpha 0x3D is 23.9%, the closest a hex value gets to 24%.

**Two reds (#D32F2F and #FF0000): confirm with the client.** Primary is #D32F2F and danger is #FF0000 (DEC-022).

## Contrast: client original and RICPortal adjusted

| Pair | Client original (Figma) | Ratio | RICPortal adjusted | Ratio |
| --- | --- | --- | --- | --- |
| Approved text on its pill | #025B02 on #025B02 24% | 5.56 | unchanged | 5.56 |
| Pending text on its pill | #EDF902 on #EDF902 24% | 1.10 | `warning-text` #6B5900 | 6.55 |
| For Review text on its pill | #2D69C7 on #2D69C7 24% | 3.79 | `info-text` #1F4E96 | 5.80 |
| Rejected text on its pill | #FF0000 on #FF0000 24% | 2.62 | `danger-text` #A30000 | 5.38 |
| Placeholder on white | #BFBFBF | 1.84 | `text-placeholder` #757575 | 4.61 |
| Field border on white (3:1) | #BFBFBF | 1.84 | `border-subtle` #949494 | 3.03 |
| Selected nav item text | #FFFFFF on #FF8282 | 2.40 | black on #FF8282 | 8.77 |
| Primary on white | #D32F2F | 4.98 | unchanged | 4.98 |
| White on primary | #FFFFFF on #D32F2F | 4.98 | unchanged | 4.98 |
| White on primary hover | none in Figma | | `primary-hover` #B32828 | 6.46 |
| Accent on white | #025B02 | 8.40 | unchanged | 8.40 |
| Main text on white | #000000 | 21.00 | unchanged | 21.00 |
| Secondary text on white | #3C3C3C | 11.03 | unchanged | 11.03 |
| Helper text on white | #757575 | 4.61 | unchanged | 4.61 |
| Text on the tile fill | #000000 on #025B02 24% | 13.89 | unchanged | 13.89 |
| Sidebar text | #FFFFFF on #000000 | 21.00 | unchanged | 21.00 |
| Input border on white (3:1) | #000000 | 21.00 | unchanged | 21.00 |

Not tokens, for reference: the danger hue #FF0000 as text on white is 4.00 (use `danger-text`, 8.21); the tile border #AAAAAA (267:9816) is 2.32 and is not tokenized.

Rules (DEC-023): hues are for fills, borders and icons; text uses the text tokens. `warning` (#EDF902) is never used as text, and a test fails if `text-warning` appears in client source.

## Type

| Token | Value | Source |
| --- | --- | --- |
| `font-sans` | Montserrat, self-hosted (`@fontsource/montserrat` 5.3.0, latin, weights 300, 400, 500, 600, 700) | Earlier session; weight 500 from 2026-11-04 (labels, placeholders, badges) |
| `text-10`, `text-11`, `text-12`, `text-13`, `text-16`, `text-18`, `text-20`, `text-24`, `text-42`, `text-48` | the same number in px | Earlier session |
| `text-15` | 15px: form labels 258:5476, tile title 267:9830, card label 267:9812 | 2026-11-04 (DEC-026) |
| `text-40` | 40px: dashboard card number 267:9811 | 2026-11-04 (DEC-026) |
| `tracking-label` | 0.1em on labels | Earlier session |

Line height is Figma's "auto" everywhere read, so no line-height tokens are set.

## Radius

| Token | Value | Use | Figma node | Source |
| --- | --- | --- | --- | --- |
| `rounded-cell` | 2px | Table cells, checkboxes, the add-enroll button | 258:5564, 258:5726, 258:5832 | 2026-11-04 |
| `rounded-control` | 8px | Inputs and buttons | Login inputs and buttons; 258:5480 | Earlier session; 2026-11-04 |
| `rounded-card` | 10px | Nav items, dashboard cards, status pills | 77:290; 267:9808; 267:9763 | Earlier session; 2026-11-04 |
| `rounded-icon` | 15px | Tile icon box | 267:9826 | 2026-11-04 |

## Shadows

Only three tokens (DESIGN_LANGUAGE rule 7). The file has no saved effect styles; there are 16 different shadows on the Admin and Teacher pages (BACKLOG).

| Token | Value | Figma use | Example nodes | Source |
| --- | --- | --- | --- | --- |
| `shadow-header` | 0 4px 20px 4px black 25% | Teacher top bar on every teacher screen (10 nodes) | 166:1560, 175:1030 | 2026-11-04 |
| `shadow-card` | 1px 1px 10px 1px black 25% | Admin dashboard cards (5 nodes) | 267:9808, 267:9702 | 2026-11-04 |
| `shadow-panel` | 2px 2px 8px 1px black 25% | Teacher panels, including add enroll (10 nodes) | 259:7514 | 2026-11-04 |

## Components read on 2026-11-04 (for P0-T12)

- **Status badge** (267:9763 to 267:9770): pill 101 x 20-21, `rounded-card`, `*-soft` fill, no border, no shadow; text Montserrat Medium 12 in the adjusted text color.
- **Dashboard card** (267:9808): 225 x 225, `surface` fill, `accent` border inside (per-side widths not read), `rounded-card`, `shadow-card`. Number Montserrat SemiBold 40 #003800 (not tokenized); label Montserrat Light 15 `text`; icon circle `accent-soft` 95 x 95.
- **Quick-action tile** (267:9816): 329 x 100, `accent-soft` fill, 1px #AAAAAA border inside (not tokenized), radius 0, no shadow. Icon box 80 x 80 `accent`, `rounded-icon`. Title Montserrat SemiBold 15; description Montserrat Medium 12.
- **Add enroll form** (258:5447): absolute positions, no auto layout. Inputs 44 high, `surface`, 1px border, `rounded-control`. Labels Montserrat Medium 15 `text`; placeholders Medium 15; section headings Medium 15 `primary`; helper `text-muted`. Button "Save Student" 140 x 32 `primary`, `rounded-cell`, text Medium 13 `primary-contrast`. The pixel gaps are hand-placed and not copied (Tailwind spacing scale instead).
