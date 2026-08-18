# P3-S2: Stream agent steps into chat

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 3 — Real-time UX
- **Packages:** apps/web
- **Depends on:** P1-S4, P3-S1
- **Parallel with:** none

## Goal

Render SessionEvents and sandbox logs in the chat from SSE. No polling.

## Contract changes

- None

## Acceptance criteria

- EventSource (or fetch SSE) on GET /sessions/:id/events
- Each SessionEvent appears in chat in order
- No setInterval polling of session status
- Reconnect on drop without duplicating the whole history incorrectly

## Non-goals

- No healing-specific copy (P3-S4)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
