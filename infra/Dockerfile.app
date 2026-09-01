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

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV TERRARIUM_TEMPLATES_DIR=/app/packages/templates

EXPOSE 3001
