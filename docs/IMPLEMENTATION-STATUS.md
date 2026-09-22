# Terrarium Implementation Status

## ✅ Completed (Phases 1-4)

### Phase 1 — Foundation and Sandbox
All 4 stories complete. Monorepo, contracts, parent UI, Docker sandbox, session API with SSE.

### Phase 2 — Core Agents  
All 4 stories complete. Intent classification, Code Generator (Claude-only), Editor, Self-Healing (max 3 retries).

### Phase 3 — Real-time UX
All 4 stories complete. Split-screen layout, SSE event stream, live iframe refresh, healing retry UI with error details.

### Phase 4 — Save, Sleep, Dashboard
All 4 stories complete. Postgres schema (Tool/ToolVersion/Session), publish to workspace, idle sleep/wake, workspace dashboard.

---

## ✅ Completed (Phase 5)

### Phase 5 — Smart Match
All 4 stories complete. Deterministic fingerprinting, pre-check before codegen, match offer UI, skip codegen on accepted match.

- [x] P5-S1: Library index (SHA-256 fingerprint of normalized prompt + stack)
- [x] P5-S2: Smart Match pre-check (scan tool_index before Code Generator)
- [x] P5-S3: Match offer UI (SmartMatchOffer component with "Use existing" vs "Build new")
- [x] P5-S4: Accepted match skips Code Generator, loads existing FileMap

**Result**: Instant tool reuse for exact prompt matches, reduced LLM usage, consistent output.

---

## 🚧 Remaining (Phase 6)

### Phase 6 — Access and Authentication (4 stories)
Replace `dev-user` stub with real accounts, ownership, and sharing.

- [ ] P6-S1: Accounts and login (signup/login, session cookie/JWT)
- [ ] P6-S2: Ownership and roles (owner/editor/viewer per tool)
- [ ] P6-S3: Share with teammates (invite by email, list members)
- [ ] P6-S4: Enforce API and preview access (auth checks on all endpoints)

**Why**: Multi-user production deployment, team collaboration, security.

---

## Key Improvements Since Initial Plan

### Reliability (Google AI Studio patterns)
✅ Verified execution gate (static validation + health + smoke tests)  
✅ Rich error context passed to healing loop  
✅ Chunked generation with per-file validation  
✅ Provider cooldowns to skip quota-exhausted LLMs  
✅ Turn-based refresh (preview only after complete + verified)

### Code Generation
✅ Claude Sonnet 4.6 on Bedrock exclusively (no fallbacks for reliability)  
✅ Chunked FileMap generation (file-by-file, not monolithic)  
✅ Static validation rejects external assets, missing imports, malformed HTML  
✅ React import guard auto-injects missing `import React from 'react'`

### User Experience
✅ Error details with expand/copy button (not large text dumps)  
✅ Event log shows provider attempts, LLM failures, duration  
✅ Progressive skeleton preview with staged detail levels  
✅ Apple-style system font stack, reduced border-radius  
✅ Workspace dashboard with sleep/wake status

### Infrastructure
✅ Alembic migrations for schema evolution  
✅ Traefik reverse proxy for unique preview URLs  
✅ Docker resource limits (CPU, memory, PID)  
✅ Node sandbox with prebuilt dependencies (no OOM during npm install)

---

## Architecture Highlights

| Component | Tech | Why |
|-----------|------|-----|
| Parent UI | React + TypeScript + MUI | Modern component library, type safety |
| API | FastAPI + Uvicorn | Async Python, fast, clean API routes |
| Agents | Python + Claude Sonnet 4.6 | Strong reasoning for code tasks |
| Sandbox | Docker + Traefik | Isolated, resource-limited, unique URLs |
| Database | Postgres + SQLAlchemy | Relational data, migrations |
| Queue | Redis + ARQ | Long-running agent jobs |
| Contracts | Zod (TS) + Pydantic (Python) | Shared types, camelCase JSON |

---

## Next Priorities

### Phase 5 (Smart Match)
1. Design embedding or fingerprint strategy for tool matching
2. Implement library index on publish
3. Add pre-check before Code Generator
4. Build match offer UI with "Use existing" action

### Phase 6 (Auth)
1. Add User table and auth endpoints (signup/login/logout)
2. Replace `dev-user` with real user sessions
3. Add ownership and ToolMember table
4. Implement share/invite flow
5. Enforce access checks on API and preview URLs

---

## Testing Strategy

- **Unit tests**: Agent logic, LLM routing, validation
- **Integration tests**: Heal loop, smoke tests, preview boot
- **Docker tests**: Sandbox start/stop, health checks
- **End-to-end**: Manual testing of full prompt → preview flow

---

## Documentation

- [`PLAN.md`](../PLAN.md) - Architecture and story checklist
- [`docs/llm-agents.md`](llm-agents.md) - LLM model routing and defaults
- [`docs/GOOGLE-AI-STUDIO-COMPARISON.md`](GOOGLE-AI-STUDIO-COMPARISON.md) - Reliability patterns comparison
- [`docs/stories.catalog.json`](stories.catalog.json) - Story definitions (source of truth)
- [`docs/stories/`](stories/) - Generated story markdown (do not hand-edit)

---

## Developer Commands

```powershell
# Install dependencies
pnpm install
uv sync

# Start services
docker compose -f infra\docker-compose.yml up -d

# Run tests
docker compose -f infra\docker-compose.yml run --rm worker uv run --dev pytest

# Rebuild after code changes
docker compose -f infra\docker-compose.yml build api worker
docker compose -f infra\docker-compose.yml up -d api worker

# Check logs
docker compose -f infra\docker-compose.yml logs --tail=100 worker

# Generate story files
node scripts\generate-stories.mjs
```

---

## Current Status Summary

✅ **20 stories complete** (Phases 1-5)  
⏳ **4 stories remaining** (Phase 6)  
📊 **83% complete**

The core application builder is fully functional with verified execution, self-healing, workspace management, and smart tool matching. Remaining work focuses exclusively on multi-user collaboration (Auth).
