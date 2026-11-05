What to do when a screen, state or object that Annex A needs is missing from the client's Figma
file. Never invent UI silently in code.

Steps:

(1) Confirm it is in scope in docs/blueprint/01-context.md; if not, stop and add it to
docs/BACKLOG.md as a change request.

(2) Check docs/figma-inventory.md, and the Figma file with one read at most, in case it exists
under another name.

(3) Find the closest existing Figma frame and the components and tokens that apply.

(4) Write docs/ui-specs/<screen>.md using this template: screen id and name; role and route;
purpose; layout in words plus a simple text wireframe; data shown with its API source; actions
with success and failure behavior; validation and exact message texts; states (loading, empty,
error, forbidden, read-only); permissions with BR numbers; responsive behavior under 768 px;
accessibility checks; acceptance checks; status.

(5) Follow docs/DESIGN_LANGUAGE.md and use only existing tokens and components. If a new
component is needed, propose it in the spec. Do not add colors, fonts or icon libraries.

(6) Mark the status "Developer-designed, client approval requested", update docs/UI_MAP.md and
docs/figma-inventory.md, and show me the spec. Wait for my approval before building.

(7) Build in two passes (static, then wired) with the same quality bar as Figma screens.

(8) When the client later adds the Figma frame, compare it with the built screen, list the
differences, and ask which wins. The Figma frame wins by default.
