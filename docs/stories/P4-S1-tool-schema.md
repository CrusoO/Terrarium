# P4-S1: Tool, version, and session schema

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 4 — Saving, Security, and Dashboards
- **Packages:** apps/api, packages/contracts, packages/py-contracts
- **Depends on:** P1-S1
- **Parallel with:** P2-S1

## Goal

Add SQLAlchemy models for Tool, ToolVersion, and Session in Postgres, with types exported from both contract packages.

## Contract changes

- Add Tool, ToolVersion, Session DTOs (id, ownerId, status, createdAt, file snapshot metadata)

## Acceptance criteria

- Alembic migration applied on Postgres from Compose
- Tool, ToolVersion, Session tables exist
- DTOs live in packages/contracts and packages/py-contracts
- API can create a Session row when POST /sessions runs

## Non-goals

- No publish UI
- No sleep scheduler

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
