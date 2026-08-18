# P5-S2: Smart Match pre-check

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 5 — Smart Match
- **Packages:** packages/agents, apps/api
- **Depends on:** P5-S1, P2-S1
- **Parallel with:** none

## Goal

After the user prompt, before Code Generator, scan the library and emit smartmatch.hit or smartmatch.miss.

## Contract changes

- Add SmartMatchResult { hit: boolean, toolId?: string, score?: number }

## Acceptance criteria

- Runs immediately after prompt, before codegen.started
- hit emits smartmatch.hit with toolId
- miss emits smartmatch.miss and pipeline continues to Intent/CodeGen
- Does not start Code Generator on hit until the user chooses

## Non-goals

- No auto-load of the matched tool (P5-S4)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
