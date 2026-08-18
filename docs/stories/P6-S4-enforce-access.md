# P6-S4: Enforce API and preview access

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 6 — Access and Authentication
- **Packages:** apps/api, packages/sandbox, apps/web
- **Depends on:** P6-S3, P1-S3
- **Parallel with:** none

## Goal

API and sandbox preview URLs require authorization. Unauthenticated iframe access is denied. Viewer cannot edit; editor can.

## Contract changes

- None required if roles already exist; add ErrorCode FORBIDDEN if missing

## Acceptance criteria

- Unauthenticated GET preview URL returns 401/403, not the app
- Viewer can open preview, cannot POST edits
- Editor and owner can POST edits
- Non-members cannot load the tool from dashboard or API

## Non-goals

- No custom domain ACLs

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
