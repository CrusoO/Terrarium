# Codegen Step 0 Analysis

This document records the current Terrarium code generation path and the Step 0 measurement hooks. The hooks are gated by `CODEGEN_METRICS=1`; default behavior is unchanged.

**Scope of this baseline:** web flow only (Discovery/session → intent → plan → codegen → preview). WhatsApp relay and pen-testing / trust-attack features are **out of scope** here and will be measured separately later.

## Current Data Flow

| Stage | Files | What Happens |
|---|---|---|
| Request | `apps/api/terrarium_api/routes/sessions.py` | `POST /sessions` stores or resumes a session, acquires a Redis lock, and enqueues `run_stub_session`. Requires a Firebase Bearer token (no API auth bypass). |
| Intent | `apps/api/terrarium_api/worker.py`, `packages/agents/terrarium_agents/intent.py`, `packages/agents/terrarium_agents/llm.py` | The worker loads chat history and existing files, calls the intent agent, logs `intent.classified`, and either asks questions or proceeds. |
| Plan | `packages/agents/terrarium_agents/codegen.py` | `build_session_plan` picks stack/layout/theme and optionally asks an LLM for architecture JSON. |
| Codegen | `packages/agents/terrarium_agents/codegen.py`, `packages/agents/terrarium_agents/llm.py` | `generate` asks the model for one JSON FileMap: `{"files":{"path":"content"}}`. If no parseable JSON returns, deterministic fallback may run. |
| Preview stream | `apps/api/terrarium_api/worker.py` | The worker emits skeleton `preview.stream.file` events first, then **replays** completed files over SSE **after** the model call finishes. |
| Persistence | `apps/api/terrarium_api/session_log.py` | The completed FileMap is saved to Redis. |
| Validation and preview | `apps/api/terrarium_api/worker.py`, `packages/sandbox` | FileMap validation, preboot trust scan, optional GitHub sync, Docker sandbox start, and health checks produce `preview.ready` or heal. |
| Web UI | `apps/web/src/hooks/useCreateSession.ts`, `apps/web/src/components/workspace/PreviewPanel.tsx` | The UI displays streamed skeleton/files and switches to the iframe URL on `preview.ready`. |

## Instrumentation Added

| Requirement | Implementation |
|---|---|
| Env-gated metrics | `apps/api/terrarium_api/codegen_metrics.py` only records when `CODEGEN_METRICS=1`. |
| Provider/model/retry/fallback | `terrarium_agents.llm.record_llm_call` records provider, model, duration, success, and token usage where available. |
| Token counts | Bedrock/Gemini/NVIDIA usage metadata captured when present (**provider tokens**). FileMap per-file counts use local `chars/4` estimates and are labeled **estimated**. |
| Model vs infrastructure time | Worker stages are split into `kind=model` and `kind=infrastructure`. |
| JSON FileMap overhead | `record_filemap` stores estimated raw-code tokens, JSON-wrapped tokens, overhead, tokens per file, and boilerplate category summary (**estimated**). |
| Streaming probe | `scripts/codegen-streaming-probe.py` — run inside the API container venv (`/app/.venv`). |
| Four sample runs | `scripts/codegen-step0-runs.py` uses `TERRARIUM_TEST_TOKEN` as Bearer auth. |

Metrics files are written to `docs/codegen-metrics/` by default, or `CODEGEN_METRICS_DIR` when set.

Local measurement override (not for production): `infra/docker-compose.codegen-metrics.yml` sets `CODEGEN_METRICS=1` and mounts `docs/codegen-metrics`.

## How to get a Firebase test token (`TERRARIUM_TEST_TOKEN`)

Do **not** add an API auth bypass. Obtain a real Firebase ID token:

### Option A — Firebase Auth REST sign-in (recommended for scripts)

1. Create a test user in the Firebase console (Email/Password), or sign up once via the Terrarium web login UI.
2. Call Identity Toolkit with the web API key (`VITE_FIREBASE_API_KEY` from `.env`):

```powershell
$apiKey = "<VITE_FIREBASE_API_KEY>"
$body = @{
  email             = "your-test-user@example.com"
  password          = "<password>"
  returnSecureToken = $true
} | ConvertTo-Json
$resp = Invoke-RestMethod `
  -Method Post `
  -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey" `
  -ContentType "application/json" `
  -Body $body
$env:TERRARIUM_TEST_TOKEN = $resp.idToken
```

3. If you see `The token is not yet valid (iat)`, wait 2–5 seconds (clock skew) and retry the API call.
4. Anonymous REST `signUp` is **not** enabled on this project (`ADMIN_ONLY_OPERATION`).

### Option B — Auth emulator

1. Run the Firebase Auth emulator and point the API/`FIREBASE_PROJECT_ID` + web config at it.
2. Sign in against the emulator, copy the emulator ID token into `TERRARIUM_TEST_TOKEN`.
3. Emulator tokens are only valid while the emulator is running.

### Using the token

```powershell
$env:TERRARIUM_TEST_TOKEN = "<firebase id token>"
$env:TERRARIUM_API_BASE = "http://127.0.0.1:3010"
# Prefer the API image venv (has boto3 + google-genai):
docker exec -w /app infra-api-1 /app/.venv/bin/python scripts/codegen-streaming-probe.py
# Sample runs hit the HTTP API (host Python + httpx is fine):
python scripts/codegen-step0-runs.py
```

## Streaming Reality

**Preview “streaming” is a replay after the model call finishes — not real token streaming from the codegen model.**

Evidence from `worker.py` and live metrics:

1. The codegen stage (`kind=model`) runs to completion first (~259–264 s in baseline runs when Gemini stalls/fails).
2. Only then do `preview_file_replay` / skeleton stages (`kind=infrastructure`) emit SSE file events (milliseconds once the FileMap exists).
3. The one-off `codegen-streaming-probe.py` *does* exercise provider stream APIs (Bedrock/Gemini) for TTFT measurement; that path is **not** wired into the product preview pipeline.

## Streaming Probe Results

Ran with `/app/.venv/bin/python` inside `infra-api-1` (API’s own venv; nothing installed globally). Output: [`docs/codegen-metrics/streaming-probe.json`](codegen-metrics/streaming-probe.json).

| Provider | Model | OK | TTFT (s) | Duration (s) | Output tokens | Tokens/s | Token source |
|---|---|---:|---:|---:|---:|---:|---|
| bedrock | anthropic.claude-sonnet-4-6 | yes | 16.554 | 17.057 | 3158 | 185.15 | **provider** (`usageSource=bedrock`) |
| gemini | gemini-3.8-flash | yes | 153.429 | 172.157 | 2815 | 16.35 | **provider** (`usageSource=gemini`); input 41, total 3587 |

Timing kind: **model time** (direct provider stream; no sandbox/infra).

## Baseline Sample Runs (web flow)

| Run | Prompt | Terminal | Wall (s) | Metrics status | Dominant stage |
|---|---|---|---:|---|---|
| Sample 1 | Customer/order tracker | `intent.classified` (clarify) | 6.0 | clarify only | **model** intent ~3 s; superseded later by follow-up/heal on same session |
| Sample 2 | Ecommerce catalogue | `sandbox.unhealthy` | 288.3 | `preview-unhealthy` (283.7 s in metrics) | **model** codegen 263.5 s (Gemini fail) + **model** plan 14.9 s |
| Sample 3 | Operations dashboard | `sandbox.unhealthy` | 287.2 | `preview-unhealthy` (283.1 s) | **model** codegen 263.2 s + **model** plan 14.9 s |
| Follow-up | Add a status filter | preview after heal | 356.1 (metrics) | `healed-1` | **model** codegen 259.0 s + **model** heal_codegen 73.4 s |

WhatsApp / pen-testing: **not measured** in this baseline.

Raw per-run JSON: [`docs/codegen-metrics/step0-run-summary.json`](codegen-metrics/step0-run-summary.json) and the linked `*-*.json` files.

### Stage breakdown (representative)

**Ecommerce catalogue** (`9c0bb121…1757712.json`):

| Stage | Kind | Seconds |
|---|---|---:|
| intent | model | 1.8 |
| plan | model | 14.9 |
| preview_skeleton_stream | infrastructure | 3.5 |
| codegen | model | 263.5 |
| save_filemap + preview_file_replay + validation + preboot + sandbox_boot_and_health | infrastructure | ~0.01 (failed open / no real boot) |

**Follow-up + heal** (`0974d069…2329362.json`):

| Stage | Kind | Seconds |
|---|---|---:|
| intent | model | 1.7 |
| plan | model | 10.8 |
| preview_skeleton_stream | infrastructure | 3.5 |
| codegen | model | 259.0 |
| heal_decision_1 | model | 4.4 |
| heal_codegen_1 | model | 73.4 |
| sandbox_start + sandbox_health_check (+ heal boot wrapper) | infrastructure | ~3.3 |

## Per-file Token Summary (estimated)

All FileMap token figures below are **estimated** (`len(text)/4`) unless noted.

### Ecommerce catalogue (fallback-ish FileMap after Gemini codegen failure)

| File | Category | Estimated tokens |
|---|---|---:|
| src/styles/global.css | layout | 992 |
| src/components/AppShell.jsx | ui | 421 |
| src/App.jsx | ui | 273 |
| src/components/ContactForm.jsx | ui | 220 |
| src/components/Hero.jsx | ui | 146 |
| src/hooks/useLocalState.js | ui-primitives | 135 |
| src/components/Toolbar.jsx | ui | 122 |
| src/components/DetailPanel.jsx | ui | 118 |
| src/components/FeatureGrid.jsx | ui | 118 |
| package.json | config | 96 |
| index.html | config | 87 |
| src/main.jsx | config | 49 |
| README.md | business-logic | 33 |
| src/utils/helpers.js | ui-primitives | 22 |
| styles.css | layout | 23 |
| **Totals** | | raw **2859** est. · JSON-wrapped **3038** est. · JSON overhead **179** est. |

Boilerplate share (**estimated**): **49.2%** (1404 / 2859) — categories config + layout + ui-primitives + imports + mock-data.

### Follow-up heal FileMap (order tracker + status filter path)

| File | Category | Estimated tokens |
|---|---|---:|
| src/styles/global.css | layout | 3889 |
| src/components/AppShell.jsx | ui | 1209 |
| src/components/OrderCard.jsx | ui | 752 |
| src/App.jsx | ui | 502 |
| src/data/seed.js | mock-data | 454 |
| src/components/Toolbar.jsx | ui | 410 |
| src/components/OrderList.jsx | ui | 390 |
| README.md | mock-data | 342 |
| src/utils/helpers.js | ui-primitives | 300 |
| src/hooks/useLocalState.js | ui-primitives | 165 |
| index.html | config | 126 |
| package.json | config | 91 |
| src/main.jsx | config | 62 |
| styles.css | layout | 23 |
| **Totals** | | raw **8719** est. · JSON-wrapped **10030** est. · JSON overhead **1311** est. |

Boilerplate share (**estimated**): **62.6%** (5452 / 8719).

Provider codegen tokens when Bedrock succeeded on heal attempt: **output 13214** / input **1944** / total **15158** (`usageSource=bedrock`, **provider** counts).

## Top 3 Bottlenecks (ranked by seconds that could be saved)

| Rank | Bottleneck | Kind | Evidence | Seconds that could be saved (estimate) |
|---:|---|---|---|---|
| 1 | Failed / stalled Gemini full-app codegen before useful FileMap | **model** | Ecommerce + ops each spent **~263 s** in `codegen` with `gemini-3.8-flash` `ok=false`; probe TTFT alone was **153 s** | **~200–260 s / run** by failing faster, skipping Gemini for codegen, or not waiting on a dead stream |
| 2 | Single monolithic JSON FileMap generation (even when Bedrock succeeds) | **model** | Heal codegen Bedrock success still **~65–73 s**; product waits for entire JSON before real files | **~40–60 s / run** via blueprint + deterministic scaffold + smaller per-file calls; also cuts JSON overhead (**179–1311 estimated tokens**) |
| 3 | Heal re-codegen after bad first FileMap | **model** (+ light **infrastructure**) | Follow-up: `heal_codegen_1` **73.4 s** model + ~3 s sandbox infra | **~70–75 s / run** when first-pass generation is correct (catalogue-first / scaffold reduces heal rate) |

Infrastructure stages that are *not* the primary baseline cost here: skeleton stream (~3.5 s), file replay (ms), sandbox start/health when reached (~3 s). They matter for UX perception but are dwarfed by model time.

## Catalogue-first shortcut — would it help?

**Yes.** With **~49–63% estimated boilerplate** and near-duplicate shell/CSS across apps, a catalogue-first path (search seed scripts → fork a match → generate only a diff / editor patch) would:

- Avoid most of the **~260 s** full FileMap codegen on common app shapes (order tracker, catalogue, ops dashboard).
- Replace heal full regenerations with small editor patches for follow-ups like “add a status filter”.
- Align with Terrarium’s Smart Match / library stories already in the backlog.

Recommendation for **Step 1**: prioritize (a) **codegen provider reliability / timeouts** so Gemini cannot burn ~260 s per failure, and (b) a **catalogue-first / scaffold-first** path that emits a blueprint + fills only business files — measured against this Step 0 baseline. Do not implement those changes in Step 0.

## How to re-run Step 0

```powershell
# From repo root, with API/worker rebuilt including codegen_metrics.py:
cd infra
docker compose -f docker-compose.yml -f docker-compose.codegen-metrics.yml up -d --build api worker

# Probe (API venv):
docker exec infra-api-1 mkdir -p /app/scripts /app/docs/codegen-metrics
docker cp ../scripts/codegen-streaming-probe.py infra-api-1:/app/scripts/
docker exec -w /app infra-api-1 /app/.venv/bin/python scripts/codegen-streaming-probe.py
docker cp infra-api-1:/app/docs/codegen-metrics/streaming-probe.json ../docs/codegen-metrics/

# Samples (host; needs TERRARIUM_TEST_TOKEN):
$env:TERRARIUM_TEST_TOKEN = "<token>"
$env:TERRARIUM_API_BASE = "http://127.0.0.1:3010"
python ../scripts/codegen-step0-runs.py
```
