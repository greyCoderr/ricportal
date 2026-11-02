---
name: ricportal-docs
description: Use after finishing any task to update project documentation in RICPortal
---
After each task update, in the same commit:
- docs/PHASE_LOG.md: one line with task ID, date, what was done, decisions, what is left.
- docs/API.md for each endpoint added or changed.
- docs/DATA_MODEL.md after each migration, including a Mermaid erDiagram of the current schema.
- docs/UI_MAP.md for each screen: ID, route, role, status.
- docs/DECISIONS.md for any decision or resolved conflict.
- docs/BACKLOG.md for anything deferred.
Describe what the code does now. Remove stale text. Never include secrets or real personal data.
