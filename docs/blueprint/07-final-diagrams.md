# 9. Final ERD and DFD (Phase 8)

At the end of development, Claude generates the final diagrams from the real system. They replace the paper's diagrams in the clients' defense.

## 9.1 Inputs

- `server/prisma/schema.prisma` (the truth for the ERD).
- The route list and the permission matrix (the truth for the DFD flows).
- Sections 4.11 and 4.12 of this blueprint (the required entities, relationships, processes and stores).
- `docs/DATA_MODEL.md` and `docs/API.md`.

## 9.2 Steps

1. Generate the ERD as a Mermaid `erDiagram` from the Prisma schema. Include every table, its primary and foreign keys and the important columns. Show cardinalities. Save `docs/diagrams/erd.mmd` and export `erd.png`.
2. Compare the ERD with 4.11. List differences. Anything missing from the code is a defect to fix; anything extra needs an explanation in DECISIONS.md.
3. Generate the DFD from 4.12: a Level 0 context diagram, and one Level 1 diagram per external entity (Administrator, RIC Teacher, Parent). Save as Mermaid or diagrams.net (draw.io) XML in `docs/diagrams/`, and export PNGs.
4. Check every DFD flow against a real endpoint in `docs/API.md`. A flow without an endpoint is removed or logged as a defect. An endpoint without a flow is added to the diagram.
5. Check the notation rules: every process has a unique number and a verb-noun name; every data store has a unique ID and one meaning; flows are labelled with nouns; no flow goes directly between two data stores or two external entities; every process has at least one input and one output.
6. Produce `docs/diagrams/README.md`: what each diagram shows, how it differs from the paper's diagrams and why.

## 9.3 Output files

`docs/diagrams/erd.mmd`, `erd.png`, `dfd-level0.mmd`, `dfd-level1-admin.mmd`, `dfd-level1-teacher.mmd`, `dfd-level1-parent.mmd`, their PNGs, and `README.md`.
