# Codegen Steps 1A / 1B / 1C Notes

## 1A — Reliability (implemented)

| Knob | Default | Env override |
|---|---|---|
| First-token timeout | **25s** | `CODEGEN_FIRST_TOKEN_TIMEOUT_S` |
| Total codegen cap | **120s** | `CODEGEN_TOTAL_TIMEOUT_S` |
| Streaming codegen | **on** | `TERRARIUM_CODEGEN_STREAM=0` to disable |
| Output format | **tagged** | `TERRARIUM_CODEGEN_FORMAT=json` for legacy JSON FileMap |
| Gemini thinking | unset | `TERRARIUM_GEMINI_THINKING_LEVEL=low` (optional) |

Codegen now streams (Bedrock `invoke_model_with_response_stream`, Gemini `generate_content_stream`) and **fails over** to the next provider on `first_token_timeout`, `total_timeout`, empty stream, or unusable output.

### Why Gemini took ~153s to first token (Step 0 probe)

Likely combination of:

1. **Thinking / internal deliberation** on Gemini 3.x Flash before emitting visible tokens (especially with JSON MIME mode).
2. **`response_mime_type=application/json`** — structured mode often buffers or delays first visible text until a valid JSON prefix is ready.
3. **Region / capacity** — long TTFT with eventual success looks like queueing, not a hard 429 in our logs.
4. **SDK retries** — `google-genai` may retry/backoff under the hood; Step 0’s non-stream `generate_content` with `HttpOptions(timeout=180_000)` still ran **~263s**, so the configured 180s timeout was **not** a hard wall clock for that call.

### Does ~260s equal a configured timeout?

**No.** Configured Gemini JSON HTTP timeout was **180s** (`DEFAULT_GEMINI_JSON_TIMEOUT_MS`). Observed codegen stage was **~263s** for a single failed Gemini attempt. That excess implies SDK/socket behavior beyond the intended 180s budget (retries, thinking stall, or timeout not enforced on the blocking call). New stream path enforces **our own** first-token (25s) and total (120s) deadlines between chunks.

Diagnostic script: `scripts/codegen-gemini-ttft-diag.py` (low thinking × JSON on/off).

## 1B — Streaming verification (implemented)

- Every stream chunk logs `{t, chars, cumulativeChars, delta}` (providers) / probe writes `chunkTimeline`.
- Product path no longer uses non-stream `invoke_model` for codegen when `TERRARIUM_CODEGEN_STREAM=1`.
- If Bedrock still looked buffered in Step 0 product runs, root cause was **API used**: `invoke_model` (full body) rather than `invoke_model_with_response_stream`. That is fixed for codegen.

## 1C — Bedrock latency-optimized (report only — not enabled)

| Option | Supports `anthropic.claude-sonnet-4-6`? | Notes |
|---|---|---|
| **Latency-optimized inference** (`performanceConfig.latency = optimized`) | **No** | Docs list only Nova Pro, Claude **3.5 Haiku**, Llama 3.1 70B/405B (US cross-region profiles). |
| **Priority service tier** (`service_tier: priority`) | **Possibly / model-card mentions tiers** | Sonnet 4.6 model card discusses Standard / Priority / Flex. Up to ~25% better OTPS vs Standard on supported models. **Not enabled** — needs your approval (cost premium). |

We will not set latency-optimized or Priority tier without your go-ahead.

## Step 2 — Tagged blocks (implemented)

- Default `TERRARIUM_CODEGEN_FORMAT=tagged`.
- Incremental parse via `TaggedFileParser`; each closed file emits `preview.stream.file` during codegen.
- JSON path kept behind `TERRARIUM_CODEGEN_FORMAT=json`.

## Step 3 — Heal patches (implemented)

- When `errorContext` is present (heal path), editor returns `{patches:[{path,search,replace}]}` for failing files only and applies them locally.
- Heal router prompt prefers **editor** over full codegen when a FileMap exists.
