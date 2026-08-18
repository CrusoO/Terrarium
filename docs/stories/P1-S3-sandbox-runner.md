# P1-S3: Isolated Docker sandbox runner

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 1 — Foundation and Sandbox
- **Packages:** packages/sandbox, infra
- **Depends on:** P1-S1
- **Parallel with:** P1-S2

## Goal

Start and stop a fixture app in Docker with resource limits and a unique preview URL. No agents.

## Contract changes

- Add SandboxHandle { sessionId, previewUrl, containerId }
- Add HealthReport { status: RuntimeStatus, logs: string }

## Acceptance criteria

- Can start a fixture React app container for a sessionId
- CPU, memory, PID, and network limits are applied
- Returns a Traefik preview URL of the form {sessionId}.sandbox.local (or configured host)
- Health check returns running or unhealthy with logs
- Stop removes the container
- Generated code never runs on the API host

## Non-goals

- No LLM
- No sleep/wake scheduler (P4-S3)
- No auth on preview URL (P6-S4)

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
