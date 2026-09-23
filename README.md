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

`infra:up` starts Postgres, Redis, Traefik, the API on port 3001, and the worker. The parent UI proxies `/sessions` to that API.

After a code change in the API, agents, or sandbox, rebuild those containers:

```powershell
docker compose -f infra/docker-compose.yml up -d --build api worker
```

## Using the app

Type a prompt in the chat. The Intent Agent may ask a few questions, then the preview opens on the right.

- **Publish** — on the preview header once the app is live. Saves that version to the workspace.
- **Workspace** — icon under Chat in the left rail. Opens saved apps, or puts one to sleep.
- **Use existing / Build new** — shown when Smart Match finds a published app with the same prompt.

## API without Docker for the API process

Use this only when the `api` and `worker` containers are not running. Postgres and Redis still come from Compose.

```powershell
python -m pip install uv
uv sync
uv run uvicorn terrarium_api.main:app --reload --host 0.0.0.0 --port 3001
uv run arq terrarium_api.worker.WorkerSettings
```
