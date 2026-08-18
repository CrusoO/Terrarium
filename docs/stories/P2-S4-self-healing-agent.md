# P2-S4: Self-Healing Agent (max 3)

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 2 — Core Agents
- **Packages:** packages/agents, apps/api
- **Depends on:** P2-S1, P2-S2, P2-S3, P1-S3
- **Parallel with:** none

## Goal

On sandbox.unhealthy, attach logs, route back through Intent to Editor or Code Generator, retry at most 3 times, then emit heal.exhausted.

## Contract changes

- Add healAttempt: number on AgentJob.errorContext or session state (0–3)

## Acceptance criteria

- sandbox.unhealthy triggers healer with logs
- Each retry emits heal.attempt with the attempt number
- After 3 failed retries, emit heal.exhausted and stop looping
- Successful retry continues to preview.ready
- No silent infinite loops

## Non-goals

- No parent UX for retries (P3-S4)
- No changing max retries via UI

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
