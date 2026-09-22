# Terrarium Best Practices & Code Quality

## Code Quality Standards

### No Duplication
✅ **Contracts in one place**: Zod schemas in `packages/contracts`, Pydantic models in `packages/py-contracts`  
✅ **No type duplication**: Apps import from contract packages, never redefine types  
✅ **Shared validation logic**: Static validation, import resolution, external asset checks reused across agents

### Clean Architecture
✅ **Package boundaries enforced**: Agents never call Docker, sandbox never imports LLM SDKs  
✅ **Separation of concerns**: UI in React, orchestration in FastAPI, agents in Python, sandbox in Docker  
✅ **Single responsibility**: Each agent does one thing (Intent classifies, CodeGen generates, Editor patches, Healer routes)

### Type Safety
✅ **TypeScript strict mode**: Full type coverage in web app  
✅ **Pydantic validation**: Runtime type checking in API  
✅ **Contract-first design**: API/event shapes defined before implementation

---

## Reliability Patterns

### Verified Execution
```python
# apps/api/terrarium_api/worker.py

async def _boot_preview(log, session_id, job, files, draft):
    # 1. Static validation (fast, catches obvious errors)
    is_valid, error = _validate_filemap_structure(files)
    if not is_valid:
        return error
    
    # 2. Write files to Docker
    runner = SandboxRunner()
    handle = await runner.start(session_id, files)
    
    # 3. Health check (server actually running)
    report = await runner.health(session_id)
    if report.status != "running":
        return report.logs
    
    # 4. Smoke test (browser-side validation)
    smoke = await runner.smoke(session_id)
    if smoke.status == "unhealthy":
        return smoke.logs
    
    # 5. Preview ready only after all checks pass
    await log.append(make_event("preview.ready", session_id, {
        "previewUrl": handle.previewUrl
    }))
```

### Self-Healing with Real Errors
```python
# packages/agents/terrarium_agents/heal.py

def run_heal(job: AgentJob) -> HealDecision:
    ctx = job.errorContext  # { logs, health, healAttempt }
    
    # LLM decides based on real execution errors
    decision = complete_json(
        "Route to editor or codegen based on error",
        f"logs={ctx.logs[:3000]}\nhealth={ctx.health}"
    )
    
    # Returns: { route: "editor"|"codegen", reason: "..." }
```

### Provider Cooldowns
```python
# packages/agents/terrarium_agents/llm.py

def complete_json(system, user, purpose):
    for provider in order:
        cooldown_reason = _provider_cooldown_reason(provider)
        if cooldown_reason:
            logger.warning("Skipping %s: %s", provider, cooldown_reason)
            continue  # Skip quota-exhausted providers
        
        payload = _call_provider(provider, system, user)
        if payload:
            return payload
        
        # Cooldown on persistent errors
        if "quota" in error or "404" in error:
            _cooldown_provider(provider, 3600, error)
```

---

## LLM Usage Patterns

### Purpose-Aware Routing
```python
# Intent: Cheap classifier
complete_json(system, user, purpose="intent")
# → gemini-3.5-flash-lite ($0.075/1M tokens)

# Plan: Strong reasoning
complete_json(system, user, purpose="plan")
# → bedrock/anthropic.claude-sonnet-4-6 → nvidia → gemini

# Codegen: Reliable structured output
complete_json(system, user, purpose="codegen")
# → bedrock/anthropic.claude-sonnet-4-6 ONLY (no fallbacks)
```

### Chunked Generation
```python
# packages/agents/terrarium_agents/codegen.py

def _maybe_llm_chunked_filemap(job, plan, on_file):
    manifest = _required_manifest(plan)  # ["package.json", "index.html", ...]
    
    for path in manifest:
        # One LLM call per file
        file_json = complete_json(
            system=_chunk_file_prompt(path, plan),
            user=job.prompt,
            purpose="codegen",
            label=path  # For error tracking
        )
        
        if file_json:
            on_file(path, file_json["content"])  # Stream to preview
        else:
            raise CodeGeneratorError(f"Failed to generate {path}")
```

---

## Testing Best Practices

### Unit Tests
```python
# packages/agents/tests/test_llm.py

def test_codegen_uses_bedrock_only():
    with patch.dict("os.environ", {"AWS_ACCESS_KEY_ID": "test"}):
        with patch("llm._bedrock_json", return_value={"files": {}}):
            with patch("llm._nvidia_json") as nvidia:
                with patch("llm._gemini_json") as gemini:
                    complete_json("sys", "user", purpose="codegen")
                    
                    nvidia.assert_not_called()  # ✅ No fallback
                    gemini.assert_not_called()
```

### Integration Tests
```python
# apps/api/tests/test_heal_loop.py

async def test_heal_loop_retries_max_3_times():
    # Simulate 3 failures, then success
    with patch("codegen.generate", side_effect=[
        CodeGeneratorError("fail 1"),
        CodeGeneratorError("fail 2"),
        CodeGeneratorError("fail 3"),
        AgentResult(files={"index.html": "..."})
    ]):
        events = await run_session(prompt="build app")
        
        heal_attempts = [e for e in events if e.name == "heal.attempt"]
        assert len(heal_attempts) == 3  # ✅ Max retries
```

---

## Performance Optimizations

### Docker Image Caching
```dockerfile
# packages/sandbox/terrarium_sandbox/node_fixture/Dockerfile

# Preinstall dependencies in image
RUN npm install --production
# ✅ Avoids OOM during sandbox npm install
```

### Timeout Tuning
```python
# packages/agents/terrarium_agents/llm.py

DEFAULT_BEDROCK_READ_TIMEOUT_S = 45.0  # Prevent long hangs
DEFAULT_GEMINI_JSON_TIMEOUT_MS = 25_000
DEFAULT_NVIDIA_JSON_TIMEOUT_S = 30.0
```

### Provider Ordering
```python
# Codegen: Bedrock-only (most reliable)
# Plan: Bedrock → NVIDIA → Gemini (reasoning → coding → fast)
# Intent: Gemini-only (cheapest)
```

---

## Error Handling Patterns

### User-Friendly Errors
```tsx
// apps/web/src/components/chat/ErrorDetailsButton.tsx

<ErrorDetailsButton
  title="Code generation failed"
  details={llmFailureSummary}
  helper="Copy these details if you want to paste them with extra instructions."
  onRetry={() => retrySession()}
/>
```

### Structured Error Context
```python
# apps/api/terrarium_api/worker.py

llm_fields = {
    "llmProvider": "bedrock",
    "llmModel": "anthropic.claude-sonnet-4-6",
    "llmAttempts": [
        {"provider": "bedrock", "returnedJson": false, "durationMs": 45000, "error": "timeout"}
    ],
    "llmFailureSummary": "Bedrock Claude timeout after 45s"
}
```

---

## Security Best Practices

### Sandbox Isolation
```python
# packages/sandbox/terrarium_sandbox/runner.py

container = client.containers.run(
    image="terrarium-node-sandbox:latest",
    detach=True,
    mem_limit="512m",        # Memory cap
    cpus=1.5,                # CPU cap
    pids_limit=100,          # Process limit
    network=sandbox_network, # Isolated network
    cap_drop=["ALL"],        # Drop all capabilities
)
```

### Input Validation
```python
# apps/api/terrarium_api/worker.py

_EXTERNAL_ASSET_RE = re.compile(
    r"""<(?:script|link|img|source)\b[^>]*(?:src|href)\s*=\s*['"]https?://""",
    re.I
)

if _EXTERNAL_ASSET_RE.search(content):
    return False, f"{path} references an external asset URL"
```

---

## Monitoring & Observability

### Event-Driven Logging
```python
# Every agent step emits a SessionEvent
await log.append(make_event("codegen.started", session_id, {
    "codegenProvider": "bedrock",
    "codegenModel": "anthropic.claude-sonnet-4-6",
    "codegenReason": "Claude-only for reliable chunked output"
}))
```

### Structured Metrics
```python
# LLM call tracking
record_llm_call(
    purpose="codegen",
    provider="bedrock",
    model="anthropic.claude-sonnet-4-6",
    duration_ms=12500,
    ok=True,
    label="src/App.jsx",
    attempts=[...]
)
```

---

## Code Review Checklist

Before merging:
- [ ] Contracts updated in **both** packages if schema changed
- [ ] Tests pass (unit + integration)
- [ ] No duplicate type definitions
- [ ] Error messages are user-friendly
- [ ] No secrets in code/logs
- [ ] Docker images rebuild if sandbox changed
- [ ] Services restarted if API/worker changed
- [ ] Story checkbox marked in PLAN.md if story complete

---

## Common Pitfalls to Avoid

❌ **Don't** define types in app code - import from contracts  
❌ **Don't** call Docker from agents - use sandbox package  
❌ **Don't** hardcode model names in prompts - use config  
❌ **Don't** show raw errors to users - use ErrorDetailsButton  
❌ **Don't** retry indefinitely - cap at 3 attempts  
❌ **Don't** allow external CDN/fonts in generated code  
❌ **Don't** run npm install in production sandbox - prebuild image  

✅ **Do** validate FileMaps before Docker  
✅ **Do** pass real error logs to healing  
✅ **Do** stream progress to users  
✅ **Do** use cooldowns for quota errors  
✅ **Do** run smoke tests before preview  
✅ **Do** document architecture decisions  
✅ **Do** write tests for reliability patterns  

---

This document captures the key patterns that make Terrarium reliable and maintainable. Follow these practices when implementing new features.
