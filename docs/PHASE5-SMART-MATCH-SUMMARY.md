# Phase 5 — Smart Match Implementation Summary

## Overview
Phase 5 implements Smart Match: an exact-match system that detects when a user's prompt matches a previously published tool, offering to load the existing tool instead of generating from scratch.

## Architecture Decision: Deterministic Fingerprinting

**Choice:** SHA-256 fingerprints over embeddings  
**Rationale:**
- **Deterministic**: Same prompt + stack → same hash
- **Fast**: O(1) indexed lookups, no vector similarity search
- **Simple**: No external dependencies, no embedding models
- **Exact matching only**: Intentionally strict to avoid false positives

## Implementation Summary

### ✅ P5-S1: Library Index (Completed)

**Database Schema:**
- **Table:** `tool_index`
- **Columns:** `tool_id`, `stack`, `summary`, `prompt_fingerprint`, `created_at`, `updated_at`
- **Indexes:** `tool_id` (FK), `stack`, `prompt_fingerprint` (unique)

**Key Files:**
- `apps/api/terrarium_api/models.py` — SQLAlchemy model for `ToolIndexRecord`
- `apps/api/migrations/versions/20260921_0002_phase5_smart_match.py` — Alembic migration
- `packages/agents/terrarium_agents/smart_match.py` — Fingerprint computation logic
- `apps/api/terrarium_api/routes/workspace.py` — Index writes on publish

**Behavior:**
- Publishing a tool writes/updates its index record
- Fingerprint: `SHA-256(normalized_prompt + "|" + stack)`
- Normalization: lowercase, trim, collapse whitespace

### ✅ P5-S2: Smart Match Pre-check (Completed)

**Integration Point:**  
Worker pipeline, after `intent.classified`, before `codegen.started`

**Key Files:**
- `apps/api/terrarium_api/worker.py` — `_check_smart_match()` function
- Smart Match only runs for `kind=new` and when no `toolId` is set

**Behavior:**
- Queries `tool_index` for exact fingerprint match
- Emits `smartmatch.hit` (with toolId, score=1.0, tool summary) on match
- Emits `smartmatch.miss` on no match
- **Pauses pipeline on hit** — waits for user choice, does NOT start Code Generator

**Events:**
- `smartmatch.hit` — Payload includes `toolId`, `score`, `matchedTool`
- `smartmatch.miss` — Empty payload, pipeline continues

### ✅ P5-S3: Match Offer UI (Completed)

**Components:**
- `apps/web/src/components/chat/SmartMatchOffer.tsx` — New component
- `apps/web/src/components/chat/ChatThread.tsx` — Integrated to show offer after AgentTrace
- `apps/web/src/components/chat/ChatPane.tsx` — Wired handlers
- `apps/web/src/App.tsx` — Connected to session hooks

**UI/UX:**
- Shows matched tool name, summary, file count, last updated date
- **Two actions:**
  - **"Use existing"** — Accepts match, loads published FileMap
  - **"Build new"** — Rejects match, continues to Code Generator
- **No automatic navigation** — requires explicit user click
- Confidence badge shows 100% for exact fingerprint matches
- Visual confirmation after choice (green success state)

**Interaction Flow:**
1. User sends prompt
2. Smart Match hit detected
3. AgentTrace shows `smartmatch.hit` event
4. SmartMatchOffer component renders with tool details and buttons
5. User clicks "Use existing" or "Build new"
6. API call triggers appropriate action

### ✅ P5-S4: Accept Match Endpoint (Completed)

**API Endpoint:**  
`POST /sessions/{sessionId}/accept-match`

**Request Body:**
```json
{
  "sessionId": "...",
  "toolId": "..."
}
```

**Response:** `OpenToolResponse` with sessionId, previewUrl, tool summary

**Key Files:**
- `apps/api/terrarium_api/routes/workspace.py` — New `accept_match` endpoint
- `apps/web/src/api/sessions.ts` — `acceptSmartMatch()` and `rejectSmartMatch()` functions
- `apps/web/src/hooks/useCreateSession.ts` — `acceptMatch()` and `rejectMatch()` handlers

**Behavior on Accept:**
1. Validates session exists and tool is accessible
2. Loads FileMap from published version
3. Saves FileMap and toolId to session
4. Updates intent to `kind=modify` with `toolId` for future prompts
5. Boots sandbox with matched FileMap
6. Emits `sandbox.ready` and `preview.ready` events
7. **Does NOT emit `codegen.started`** — skips Code Generator entirely

**Behavior on Reject:**
- Re-enqueues the session to continue pipeline from Smart Match miss
- Worker continues to Code Generator with the original prompt

## Contracts Added

**TypeScript (Zod):**
- `ToolIndexRecord` — Index record schema
- `SmartMatchResult` — Match result with hit, toolId, score, matchedTool
- `AcceptMatchRequest` — User accepts a match

**Python (Pydantic):**
- Matching models in `packages/py-contracts/terrarium_contracts/models.py`
- Exported from `__init__.py`

## Best Practices Applied

1. **Deterministic behavior**: Fingerprints are reproducible
2. **No duplication**: Index logic centralized in `smart_match.py`
3. **User consent required**: Never auto-overwrites intent
4. **Clear separation**: Smart Match agent is independent, called by worker
5. **Type safety**: Full contract coverage in both Zod and Pydantic
6. **Database best practices**: Foreign keys with CASCADE, unique constraints, proper indexes
7. **Event-driven UX**: SSE events drive UI updates smoothly
8. **Error handling**: API failures gracefully degrade to Build new

## Migration Notes

**Database migration:** `20260921_0002_phase5_smart_match.py`  
**To apply:** `uv run alembic upgrade head` (inside API container)

## Testing Strategy

**Manual testing checklist:**
1. Publish a tool
2. Verify `tool_index` record created
3. Send identical prompt + stack
4. Verify `smartmatch.hit` event fires
5. Verify UI shows match offer
6. Click "Use existing" → verify existing tool loads
7. Send identical prompt again
8. Click "Build new" → verify Code Generator runs

**Edge cases to test:**
- Prompt differs by whitespace only (should match)
- Prompt differs by case only (should match)
- Prompt differs slightly (should NOT match — exact only)
- Different stack (should NOT match)
- Tool deleted after index created (graceful failure)

## What's NOT Implemented (Intentional)

1. **Fuzzy matching** — Only exact fingerprints match
2. **Semantic search** — No embeddings, no similarity scores
3. **Permission checks** — Until P6, all tools are dev-user only
4. **Match ranking** — Only one match per fingerprint (unique constraint)
5. **Partial matches** — All-or-nothing: hit or miss

## Next Phase

**Phase 6 — Access and Auth (4 stories):**
- P6-S1: Accounts and login
- P6-S2: Ownership and roles
- P6-S3: Share with teammates
- P6-S4: Enforce API and preview access

Phase 5 is feature-complete and ready for integration testing.
