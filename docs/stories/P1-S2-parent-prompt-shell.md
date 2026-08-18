# P1-S2: Parent prompt shell

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 1 — Foundation and Sandbox
- **Packages:** apps/web
- **Depends on:** P1-S1
- **Parallel with:** P1-S3

## Goal

Build the parent app prompt box that POSTs to /sessions and shows a stub event log so the API and iframe can be wired in P1-S4.

## Contract changes

- Add CreateSessionRequest { prompt: string } and CreateSessionResponse { sessionId: string }

## Acceptance criteria

- Prompt textarea and submit button exist
- Submit calls POST /sessions with CreateSessionRequest
- A visible event-log area can render SessionEvent objects (may be empty until P1-S4)
- Types imported from @terrarium/contracts only

## Non-goals

- No split-screen iframe layout (P3-S1)
- No SSE client (P3-S2)
- No auth UI

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
