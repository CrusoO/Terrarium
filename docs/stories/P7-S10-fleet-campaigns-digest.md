# P7-S10: Fleet campaigns and morning digest

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** apps/api, apps/relay, apps/web
- **Depends on:** P7-S7, P7-S9
- **Parallel with:** none

## Goal

Nightly campaigns batch-fix advisory across tools; 08:00 digest; Security page in web.

## Contract changes

- None

## Acceptance criteria

- One advisory across 5 tools creates one campaign patching all 5
- Digest lists result; APPROVE 1 publishes through gate

## Non-goals

- No new scanner types

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
