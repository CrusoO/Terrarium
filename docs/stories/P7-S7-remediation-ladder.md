# P7-S7: Remediation ladder, policy, and ledger

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** packages/agents, apps/api, apps/web
- **Depends on:** P7-S5, P7-S6
- **Parallel with:** none

## Goal

Seven-step remediation ladder with policy, ledger, nightly re-scan job, and Fix automatically in UI.

## Contract changes

- LedgerResponse export formats

## Acceptance criteria

- Vulnerable dependency patched and auto-published
- Critical contained never suppressed
- replace_package without allowlist refused

## Non-goals

- No fleet campaigns yet

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
