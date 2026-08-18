# P1-S4: Session API, SSE, and stub worker

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 1 — Foundation and Sandbox
- **Packages:** apps/api, apps/web
- **Depends on:** P1-S1, P1-S2, P1-S3
- **Parallel with:** none

## Goal

Create a session, enqueue a job, stream SessionEvents over SSE, and set the parent iframe when preview.ready fires. Worker is an echo stub (no LLM).

## Contract changes

- Document POST /sessions and GET /sessions/:id/events (SSE of SessionEvent)

## Acceptance criteria

- POST /sessions returns sessionId and enqueues a BullMQ job
- Stub worker writes a fixture FileMap, starts sandbox, emits sandbox.ready then preview.ready
- SSE stream delivers those events
- Parent UI sets iframe src to previewUrl on preview.ready
- No LLM calls

## Non-goals

- No Intent/CodeGen/Editor agents
- No self-heal loop
- No persist/publish

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
