# Terrarium

AI-driven app builder: prompt → agents → Docker sandbox → live iframe preview.

Mixed-language monorepo: **React** parent UI, **FastAPI** orchestration and agents. Architecture, frozen contracts, and the 24 stories live in [PLAN.md](PLAN.md). Cursor/agent workflow is in [AGENTS.md](AGENTS.md).

```powershell
npx pnpm@9.15.4 install
npx pnpm@9.15.4 --filter @terrarium/contracts build
python -m pip install uv
uv sync
npx pnpm@9.15.4 infra:up
```

Parent UI: `npx pnpm@9.15.4 --filter @terrarium/web dev` → http://localhost:5173/

API: `uv run uvicorn terrarium_api.main:app --reload --host 0.0.0.0 --port 3001`
