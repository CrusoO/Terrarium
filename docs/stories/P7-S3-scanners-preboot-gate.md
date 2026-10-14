# P7-S3: Scanners and pre-boot gate

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 7 — Trust, remediation, and change requests
- **Packages:** packages/sandbox, apps/api
- **Depends on:** P7-S1
- **Parallel with:** P7-S2

## Goal

OSV, Semgrep, gitleaks, and Trivy run in pinned containers; secrets and high/critical code findings block boot.

## Contract changes

- None

## Acceptance criteria

- FileMap with sk_live_ blocked before boot
- Fixture dependency advisory yields finding with advisoryId and fixedVersions

## Non-goals

- No attack pass yet

## Implementation notes

Read [ARCHITECTURE.md](../../ARCHITECTURE.md) and [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` (Zod) and `packages/py-contracts` (Pydantic) first. Do not start work from another story. Live preview is always an iframe URL; Monaco is not the running app.
