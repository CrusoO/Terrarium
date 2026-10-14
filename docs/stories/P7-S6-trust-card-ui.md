# P7-S6: Trust Card UI

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** apps/web
- **Depends on:** P7-S5
- **Parallel with:** none

## Goal

HealthBadge and PrePublishPanel wired to publish-check SSE; build chat shows check progress.

## Contract changes

- None

## Acceptance criteria

- High dependency shows Unsafe badge and blocked panel
- Clean tool shows Healthy and publishes

## Non-goals

- Fix automatically wired in P7-S7

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
