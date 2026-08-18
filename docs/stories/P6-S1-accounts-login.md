# P6-S1: Accounts and login

> Generated from `docs/stories.catalog.json`. Do not hand-edit. Run `node scripts/generate-stories.mjs`.

- **Phase:** 6 — Access and Authentication
- **Packages:** apps/api, apps/web, packages/contracts
- **Depends on:** P4-S1
- **Parallel with:** none

## Goal

Replace dev-user with real signup/login and a session cookie or JWT.

## Contract changes

- Add User { id, email }, AuthSession, LoginRequest, SignupRequest
- Remove DEV_USER from production path; keep only as test fallback

## Acceptance criteria

- Signup and login work
- Authenticated requests carry user id
- POST /sessions uses the logged-in user, not dev-user
- Logout clears the session

## Non-goals

- No SSO/SAML unless already trivial
- No sharing yet

## Implementation notes

Read [PLAN.md](../../PLAN.md) before coding. Change only the packages listed above. If contract changes are not none, update `packages/contracts` first. Do not start work from another story.
