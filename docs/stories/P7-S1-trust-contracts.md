# P7-S1: Trust and change-request contracts

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** packages/contracts, packages/py-contracts, ARCHITECTURE.md
- **Depends on:** P6-S4
- **Parallel with:** none

## Goal

Add acceptance checks, vulnerability findings, tool health, remediation, change-request types, and new SessionEvent names to both contract packages with identical camelCase JSON.

## Contract changes

- AcceptanceCheck, AcceptanceCheckResult; Intent.acceptanceChecks
- VulnerabilityFinding, VulnSource, Severity
- HealthStatus, CheckStep, ToolHealth
- RemediationStrategy, RemediationAttempt, Suppression, RemediationCampaign, LedgerEntry
- ChangeChannel, ChangeRequestStatus, ChangeRequest, ChannelLink
- SessionEventName: check.*, publish.blocked, vuln.*, change.* with documented payloads

## Acceptance criteria

- packages/contracts and packages/py-contracts build
- Round-trip test serializes every new type in TypeScript and parses in Python

## Non-goals

- No sandbox or API behavior yet

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
