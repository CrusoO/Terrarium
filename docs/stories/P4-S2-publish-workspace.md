# P4-S2: Publish to personal workspace

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 4 — Saving, Security, and Dashboards
- **Packages:** apps/api, apps/web
- **Depends on:** P4-S1, P1-S4
- **Parallel with:** P4-S3

## Goal

Snapshot the current FileMap as a ToolVersion and list published tools for the actor (dev-user until Phase 6).

## Contract changes

- Add PublishToolRequest and ToolSummary

## Acceptance criteria

- Publish action stores FileMap as a new ToolVersion
- GET workspace tools returns ToolSummary list for the actor
- Opening a published tool can load FileMap into a session

## Non-goals

- No sharing (P6-S3)
- No Smart Match index (P5-S1) beyond storing summary text if cheap

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
