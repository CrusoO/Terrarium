# Terrarium

AI-driven app builder: prompt → agents → Docker sandbox → live preview.

This is a **pnpm monorepo**. Architecture, frozen contracts, and the 24 stories live in [PLAN.md](PLAN.md). Cursor/agent workflow is in [AGENTS.md](AGENTS.md).

```powershell
npx pnpm@9.15.4 install
npx pnpm@9.15.4 --filter @terrarium/contracts build
npx pnpm@9.15.4 infra:up
```
