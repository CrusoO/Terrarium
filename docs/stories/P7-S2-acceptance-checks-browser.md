# P7-S2: Acceptance checks in a real browser

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** packages/agents, packages/sandbox, apps/api
- **Depends on:** P7-S1
- **Parallel with:** none

## Goal

Intent proposes user-observable checks; agents compile Playwright scripts; sandbox runs them with screenshots; failures feed self-heal.

## Contract changes

- None

## Acceptance criteria

- Planted broken button fails check and triggers heal
- Typical React tool checks finish in under 25s

## Non-goals

- No publish gate yet

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
