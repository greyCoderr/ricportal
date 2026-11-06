// Class lists shared by the UI kit (DEC-028). Tokens only (DEC-022).

// 2px black outline with a 2px offset on keyboard focus. Components on black
// areas (the sidebar, P0-T13) use `focus-visible:outline-nav-text` instead.
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

// Input, Textarea and Select: the desktop Figma controls (tokens.md), with the
// adjusted border-subtle (DEC-023).
export const CONTROL = [
  "w-full rounded-control border border-border-subtle bg-surface px-3",
  // 16 px on phones so iOS Safari does not zoom on focus; 15 px from md up.
  "text-16 md:text-15 text-text hover:border-border",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger-text",
  FOCUS_RING,
].join(" ");

export function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
