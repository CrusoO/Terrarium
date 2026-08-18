# P3-S3: Live iframe refresh after edits

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 3 — Real-time UX
- **Packages:** apps/web
- **Depends on:** P3-S1, P3-S2
- **Parallel with:** P3-S4

## Goal

When editor.completed or preview.ready fires, refresh the iframe without reloading the parent page.

## Contract changes

- None

## Acceptance criteria

- On preview.ready, iframe src updates (cache-bust query allowed)
- On editor.completed followed by preview.ready, iframe shows new content
- Parent chat state is not wiped on refresh

## Non-goals

- No in-iframe HMR protocol of our own if sandbox Vite HMR already works — either is acceptable if the user sees the update

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
