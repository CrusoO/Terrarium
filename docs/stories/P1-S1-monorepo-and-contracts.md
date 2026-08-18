# P1-S1: Monorepo, Compose, and contracts skeleton

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 1 — Foundation and Sandbox
- **Packages:** pnpm-workspace.yaml, packages/contracts, infra, apps/web, apps/api
- **Depends on:** none
- **Parallel with:** none

## Goal

Create the pnpm workspace, empty package folders, Postgres/Redis/Traefik Compose, and the contracts package with frozen types from PLAN.md so every later story has a place to land.

## Contract changes

- Add Stack, IntentKind, SessionEventName, FileMap, Intent, AgentJob, AgentResult, SessionEvent, RuntimeStatus as Zod + TS types
- Export actorId stub constant DEV_USER = "dev-user"

## Acceptance criteria

- pnpm-workspace.yaml lists apps/* and packages/*
- packages/contracts builds and exports the frozen types from PLAN.md
- infra/docker-compose.yml starts Postgres, Redis, and Traefik
- apps/web and apps/api exist as stub packages that depend on contracts
- pnpm install succeeds at repo root

## Non-goals

- No real UI beyond a blank Vite app
- No Docker sandbox runner
- No LLM agents
- No auth

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
