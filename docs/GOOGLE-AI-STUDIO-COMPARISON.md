# Google AI Studio vs Terrarium: Architecture Comparison

## Executive Summary

Terrarium implements the core reliability patterns from Google AI Studio, with some architectural differences due to design choices around transparency and user control.

---

## Key Patterns (Both Systems)

### 1. Verified Execution Before Preview
**Google AI Studio**: Agent generates code → executes in sandbox → observes results → retries up to 5x → shows preview only when working  
**Terrarium**: Code Generator → static validation → Docker boot → health check → smoke test → shows preview only when healthy

**Implementation**: `apps/api/terrarium_api/worker.py:_boot_preview()`
- Static validation rejects malformed FileMaps
- Docker health checks confirm server running
- Playwright smoke tests verify DOM renders and interacts
- Preview only shown after all checks pass

---

### 2. Agent Observes Real Execution Results
**Google AI Studio**: Agent sees actual error messages from sandbox and regenerates based on real failures  
**Terrarium**: Self-Healing Agent receives runtime logs and routes to Editor or Code Generator with error context

**Implementation**: `packages/agents/terrarium_agents/heal.py:run_heal()`
- Receives `ErrorContext { logs, health, healAttempt }`
- LLM decides: `editor` (patch files) or `codegen` (regenerate)
- Max 3 retries before `heal.exhausted`

---

### 3. Incremental Generation + Turn-Based Refresh
**Google AI Studio**: Generates file-by-file, HMR disabled, preview refreshes only after complete turn  
**Terrarium**: Chunked generation streams individual files, preview updates only after all chunks + validation complete

**Implementation**: 
- `packages/agents/terrarium_agents/codegen.py:_maybe_llm_chunked_filemap()`
- Streams files via `preview.stream.file` events
- `preview.stream.completed` → Docker boot → smoke test → `preview.ready`

---

### 4. Isolated Sandbox with Fixed Infrastructure
**Google AI Studio**: Single port (3000), nginx reverse proxy, HMR disabled, resource limits  
**Terrarium**: Traefik reverse proxy, `{sessionId}.sandbox.local` URLs, CPU/memory/PID limits, network isolation

**Implementation**: `packages/sandbox/terrarium_sandbox/runner.py`
- Docker containers with `cpus=1.5`, `mem_limit=512M`
- Traefik labels for unique preview URLs
- Healthcheck before marking `running`

---

### 5. Claude-Only Code Generation
**Google AI Studio**: Uses Gemini 3.8 Flash for Antigravity Agent  
**Terrarium**: Uses Claude Sonnet 4.6 on Bedrock exclusively for code generation (no fallbacks)

**Why**: Chunked builds make many provider calls; quota-limited models (Gemini free tier) cause repeated failures on every file chunk.

**Implementation**: `packages/agents/terrarium_agents/llm.py:complete_json()`
- Codegen purpose → Bedrock only
- Plan purpose → Bedrock → NVIDIA → Gemini
- Intent purpose → Gemini (cheap classifier)

---

## Key Differences

### User-Visible Errors
**Google AI Studio**: Hides intermediate failures; user only sees working app or timeout  
**Terrarium**: Shows error details with expand/copy in chat; background self-healing continues

**Why**: Transparency and debugging. Users can see what went wrong and copy errors for manual fixes.

---

### Streaming vs Complete
**Google AI Studio**: No live streaming; single complete refresh after turn  
**Terrarium**: Streams individual files as they generate; final preview after all complete

**Why**: User sees progress during generation; knows system is working.

---

### Deterministic Fallback
**Google AI Studio**: Unknown (likely has emergency fallback)  
**Terrarium**: Disabled in live mode; if Claude fails, generation stops with error

**Why**: Better to fail fast than show generic/broken fallback.

---

### Backend Runtime
**Google AI Studio**: Full-stack with Node.js server, Firebase integration, secrets management  
**Terrarium**: Supports React-only or React + Node/Express; no auto Firebase provisioning yet

**Roadmap**: Future phase could add secrets management and database integration.

---

## Reliability Metrics Comparison

| Metric | Google AI Studio | Terrarium |
|--------|-----------------|-----------|
| Pre-preview validation | ✅ Execution + tests | ✅ Static + health + smoke |
| Max retries | 5 per operation | 3 total (intentional cap) |
| Error feedback to LLM | ✅ Real sandbox errors | ✅ Real Docker logs |
| User sees failures | ❌ Hidden until exhausted | ✅ Shown with heal progress |
| Chunked generation | ✅ File-by-file | ✅ File-by-file with streaming |
| Provider fallbacks | Unknown | Codegen: Claude-only; Plan: Multi-provider |

---

## Terrarium's Advantages

1. **Transparent healing**: Users see retry progress and can intervene
2. **Provider flexibility**: Plan generation has fallbacks; codegen is Claude-only for reliability
3. **Traefik preview URLs**: Each session gets unique, persistent URL
4. **Self-contained**: No external Firebase/cloud dependencies required
5. **Open architecture**: Full control over sandbox, no hidden platform constraints

---

## Improvements Adopted from Google AI Studio

Based on the analysis, Terrarium implemented:

✅ **Verified execution gate** - Preview only shown after smoke tests pass  
✅ **Rich error context** - Logs, health status, attempt number passed to healing  
✅ **Turn-based refresh** - No preview until generation fully complete  
✅ **Chunked generation** - Per-file calls instead of monolithic FileMap  
✅ **Provider cooldowns** - Skip quota-exhausted providers during chunks  
✅ **Static validation** - Reject external assets, missing imports, malformed HTML before Docker  

---

## Current Status

- **Phases 1-4: Complete** (Foundation, Core Agents, Real-time UX, Save/Sleep/Dashboard)
- **Phase 5: Pending** (Smart Match - library index, pre-check, match UI)
- **Phase 6: Pending** (Access and Auth - accounts, roles, sharing, enforce access)

---

## Next Steps

To fully match Google AI Studio's reliability:

1. ✅ Already done: Verified execution, healing with error feedback, chunked generation
2. ⏭️ Future: Backend secrets management (Phase 4 extension)
3. ⏭️ Future: Smart Match to avoid regenerating similar apps (Phase 5)
4. ⏭️ Future: Multi-user auth and sharing (Phase 6)

The core reliability patterns are **already implemented** and running in production.
