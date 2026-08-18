# P4-S3: Idle sleep and wake

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 4 — Saving, Security, and Dashboards
- **Packages:** packages/sandbox, apps/api
- **Depends on:** P1-S3, P4-S1
- **Parallel with:** P4-S2

## Goal

Stop sandbox containers after inactivity and wake them when the user opens the tool. Status is sleeping or running.

## Contract changes

- RuntimeStatus already includes sleeping; ensure ToolSummary.status uses it

## Acceptance criteria

- Configurable idle timeout stops the container
- Open/wake starts the container and returns previewUrl
- Status exposed as sleeping | running | stopped
- Sleep does not delete ToolVersion files

## Non-goals

- No multi-region scale-to-zero

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
