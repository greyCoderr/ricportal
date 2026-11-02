---
name: ricportal-ui-states
description: Use when building or changing any screen in RICPortal
---
Every screen must handle these states using components from client/src/components/ui:
- Loading: Skeleton or Spinner. Never a blank page.
- Empty: EmptyState with a clear message and the main action button.
- Error: ErrorState with a Retry button.
- Forbidden: the 403 page.
- Busy: buttons show a loading state and are disabled while saving.
Also: validation messages under each field; ConfirmDialog for every destructive action;
a success Toast after saving; layout works at 360 px width; keyboard focus order is logical.
Use design tokens only. Never hard-code colors or sizes. Match the Figma frame.
