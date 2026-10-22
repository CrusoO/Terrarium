# P7-S8: WhatsApp relay service

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** apps/relay, packages/py-contracts
- **Depends on:** P7-S1
- **Parallel with:** P7-S5

## Goal

Always-on apps/relay stores change requests, verifies webhooks, worker lease API, no agents or Docker.

## Contract changes

- None

## Acceptance criteria

- Signed webhook creates one request; replay ignored; unsigned 403
- Expired lease returns request to queued

## Non-goals

- No laptop worker yet

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
