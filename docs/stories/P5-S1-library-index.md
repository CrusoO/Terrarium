# P5-S1: Published-tool library index

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 5 — Smart Match
- **Packages:** apps/api, packages/contracts
- **Depends on:** P4-S2
- **Parallel with:** none

## Goal

Index each published tool (prompt, summary, stack) for later exact-problem matching.

## Contract changes

- Add ToolIndexRecord { toolId, stack, summary, promptFingerprint or embedding ref }

## Acceptance criteria

- Publish writes or updates an index record
- Index can be queried by prompt + stack
- Implementation may be embeddings or a deterministic fingerprint — pick one and document it in contracts comments

## Non-goals

- No UI offer yet (P5-S3)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
