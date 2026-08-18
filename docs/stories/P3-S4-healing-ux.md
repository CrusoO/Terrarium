# P3-S4: Healing retry UX

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 3 — Real-time UX
- **Packages:** apps/web
- **Depends on:** P2-S4, P3-S2
- **Parallel with:** P3-S3

## Goal

Show retry n/3 while healing. On heal.exhausted, show the error and a Retry anyway action that starts a new attempt without changing the default max of 3.

## Contract changes

- None

## Acceptance criteria

- heal.attempt renders Retry 1/3, 2/3, or 3/3
- heal.exhausted shows error logs in chat
- Retry anyway posts a new session message / job; default auto max remains 3
- Healthy preview still uses the iframe path

## Non-goals

- Do not raise the automatic retry cap

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
