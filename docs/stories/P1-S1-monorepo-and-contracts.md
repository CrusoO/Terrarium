# P1-S1: Monorepo, Compose, and contracts skeleton

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 1 — Foundation and Sandbox
- **Packages:** pnpm-workspace.yaml, pyproject.toml, packages/contracts, packages/py-contracts, infra, apps/web, apps/api, packages/agents, packages/sandbox
- **Depends on:** none
- **Parallel with:** none

## Goal

Create the mixed-language workspace (pnpm for React/Zod, uv for FastAPI/Pydantic/agents/sandbox), Postgres/Redis/Traefik Compose, and frozen contracts in both languages so every later story has a place to land.

## Contract changes

- Add Stack, IntentKind, SessionEventName, FileMap, Intent, AgentJob, AgentResult, SessionEvent, RuntimeStatus as Zod + TS in packages/contracts and matching Pydantic models in packages/py-contracts
- Export actorId stub constant DEV_USER = "dev-user" in both languages

## Acceptance criteria

- pnpm-workspace.yaml lists apps/web and packages/contracts
- Root uv workspace lists apps/api, packages/py-contracts, packages/agents, packages/sandbox
- packages/contracts builds and exports the frozen types from PLAN.md
- packages/py-contracts exports matching Pydantic models with camelCase JSON fields
- infra/docker-compose.yml starts Postgres, Redis, and Traefik
- apps/web is a Vite stub that depends on @terrarium/contracts
- apps/api is a FastAPI stub that depends on terrarium-contracts
- pnpm install succeeds at repo root
- uv sync succeeds at repo root

## Non-goals

- No real UI beyond a blank Vite app
- No Docker sandbox runner
- No LLM agents
- No auth

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
