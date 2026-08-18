# P1-S2: Parent prompt shell

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 1 — Foundation and Sandbox
- **Packages:** apps/web, packages/contracts, packages/py-contracts
- **Depends on:** P1-S1
- **Parallel with:** P1-S3

## Goal

Build the parent app prompt box that POSTs to /sessions and shows a stub event log so the API and iframe can be wired in P1-S4.

## Contract changes

- Add CreateSessionRequest { prompt: string } and CreateSessionResponse { sessionId: string } in Zod and Pydantic

## Acceptance criteria

- Prompt textarea and submit button exist
- Submit calls POST /sessions with CreateSessionRequest
- A visible event-log area can render SessionEvent objects (may be empty until P1-S4)
- Types imported from @terrarium/contracts only in the web app
- CreateSessionRequest and CreateSessionResponse exist in Pydantic as well

## Non-goals

- No split-screen iframe layout (P3-S1)
- No SSE client (P3-S2)
- No auth UI

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
