# Production Dockerfile for Terrarium
# Multi-stage build for optimal image size

# Stage 1: Builder - Install dependencies
FROM python:3.11-slim as builder

WORKDIR /build

# Install system dependencies for Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python package files
COPY packages/agents/pyproject.toml packages/agents/
COPY packages/py-contracts/pyproject.toml packages/py-contracts/
COPY packages/sandbox/pyproject.toml packages/sandbox/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -e packages/agents -e packages/py-contracts -e packages/sandbox

# Stage 2: Runtime - Create final image
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    docker.io \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY packages/ /app/packages/
COPY apps/api /app/apps/api
COPY alembic.ini /app/
COPY alembic/ /app/alembic/

# Set Python path
ENV PYTHONPATH=/app/packages:/app/apps/api:$PYTHONPATH

# Create non-root user for security
RUN useradd -m -u 1000 terrarium && chown -R terrarium:terrarium /app
USER terrarium

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Startup script
COPY --chown=terrarium:terrarium <<'EOF' /app/start.sh
#!/bin/bash
set -e

echo "🚀 Starting Terrarium..."

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "${DATABASE_HOST:-localhost}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USER:-terrarium}"; do
  sleep 2
done
echo "✅ PostgreSQL is ready"

# Run database migrations
echo "🔄 Running database migrations..."
cd /app
alembic upgrade head
echo "✅ Migrations complete"

# Start services in parallel
echo "🌐 Starting FastAPI server..."
uvicorn apps.api.main:app --host 0.0.0.0 --port 3001 &
API_PID=$!

echo "⚙️  Starting ARQ worker..."
arq terrarium_agents.worker.WorkerSettings &
WORKER_PID=$!

# Wait for both processes
wait $API_PID $WORKER_PID
EOF

RUN chmod +x /app/start.sh

# Start the application
CMD ["/bin/bash", "/app/start.sh"]
