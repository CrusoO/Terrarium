# P7-S4: Live attack pass

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** packages/sandbox, apps/api
- **Depends on:** P7-S2, P7-S3
- **Parallel with:** none

## Goal

Pinned attacker container runs XSS, injection, IDOR, path traversal, and robustness probes against running drafts.

## Contract changes

- None

## Acceptance criteria

- Planted IDOR detected
- Clean React tool reports attempted > 0, succeeded = 0

## Non-goals

- No UI yet

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
