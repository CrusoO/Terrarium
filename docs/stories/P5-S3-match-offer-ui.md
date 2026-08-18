# P5-S3: Use existing vs build new

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 5 — Smart Match
- **Packages:** apps/web
- **Depends on:** P5-S2, P3-S2
- **Parallel with:** none

## Goal

When smartmatch.hit fires, show the existing tool and let the user choose Use existing or Build new. Never auto-overwrite intent.

## Contract changes

- None

## Acceptance criteria

- Hit shows tool summary and two actions
- Build new continues to Code Generator
- Use existing is posted back to the API
- No automatic navigation without a click

## Non-goals

- No permission checks beyond current actor (P6)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
