# P6-S2: Ownership and roles

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 6 — Access and Authentication
- **Packages:** apps/api, packages/contracts, packages/py-contracts
- **Depends on:** P6-S1, P4-S2
- **Parallel with:** none

## Goal

Every tool has an owner. Roles are owner, editor, viewer.

## Contract changes

- Add ToolMember { toolId, userId, role: ToolRole }

## Acceptance criteria

- Publisher is owner
- Role enum is owner | editor | viewer only
- Queries can list members for a tool

## Non-goals

- No invite UI yet (P6-S3)
- No preview URL authz yet (P6-S4)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
