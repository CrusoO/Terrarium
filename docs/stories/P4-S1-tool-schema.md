# P4-S1: Tool, version, and session schema

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 4 — Saving, Security, and Dashboards
- **Packages:** apps/api, packages/contracts
- **Depends on:** P1-S1
- **Parallel with:** P2-S1

## Goal

Add Prisma models for Tool, ToolVersion, and Session in Postgres, with types exported from contracts.

## Contract changes

- Add Tool, ToolVersion, Session DTOs (id, ownerId, status, createdAt, file snapshot metadata)

## Acceptance criteria

- Prisma schema migrated on Postgres from Compose
- Tool, ToolVersion, Session tables exist
- DTOs live in packages/contracts
- API can create a Session row when POST /sessions runs

## Non-goals

- No publish UI
- No sleep scheduler

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
