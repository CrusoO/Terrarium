# Terrarium readiness report

**Verdict: NO-GO** for internal UI testing and for the demo.

Host for every result below: Windows 11 (10.0.26200), with generation and the sandbox running in Linux containers (`infra-api-1`, `infra-worker-1`, `terrarium-node-sandbox:p1-s3`). This is not a Linux demo machine. No result here is a Linux-staging p95.

Phase 3 did not start. Live spend this run: **$0**. Dry-run estimate before that decision: **$0.6253** for 15 per-file generations plus 15 edits, under the $1.50 cap only if every call stays on Haiku. One monolith Sonnet call is about $0.50 and is not in that estimate.

No product code was changed. The gaps below are behavior changes, not one-line fixes.

## Preflight

| Check | Result |
|---|---|
| Code hash (host and `infra-api-1`) | `cc82f88e05b111ae5309952a8d36532fce53855473610f8f3529ec15c638f4b0` (match) |
| Scaffold version | `3` |
| `tsc` in `terrarium-node-sandbox:p1-s3` | `5.6.3` |
| `node_modules` baked at `/opt/terrarium/node_modules` | present, 111 packages |
| `DEMO_MODE` | unset in the API and the worker. No `DEMO_MODE` flag exists in the API, web app, or codegen package |
| Kill switch | not present |
| `CODEGEN_LLM_MODE` on the running API and worker | unset (a real UI submit would call the model) |
| `TERRARIUM_TEST_TOKEN` on this host | missing |
| Web UI on port 5173 | not listening |

Preflight **aborts**. Phase 2 (Playwright against the running stack) and Phase 3 (live prompts) were not run. Driving the current worker would spend money, and there is no kill switch to stop a run.

## Phase 1 — offline

Replay mode, no Bedrock.

| Suite | Result |
|---|---|
| Replay (`test_replay.py`, includes the negative harness) | 31 passed |
| Contract (`test_contract_v2.py`) | 7 passed |
| Parser (`test_tagged_files.py`) | 5 passed |
| Codegen (`test_codegen.py`) | 27 passed |
| Intent (`test_intent.py`) | 28 passed |
| LLM, editor, heal, edit check, intent-to-codegen | 28 passed |
| **Agent total** | **126 passed, 0 failed** |
| Sandbox scanners, attacks, smoke, preview URL | 21 passed |

The negative harness (`test_broken_app_fails_the_interaction_gate`) passed: a static app whose add, detail, and filter do nothing fails the interaction gate.

Scanner tests cannot be collected on the host until a stub `docker` module is inserted, because the sandbox package imports `docker` at import time and this host has no `docker` Python package. The API container can import the scanners, and its venv has no pytest. The 21 passes used the stub import on the host. The secret-scan test inside the replay suite also passed.

No failure was rerun. Nothing in this run was flaky. Pytest printed a Windows `WinError 5` while deleting its temp directory after the agent suite. The tests had already passed.

Secrets scan of fixtures and the stage-2 generated trees: 1,040 files, 0 hits for `sk_live_`, `AKIA`, `BEGIN PRIVATE KEY`, `xoxb-`, `ghp_`.

### Failure injection

FakeProvider, no model cost. Raw rows are in `docs/codegen-metrics/readiness-phase1.json`. "Clear message" means a session event or UI string the user can read. Code-only paths were not clicked in a browser.

| Case | Clear message | Broken app shown as success | Ends cleanly |
|---|---|---|---|
| Truncated `max_tokens` | No. The cut files are replaced by stubs and `staticOk` stays true | No broken file left; the user is not told the model output was discarded | Yes, inside the generator |
| Unclosed file, bad import, function `addItem`, array vs single row | No. Those shapes target `ListPage` / `FormPage`, which the scaffold owns, so a full `run_per_file` never keeps the broken text. The unit gates do detect the same text when it is planted in the file | No | Yes |
| `tsc` error | No | **Yes, if this file map is booted.** `staticOk` is false, 2 repairs, `degraded` is empty. The worker never reads `staticOk` before `preview.ready` | The generator returns; the session would still go on to boot |
| Repair search string does not match | No | The file is left as it was. It is **not** regenerated once | Yes |
| Two failed repairs | No user-facing degrade message. Calling `degrade_failed_files` on a named model file does replace `OrderCard.tsx` | The live `tsc` path did not degrade anything | Yes |
| Model timeout, 429, provider error | No. Each one becomes stub leaves and `staticOk` true. The 429 run did shrink the gate (`throttles` 17) | A generic stub app would be served as a finished app | Yes |
| Sandbox crash | Yes, in code: `sandbox.unhealthy`, no `preview.ready`. UI label "Preview failed" | No | Yes. Not clicked in the browser |
| Preview health failure | Yes, in code. Chat copy is "The sandbox stayed unhealthy." | No | Yes. Not clicked in the browser |
| SSE disconnect | Yes, in code: reconnect, then "Lost the session event stream." | No | Yes. Not clicked in the browser |
| Duplicate submit | No. The worker logs that the job was dropped | No | The lock is released; the user is not told |
| Unsupported prompt | No "not supported yet" | The monolith path is still entered. `DEMO_MODE` cannot suppress it | No |
| Non-allowlisted account | No | `canary_per_file` is false for `stranger@example.com`. The request is not rejected; it falls through to the monolith | No |

The three `tsc` diagnostics from the FakeProvider TypeScript run:

- `src/views/DashboardPage.tsx(6,63): error TS2322` — `totals` is not assignable to `IntrinsicAttributes`
- `src/views/ListPage.tsx(25,55): error TS2322` — `OrderCard` props are not assignable to `IntrinsicAttributes`
- `src/views/ListPage.tsx(25,78): error TS7006` — parameter `id` implicitly has an `any` type

`degrade_failed_files` only replaces a path when the diagnostic names a model file. These diagnostics name scaffold pages, so the leaf that actually lacks the props is left in place. `lock_scaffold` then restores the pages, and the errors remain.

### Concurrency

Recorded fixture latencies run from 6.8s to 110.8s and include monolith calls. Sleeping them for 50 apps would not finish in this pass, so this is a **simulation** of `AdaptiveGate` (limit 8) using those latencies as service time and the 2 model calls a FakeProvider per-file run actually made. It is not a measured time to a validated preview, and it is not a Linux-host number.

| Load | Queue mean | Queue p95 | Completion p95 | Errors |
|---|---|---|---|---|
| 5 at once | 0.0s | 0.0s | 162.8s | 0 |
| 20 at once | 5.3s | 55.7s | 109.9s | 0 |
| 50 over 5 minutes | 0.6s | 0.0s | 165.2s | 0 |

The completion times are dominated by the long recorded samples, not by queueing. They do **not** satisfy "p95 time to validated preview < 45s".

## Phase 2 — real UI

**Not run.**

The web app was not listening. `TERRARIUM_TEST_TOKEN` was not set, and this pass does not bypass auth. The running worker is not in `CODEGEN_LLM_MODE=replay`, so typing a prompt in the UI would call the model. There is no kill switch to turn on mid-run.

Not verified in a browser: blueprint-first screen, progress text, preview iframe, console, interaction gate, relevance gate, axe-core, desktop and mobile screenshots, retry, refresh recovery, reopening a session, or two sessions at once.

From code only: retry exists (`retryAnyway`), SSE reconnect exists, and a health failure emits `sandbox.unhealthy` instead of `preview.ready`. None of that was exercised.

## Phase 3 — live prompts

**Not run.** Preflight aborted first.

Dry-run estimate, printed before that stop:

| Piece | Amount |
|---|---|
| 5 prompts × 3 runs, measured $0.0186 per app, plus 15% repair margin | $0.3208 |
| 5 edits × 3, using the stage-2 average of $0.0203 per edit | $0.3045 |
| **Total if every call stays per-file Haiku** | **$0.6253** |
| Cap | $1.50 |

Offline classification of the five prompts (no model call). All five are supported archetypes for the allowlisted canary email. A public account would not get per-file; it would fall through to the monolith.

| Prompt | Archetype | Confidence | Pass |
|---|---|---|---|
| Purchase order tracker | crud | 0.78 | 0/3, not run |
| Operations dashboard for failed integration messages | dashboard | 0.92 | 0/3, not run |
| Spare parts inventory | crud | 0.78 | 0/3, not run |
| Equipment booking | booking | 0.92 | 0/3, not run |
| IT change request tracker | crud | 0.78 | 0/3, not run |

Live edits ("add a priority field"): **not for demo**. None of the apps were validated, so the edit runs were not started.

No timings, tokens, repairs, screenshots, or Playwright traces exist for this phase because no live run was started.

The last measured validated rate on supported blind prompts (stage 2, already finished, not rerun) was 8/17, with a mixed-host p95 to a validated preview of 55.9s. That number is Windows browser plus Linux generation. It is already over 45s, and it is not a substitute for the five prompts in this request.

## Bugs

| Severity | Bug | Fixed |
|---|---|---|
| Blocker | `DEMO_MODE` and a kill switch do not exist. An unsupported prompt still enters the monolith. A run cannot be stopped from outside the process | No |
| Blocker | The worker boots a preview without looking at `staticOk`, `tsc` errors, or stub fallbacks. A failed TypeScript app can reach `preview.ready` | No |
| High | A repair whose search string misses does not regenerate that file. Two failed `tsc` repairs left 3 errors and degraded nothing, because the diagnostics name scaffold pages | No |
| High | Timeout, 429, and provider errors are replaced with stub leaves and reported `staticOk` true. The user gets no message | No |
| High | Duplicate submit is dropped with a log line only | No |
| High | A non-allowlisted account is not rejected | No |
| High | The sandbox network `terrarium-sandbox` is not internal. From that network, HTTP and HTTPS to `example.com` both succeed. Limits on a running sandbox container are present: 0.5 CPU, 768MB, 128 pids, not privileged | No |
| Setup | No test token in the environment, web UI not running, worker not in replay mode | No |

The security scanners did run (8 scanner tests and 2 attack tests inside the 21 sandbox passes, plus the replay suite's on-disk scanner-rules test).

## GO bar

| Bar | This run |
|---|---|
| Replay and negative tests green | Yes. 126 agent tests, 21 sandbox tests, negative harness passed |
| Every injected failure ends with a clear message and no broken app shown as success | No |
| Five demo prompts pass 3 of 3 in the real UI | Not run |
| Live edits at least 2 of 3 | Not run. Listed as not for demo |
| p95 to a validated preview under 45s on the demo machine | Not measured here. Last mixed-host figure was 55.9s |
| Kill switch, retry, and refresh recovery | Kill switch missing. Retry and refresh not exercised |
| No secrets; scanners run; sandbox has no outbound network and has resource limits | Secrets clean and scanners ran. Outbound network is open. Limits exist |
| Live spend under $1.50 | $0 spent. The live pass was not attempted |

## Top 5 blockers

1. **No demo mode and no kill switch.** Smallest fix: at the start of `generate()` and the worker, if `DEMO_MODE` is on and the archetype is unsupported, append one session event whose text is "not supported yet" and return before the monolith. A second env flag should do the same with "generation is paused" and must be readable mid-run.
2. **A failed build can still be shown as a ready preview.** Smallest fix: if `staticOk` is false or any file was replaced by a stub after a model error, emit `sandbox.unhealthy` with the diagnostic text and do not emit `preview.ready`.
3. **A missed repair patch does not regenerate the file, and degrade ignores scaffold-page diagnostics.** Smallest fix: when `apply_patches` applies nothing, regenerate that model file once. When a `tsc` diagnostic names a scaffold page, degrade the leaf component named in the same line.
4. **p95 under 45s is not shown, and the five demo prompts have no validated runs.** Smallest fix: after the three items above, run the 15 generations on one Linux host in replay for the harness and only then the capped live pass. Do not change thresholds or the 16,000 token cap to make the clock pass.
5. **The sandbox can open outbound connections.** Smallest fix: make `terrarium-sandbox` an internal Docker network so containers keep their resource limits and cannot route to the public internet. Preview routing has to stay on that internal network.

## Limitations

This pass did not cover unsupported archetypes end to end (games, auth, file upload), backend generation, a signed-in browser session, refresh during generation, two sessions at once, real customer traffic, or a Linux demo host. Accessibility (axe-core), desktop and mobile screenshots, and Playwright traces were not collected. The concurrency numbers are a gate simulation on recorded latencies, not 50 live apps.
