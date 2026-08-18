# P4-S4: Workspace dashboard

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 4 — Saving, Security, and Dashboards
- **Packages:** apps/web, apps/api
- **Depends on:** P4-S2, P4-S3
- **Parallel with:** none

## Goal

List the actor's tools with status, last version, and open (wake + preview).

## Contract changes

- None if ToolSummary already has status and updatedAt

## Acceptance criteria

- Dashboard lists published tools
- Each row shows sleeping|running and last published time
- Open wakes if needed and navigates to split-screen with preview

## Non-goals

- No teammate sharing UI (P6-S3)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
