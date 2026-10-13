# Terrarium

AI-driven app builder: prompt → agents → Docker sandbox → live iframe preview.

Mixed-language monorepo: **React** parent UI, **FastAPI** orchestration and agents. Architecture, frozen contracts, and the 24 stories live in [PLAN.md](PLAN.md). Cursor/agent workflow is in [AGENTS.md](AGENTS.md).

## Run locally

Docker Desktop must be running. Copy `.env.example` to `.env` and fill the keys. Do not commit `.env`.

- `GEMINI_API_KEY` — Intent Agent
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — Code Generator and Editor through Bedrock (Claude)

```powershell
npx pnpm@9.15.4 install
npx pnpm@9.15.4 --filter @terrarium/contracts build
npx pnpm@9.15.4 infra:up
npx pnpm@9.15.4 --filter @terrarium/web dev
```

Open http://localhost:5173/

`infra:up` starts Postgres (**host port 5433**), Redis (**6380**), Traefik, the API on port 3001, and the worker — so Terrarium does not bind 5432/6379 if another project already uses them. The parent UI proxies `/sessions` to that API.

After a code change in the API, agents, or sandbox, rebuild those containers:

```powershell
docker compose -f infra/docker-compose.yml up -d --build api worker
```

For local demo/codegen runs that use `infra/docker-compose.codegen-metrics.yml`, set the metrics host path before starting Compose so sandbox type checks can mount the generated workspace:

```powershell
$env:TERRARIUM_METRICS_HOST="C:\Users\thakur\Downloads\Terrarium\Terrarium\docs\codegen-metrics"
docker compose -f infra/docker-compose.yml -f infra/docker-compose.codegen-metrics.yml up -d --build
```

## Using the app

Type a prompt in the chat. The Intent Agent may ask a few questions, then the preview opens on the right.

- **Publish** — on the preview header once the app is live. Saves that version to the workspace.
- **Workspace** — icon under Chat in the left rail. Opens saved apps, or puts one to sleep.
- **Use existing / Build new** — shown when Smart Match finds a published app with the same prompt.

## QA branch workflow

`main` stays stable. Version 2 / QA work happens on the `Terrarium-V.2` branch.

For a fresh clone:

```powershell
git clone https://github.com/CrusoO/Terrarium.git
cd Terrarium
git fetch origin
git switch Terrarium-V.2
```

For an existing clone:

```powershell
git fetch origin
git switch Terrarium-V.2
git pull --rebase
```

Before starting work each day, run `git pull --rebase`. Push QA changes back to the same branch with `git push`. Do not open a pull request into `main` until the QA version is ready to merge.

## Replay CI

Replay mode tests codegen without live model calls or model spend. The GitHub workflow `codegen-replay` sets `CODEGEN_LLM_MODE=replay`, installs the Python workspace with `uv sync --dev`, then runs:

```powershell
uv run python scripts/codegen-fixtures.py
uv run python scripts/codegen-sweep.py --model haiku
uv run pytest packages/agents/tests -q
```

Replay uses saved fixtures to catch regressions in intent, codegen, repair, and sandbox logic. Live Bedrock/Gemini runs are manual and spend-capped; CI must stay on replay.

## Version 2 stack scope

Version 2 plans a structured stack selector as the sixth clarify question. The intended supported matrix is:

- React/Vite frontend-only or React/Vite + Node/Express.
- Angular frontend-only or Angular + Node/Express.
- SAPUI5/Fiori frontend-only or SAPUI5/Fiori + SAP CAP Node/OData with local mock data.

Unsupported custom stacks should stop before codegen with a clear message rather than silently generating React. Real SAP/BTP destinations and credentials are a later human configuration step and must not be committed.

## API without Docker for the API process

Use this only when the `api` and `worker` containers are not running. Postgres and Redis still come from Compose.

```powershell
# Install uv with the official installer or your package manager first; do not use global pip installs.
uv sync
uv run uvicorn terrarium_api.main:app --reload --host 0.0.0.0 --port 3001
uv run arq terrarium_api.worker.WorkerSettings
```
