# P7-S5: Health status and server-side publish gate

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** apps/api
- **Depends on:** P7-S2, P7-S3, P7-S4
- **Parallel with:** none

## Goal

compute_health, provisional health during build, publish-check SSE, server refuses unsafe publish, health cache.

## Contract changes

- PublishToolRequest.acknowledgeWarnings
- ToolHealthResponse, PublishBlockedResponse

## Acceptance criteria

- POST /tools/{id}/publish on unsafe version returns 409
- Unchanged code reuses cached check in under 2s

## Non-goals

- No Trust Card UI

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
