# P2-S1: Intent Agent

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 2 — Core Agents
- **Packages:** packages/agents, apps/api
- **Depends on:** P1-S4
- **Parallel with:** P2-S2, P2-S3

## Goal

Classify the prompt as new vs modify and react vs fullstack, optionally attach toolId, and emit intent.classified.

## Contract changes

- Intent type is already frozen; add IntentAgentInput/Output aliases if needed without changing fields

## Acceptance criteria

- Given a prompt, returns Intent { kind, stack, summary, toolId? }
- Modify requires an existing session/tool FileMap or toolId
- API persists intent.classified on the session SSE stream
- Does not write files or start Docker

## Non-goals

- No Smart Match (Phase 5)
- No code generation

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
