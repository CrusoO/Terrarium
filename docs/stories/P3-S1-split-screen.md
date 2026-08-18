# P3-S1: Split-screen chat and iframe

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 3 — Real-time UX
- **Packages:** apps/web
- **Depends on:** P1-S2, P1-S4
- **Parallel with:** P3-S2

## Goal

Chat on the left, live tool iframe on the right (desktop). Stack vertically on small screens.

## Contract changes

- None

## Acceptance criteria

- Desktop: two-pane layout chat | iframe
- Narrow viewport: chat above iframe
- Iframe src is only the sandbox previewUrl
- Empty state shown when no preview yet

## Non-goals

- No dashboard (P4-S4)
- No auth chrome (P6)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
