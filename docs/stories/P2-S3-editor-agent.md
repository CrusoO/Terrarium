# P2-S3: Editor Agent

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 2 — Core Agents
- **Packages:** packages/agents, apps/api
- **Depends on:** P1-S4, P2-S1
- **Parallel with:** P2-S2

## Goal

Apply targeted file edits for follow-up prompts without rewriting the whole app.

## Contract changes

- None

## Acceptance criteria

- Input includes existing FileMap + prompt
- Output FileMap changes only files required by the prompt
- Emits editor.started and editor.completed
- kind=new is rejected; caller must use Code Generator
- Does not call Docker

## Non-goals

- No full-app regenerate
- No publish

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
