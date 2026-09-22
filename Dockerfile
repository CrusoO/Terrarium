FROM node:22-bookworm-slim AS web

RUN npm install -g pnpm@9.15.4

WORKDIR /src

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
COPY packages/contracts ./packages/contracts

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @terrarium/web build

FROM python:3.12-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.8.22 /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
COPY apps/api ./apps/api
COPY packages/py-contracts ./packages/py-contracts
COPY packages/agents ./packages/agents
COPY packages/sandbox ./packages/sandbox
COPY packages/templates ./packages/templates

RUN uv sync --frozen --no-dev

COPY --from=web /src/apps/web/dist /app/web

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV TERRARIUM_TEMPLATES_DIR=/app/packages/templates
ENV TERRARIUM_WEB_DIST=/app/web

EXPOSE 10000

# Render sets PORT. The worker shares this container so generated sessions can run.
CMD ["sh", "-c", "arq terrarium_api.worker.WorkerSettings & exec uvicorn terrarium_api.main:app --host 0.0.0.0 --port ${PORT:-3001}"]
