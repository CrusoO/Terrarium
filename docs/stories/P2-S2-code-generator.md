# P2-S2: Code Generator Agent

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 2 — Core Agents
- **Packages:** packages/agents, packages/templates, apps/api
- **Depends on:** P1-S4, P2-S1
- **Parallel with:** P2-S3

## Goal

Fill packages/templates/{stack} from Intent and return a FileMap for the sandbox. New apps only.

## Contract changes

- None beyond AgentJob / AgentResult already frozen

## Acceptance criteria

- templates/react and templates/fullstack exist as runnable starters
- Generator returns FileMap derived from the matching template
- Emits codegen.started and codegen.completed
- API hands FileMap to sandbox (does not call Docker from the agent)
- kind=modify is rejected; caller must use Editor

## Non-goals

- No targeted diffs
- No self-heal

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
