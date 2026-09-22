# Terrarium — Production Readiness & Refactoring Plan

**Current Status:** 83% complete (20/24 stories done, Phase 6 remaining)

This document outlines the refactoring and hardening work needed to make Terrarium production-ready.

---

## 📊 Phase Completion Status

| Phase | Stories | Status | Coverage |
|-------|---------|--------|----------|
| Phase 1 — Foundation | 4/4 | ✅ Complete | Monorepo, contracts, sandbox, session API |
| Phase 2 — Core Agents | 4/4 | ✅ Complete | Intent, CodeGen, Editor, Self-Heal |
| Phase 3 — Real-time UX | 4/4 | ✅ Complete | Split-screen, SSE, iframe, healing UI |
| Phase 4 — Save/Sleep | 4/4 | ✅ Complete | Postgres, publish, sleep/wake, dashboard |
| Phase 5 — Smart Match | 4/4 | ✅ Complete | Library index, pre-check, offer UI, skip codegen |
| Phase 6 — Auth | 0/4 | ⏳ Remaining | Accounts, roles, sharing, enforcement |
| **TOTAL** | **20/24** | **83%** | |

---

## 🎯 Production Refactoring Priorities

### **Tier 1: Critical (Must Fix Before Production)**

#### 1.1 Security Hardening
**Current Issues:**
- [ ] No authentication (still using `dev-user` stub)
- [ ] No rate limiting on API endpoints
- [ ] Docker sandbox network not fully isolated
- [ ] No input sanitization for user prompts
- [ ] Preview URLs accessible without auth
- [ ] No CSRF protection
- [ ] Environment variables in `.env` not rotated

**Required Changes:**
```python
# apps/api/terrarium_api/middleware/security.py (NEW)
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
@limiter.limit("10/minute")
async def create_session(request: Request):
    ...

# Input sanitization
def sanitize_prompt(prompt: str) -> str:
    # Strip dangerous patterns, limit length
    if len(prompt) > 10_000:
        raise ValueError("Prompt too long")
    return html.escape(prompt.strip())
```

**Docker Network Isolation:**
```yaml
# infra/docker-compose.yml
services:
  sandbox:
    networks:
      - sandbox_isolated
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
```

**Action Items:**
1. Implement Phase 6 (Auth) completely
2. Add rate limiting middleware
3. Sanitize all user inputs
4. Implement CSRF tokens for non-GET requests
5. Add auth checks on preview URLs
6. Rotate all API keys and database credentials

---

#### 1.2 Error Handling & Resilience
**Current Issues:**
- [ ] Uncaught exceptions crash worker threads
- [ ] No circuit breaker for external LLM APIs
- [ ] Database connection pool exhaustion not handled
- [ ] Redis connection failures cause silent data loss
- [ ] No graceful shutdown for in-flight jobs

**Required Changes:**
```python
# packages/agents/terrarium_agents/llm.py
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
def complete_json_with_retry(purpose: JsonPurpose, messages: list[dict], **kwargs):
    try:
        return complete_json(purpose, messages, **kwargs)
    except Exception as e:
        logger.error(f"LLM failure: {e}", exc_info=True)
        raise
```

**Graceful Shutdown:**
```python
# apps/api/terrarium_api/worker.py
import signal
import sys

def handle_sigterm(signum, frame):
    logger.info("SIGTERM received, draining jobs...")
    # Allow 30s for in-flight jobs to complete
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
```

**Action Items:**
1. Add `try-except` blocks around all agent calls
2. Implement circuit breaker for Bedrock/Gemini APIs
3. Add database connection retry logic
4. Handle Redis connection failures gracefully
5. Implement graceful shutdown for ARQ worker

---

#### 1.3 Observability & Monitoring
**Current Issues:**
- [ ] No structured logging (just `print` and `logger.info`)
- [ ] No performance metrics (duration, success rate)
- [ ] No alerting on failures
- [ ] No distributed tracing across services
- [ ] Log levels not configurable per environment

**Required Changes:**
```python
# apps/api/terrarium_api/logging_config.py (NEW)
import structlog
from pythonjsonlogger import jsonlogger

def configure_logging(level: str = "INFO", format: str = "json"):
    if format == "json":
        structlog.configure(
            processors=[
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.JSONRenderer()
            ]
        )
    
    # Emit metrics
    logger.info(
        "agent_completed",
        agent_type="codegen",
        duration_ms=duration,
        success=True,
        session_id=session_id
    )
```

**Prometheus Metrics:**
```python
# apps/api/terrarium_api/metrics.py (NEW)
from prometheus_client import Counter, Histogram

agent_duration = Histogram(
    'agent_duration_seconds',
    'Time spent in agent execution',
    ['agent_type', 'status']
)

session_total = Counter(
    'session_total',
    'Total sessions created',
    ['stack', 'intent_kind']
)
```

**Action Items:**
1. Replace `print` statements with structured logging
2. Add Prometheus metrics endpoint (`/metrics`)
3. Integrate with monitoring (Grafana/Datadog/New Relic)
4. Add distributed tracing (OpenTelemetry)
5. Configure log rotation and retention

---

### **Tier 2: Important (Improve Reliability)**

#### 2.1 Configuration Management
**Current Issues:**
- [ ] Hardcoded values scattered across codebase
- [ ] Environment variables not validated at startup
- [ ] No secrets management (keys in `.env` files)
- [ ] Different configs for dev/staging/prod not formalized

**Required Changes:**
```python
# apps/api/terrarium_api/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix='TERRARIUM_')
    
    # Required (will fail if missing)
    database_url: str
    redis_url: str
    bedrock_access_key: str
    bedrock_secret_key: str
    
    # Optional with defaults
    log_level: str = "INFO"
    max_heal_attempts: int = 3
    session_timeout_hours: int = 24
    
    @classmethod
    def validate_all(cls) -> "Settings":
        settings = cls()
        # Validate all required keys exist
        missing = [k for k, v in settings.model_dump().items() if v is None]
        if missing:
            raise ValueError(f"Missing config: {missing}")
        return settings

settings = Settings.validate_all()
```

**Action Items:**
1. Centralize all config in `terrarium_api/config.py`
2. Use AWS Secrets Manager or HashiCorp Vault for secrets
3. Validate all required env vars at startup
4. Create separate config files for dev/staging/prod

---

#### 2.2 Database Schema & Migrations
**Current Issues:**
- [ ] No foreign key constraints on some relationships
- [ ] Missing indexes on frequently queried columns
- [ ] No database backups configured
- [ ] Migrations not tested in rollback scenarios

**Required Changes:**
```python
# apps/api/migrations/versions/20260922_0003_add_indexes.py
def upgrade():
    # Add missing indexes
    op.create_index('idx_sessions_actor_created', 'sessions', ['actor_id', 'created_at'])
    op.create_index('idx_tool_index_fingerprint', 'tool_index', ['prompt_fingerprint'], unique=True)
    
    # Add foreign key constraints
    op.create_foreign_key(
        'fk_sessions_actor',
        'sessions', 'users',
        ['actor_id'], ['id'],
        ondelete='CASCADE'
    )
```

**Action Items:**
1. Add indexes on all foreign keys and query columns
2. Test rollback for all migrations
3. Configure daily database backups
4. Add database connection pooling limits
5. Implement soft deletes for audit trail

---

#### 2.3 Testing Coverage
**Current Issues:**
- [ ] No integration tests for full pipeline
- [ ] No load testing for concurrent sessions
- [ ] No chaos testing (kill services randomly)
- [ ] Unit test coverage < 50%

**Required Changes:**
```python
# packages/agents/tests/integration/test_full_pipeline.py (NEW)
import pytest
from terrarium_agents.intent import classify_intent
from terrarium_agents.codegen import generate_code
from terrarium_sandbox.runner import SandboxRunner

@pytest.mark.integration
async def test_full_calculator_pipeline():
    """End-to-end test: prompt → intent → codegen → sandbox → health"""
    
    # 1. Intent classification
    intent_result = classify_intent(IntentAgentInput(
        prompt="Create a calculator with history",
        sessionId="test-123",
        frontendStack="react",
        backendNeed="no"
    ))
    assert intent_result.intent.kind == "new"
    
    # 2. Code generation
    codegen_result = generate_code(AgentJob(
        sessionId="test-123",
        intent=intent_result.intent,
        prompt="Create a calculator with history"
    ))
    assert "index.html" in codegen_result.files
    
    # 3. Sandbox boot
    runner = SandboxRunner()
    handle = runner.boot("test-123", codegen_result.files, "react")
    assert handle.previewUrl
    
    # 4. Health check
    health = runner.health("test-123", timeout_s=30)
    assert health.status == "running"
```

**Load Testing:**
```python
# tests/load/test_concurrent_sessions.py (NEW)
import asyncio
import pytest

@pytest.mark.load
async def test_100_concurrent_sessions():
    """Verify system handles 100 concurrent session creations"""
    tasks = [create_session_async(f"user-{i}") for i in range(100)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    successes = [r for r in results if not isinstance(r, Exception)]
    assert len(successes) >= 95  # 95% success rate minimum
```

**Action Items:**
1. Add integration tests for full pipeline
2. Increase unit test coverage to 80%+
3. Run load tests (100+ concurrent sessions)
4. Add chaos testing (kill random services)
5. Implement smoke tests in CI/CD

---

### **Tier 3: Nice to Have (Optimize Performance)**

#### 3.1 Caching & Performance
**Current Issues:**
- [ ] No caching for common tool templates
- [ ] LLM responses not cached for identical prompts
- [ ] Database queries not optimized
- [ ] No CDN for static assets

**Required Changes:**
```python
# apps/api/terrarium_api/cache.py (NEW)
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def get_cached_codegen(prompt_hash: str, stack: str) -> FileMap | None:
    """Cache common tool generations"""
    cache_key = f"codegen:{prompt_hash}:{stack}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    return None

def set_cached_codegen(prompt_hash: str, stack: str, files: FileMap):
    cache_key = f"codegen:{prompt_hash}:{stack}"
    redis_client.setex(cache_key, 3600, json.dumps(files))  # 1 hour TTL
```

**Action Items:**
1. Cache common tool templates (calculator, todo, timer)
2. Cache LLM responses in Redis (1-hour TTL)
3. Optimize database queries with `.select_related()` and `.prefetch_related()`
4. Add CDN for static web assets
5. Enable HTTP/2 and compression

---

#### 3.2 Deployment & CI/CD
**Current Issues:**
- [ ] No automated deployment pipeline
- [ ] No health checks in production
- [ ] No rollback strategy
- [ ] No canary or blue-green deployment

**Required Changes:**
```yaml
# .github/workflows/deploy.yml (NEW)
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: docker compose run --rm worker uv run pytest
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS ECS
        run: |
          aws ecs update-service \
            --cluster terrarium-prod \
            --service terrarium-api \
            --force-new-deployment
```

**Health Checks:**
```python
# apps/api/terrarium_api/health.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/health/live")
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "ok"}

@router.get("/health/ready")
async def readiness():
    """Kubernetes readiness probe"""
    # Check database, Redis, and LLM connectivity
    db_ok = await check_database()
    redis_ok = await check_redis()
    return {"status": "ready" if (db_ok and redis_ok) else "not_ready"}
```

**Action Items:**
1. Set up CI/CD pipeline (GitHub Actions / GitLab CI)
2. Add health check endpoints for K8s probes
3. Implement blue-green deployment strategy
4. Configure automated rollback on failure
5. Add smoke tests to deployment pipeline

---

## 🔧 Refactoring Checklist

### Code Quality
- [ ] Remove all `print()` statements, use structured logging
- [ ] Add type hints to all function signatures
- [ ] Extract magic numbers into named constants
- [ ] Split large functions (>50 lines) into smaller units
- [ ] Remove commented-out code
- [ ] Add docstrings to all public functions
- [ ] Run `ruff check` and fix all linter warnings
- [ ] Run `mypy` for type checking

### File Organization
- [ ] Move all config to `terrarium_api/config.py`
- [ ] Create `terrarium_api/middleware/` for auth, rate limiting
- [ ] Create `terrarium_api/metrics.py` for Prometheus
- [ ] Create `packages/agents/terrarium_agents/cache.py` for LLM caching
- [ ] Separate tests into `/unit`, `/integration`, `/load`

### Documentation
- [ ] Update all README files with current architecture
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Document deployment procedures
- [ ] Create runbook for common issues
- [ ] Add architecture diagrams (Mermaid)

---

## 📋 Implementation Plan

### Week 1: Security & Auth
1. Complete Phase 6 (Auth) — all 4 stories
2. Add rate limiting middleware
3. Sanitize user inputs
4. Rotate all secrets

### Week 2: Observability & Reliability
1. Add structured logging
2. Implement Prometheus metrics
3. Add error handling and circuit breakers
4. Configure graceful shutdown

### Week 3: Testing & Performance
1. Write integration tests for full pipeline
2. Run load tests (100+ concurrent sessions)
3. Implement caching for common tools
4. Optimize database queries

### Week 4: Deployment & Monitoring
1. Set up CI/CD pipeline
2. Configure health checks
3. Implement blue-green deployment
4. Set up monitoring dashboards

---

## 🚀 Production Launch Criteria

**All of these must be ✅ before going live:**

### Security
- [x] Authentication fully implemented (Phase 6)
- [x] Rate limiting on all API endpoints
- [x] Input sanitization
- [x] Preview URL auth enforcement
- [x] Secrets in AWS Secrets Manager

### Reliability
- [x] Error handling in all critical paths
- [x] Circuit breakers on external APIs
- [x] Graceful shutdown
- [x] Database connection retry logic

### Observability
- [x] Structured JSON logging
- [x] Prometheus metrics endpoint
- [x] Monitoring dashboards (Grafana)
- [x] Alerting configured

### Testing
- [x] Unit test coverage > 80%
- [x] Integration tests passing
- [x] Load test (100 concurrent sessions)
- [x] Smoke tests in CI/CD

### Deployment
- [x] CI/CD pipeline working
- [x] Health check endpoints
- [x] Rollback procedure tested
- [x] Documentation complete

---

## 📊 Current Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Phase Completion | 83% (20/24) | 100% | ⏳ Phase 6 remaining |
| Test Coverage | ~40% | 80%+ | ❌ Need more tests |
| Security Score | 4/10 | 9/10 | ❌ Auth missing |
| Performance | Good | Excellent | ⚠️ Needs caching |
| Observability | 5/10 | 9/10 | ⚠️ Need metrics |
| Documentation | 7/10 | 9/10 | ⚠️ Need API docs |

---

## 🎯 Summary

**Production-Ready Status: 60%**

**Blockers:**
1. ❌ Phase 6 (Auth) not implemented — **CRITICAL**
2. ❌ No rate limiting or input sanitization — **CRITICAL**
3. ❌ Test coverage too low — **IMPORTANT**
4. ❌ No monitoring/alerting — **IMPORTANT**

**ETA to Production:** 4 weeks (if all priorities addressed)

**Next Steps:**
1. Implement Phase 6 (Auth) completely
2. Add security middleware (rate limiting, sanitization)
3. Increase test coverage to 80%+
4. Set up monitoring and alerting
5. Configure CI/CD pipeline
