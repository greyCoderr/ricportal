RICPortal design language. Rule 0: the client's Figma wins on every screen it contains. This
language only fills gaps and details Figma leaves open. Never restyle a Figma screen without
the Developer's approval.

Identity: RICPortal replaces paper forms in barangay centers. It should feel like a well-kept
logbook: calm, clear, plain words, big readable numbers. It is not a SaaS dashboard.

Rules:

1 Ledger first. Tables follow the official forms: thin ruled lines, right-aligned numbers with
  tabular figures, a total row with a single rule above and a double rule below. Amounts are
  written PHP 1,234.00.

2 Stamps for decisions. On report detail and submitted liquidation, Approved, Need revision and
  Submitted appear as outlined stamps: rectangular, 2px border, uppercase, letter-spaced, text
  in the adjusted text colors, rotated at most 2 degrees. Lists use the client's plain pills.

3 Plain words with real names. Use the center name and the dish name in headings, empty states
  and messages. Never write "No data found".

4 The dish is the hero. Calendar days show the dish name at a readable size. Saturday and
  Sunday items (Nutribun, Nutri Cookie) are quieter. Today has a red top rule.

5 Parent screens feel like a market list: one task per screen, touch targets at least 44 px,
  numbers at 16 px or larger, a check mark when saved.

6 Colors by meaning: red = action, green = program and success, black = structure. Over-budget
  notes use warning-text, never red or green. Never color alone: pair color with a word or icon.

7 Restraint: no gradients, glass effects, emoji icons, decorative blobs, stock illustrations,
  purple, or hero banners on app screens. Cards only for real objects (a day, a report). Use
  only the three shadow tokens, at most one level per screen. Left-aligned layouts.

8 Motion confirms, never decorates: a saved check and a 600 ms row highlight. No page-load
  animation.

9 Density: Teacher and Admin screens are denser (tables, filters); Parent screens are roomy.

10 Local identity, only with client approval: the RIC emblem, the Libmanan seal and the header
  "Republic of the Philippines, Province of Camarines Sur, Municipality of Libmanan, Municipal
  Rural Improvement Club" on the login page and on PDFs, like the MAO letterhead. Sample data
  uses Filipino names and PHP.

Accessibility: WCAG AA contrast, visible focus rings, keyboard order, labels on every field.
