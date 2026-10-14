# P7-S9: Worker integration for change requests

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** apps/api, packages/agents, apps/web
- **Depends on:** P7-S7, P7-S8
- **Parallel with:** none

## Goal

ARQ worker polls relay, proposes tests, builds draft, runs publish gate, PUBLISH/UNDO commands.

## Contract changes

- Tool.autoApproveTests optional

## Acceptance criteria

- Integration test: queue, YES, build, gate, PUBLISH, UNDO; viewer never builds; unsafe never published

## Non-goals

- Morning digest in P7-S10

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
