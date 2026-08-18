# P6-S3: Share with teammates

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 6 — Access and Authentication
- **Packages:** apps/api, apps/web
- **Depends on:** P6-S2
- **Parallel with:** none

## Goal

Owner can invite a teammate by email or user id and list members.

## Contract changes

- Add ShareToolRequest { emailOrUserId, role }

## Acceptance criteria

- Owner can add a member with editor or viewer
- Members list is visible to owner and editors
- Non-owners cannot change membership

## Non-goals

- No public unlisted links
- No org-wide admin console

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
