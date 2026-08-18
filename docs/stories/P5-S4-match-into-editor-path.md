# P5-S4: Accepted match loads Editor path

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 5 — Smart Match
- **Packages:** apps/api
- **Depends on:** P5-S3, P2-S3, P4-S2
- **Parallel with:** none

## Goal

If the user accepts a match, load that tool's FileMap into the sandbox (Editor path) and skip Code Generator.

## Contract changes

- Add AcceptMatchRequest { sessionId, toolId }

## Acceptance criteria

- Accepting a match does not emit codegen.started
- FileMap from the published version is loaded
- Sandbox boots and preview.ready fires
- Further prompts use Editor (kind=modify, toolId set)

## Non-goals

- No fork/copy permissions beyond owner until P6

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
