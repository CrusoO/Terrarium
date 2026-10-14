"""Gemini (thinking=low, JSON and tagged) vs Bedrock Sonnet 4.6.

Three full-app prompts, three runs each. Gemini 503s retry with backoff, then
Bedrock failover. Each row records TTFT, total time, tokens, files, preboot,
and sandbox health.

Usage (API container venv, docker socket available):
  python scripts/codegen-bakeoff.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
sys.path.insert(0, str(ROOT / "packages" / "sandbox"))
sys.path.insert(0, str(ROOT / "packages" / "py-contracts"))

from terrarium_agents.llm import bedrock_model, model_for_provider  # noqa: E402
from terrarium_agents.llm_stream import stream_bedrock_text, stream_gemini_text  # noqa: E402
from terrarium_agents.tagged_files import TaggedFileParser  # noqa: E402
from terrarium_sandbox.runner import SandboxRunner  # noqa: E402
from terrarium_sandbox.trust.scanners import preboot_blocks_boot, scan  # noqa: E402

PROMPTS = [
    (
        "customer-order-tracker",
        "Build a customer/order tracker web app. Staff enter customer name, order items, "
        "pickup date, and payment status. Show a searchable order list, order detail panel, "
        "and a dashboard that displays daily totals. Use Vite React, in-memory mock data, "
        "no backend. Include package.json, vite.config.js, index.html, and src files.",
    ),
    (
        "ecommerce-catalogue",
        "Build an ecommerce catalogue web app. Shoppers browse a product grid, filter by "
        "category, open product detail, add items to a cart, and see a checkout summary. "
        "Use Vite React, in-memory mock data, no backend. Include package.json, "
        "vite.config.js, index.html, and src files.",
    ),
    (
        "operations-dashboard",
        "Build an operations dashboard web app. Supervisors enter jobs with owners and due "
        "dates, update status chips, and the app displays reports plus overdue work. Use "
        "Vite React, in-memory mock data, no backend. Include package.json, vite.config.js, "
        "index.html, and src files.",
    ),
]
TAGGED_SYSTEM = (
    "You write a Vite React app. Emit one block per file and nothing else:\n"
    '<<<FILE path="relative/path">>>\\ncontents\\n<<<END FILE>>>'
)
JSON_SYSTEM = (
    'You write a Vite React app. Return JSON only: {"files":{"relative/path":"contents"}}.'
)
RUNS = int(os.environ.get("BAKEOFF_RUNS", "3"))
BOOT = os.environ.get("BAKEOFF_BOOT", "1") == "1"


def _files_from_tagged(text: str) -> dict[str, str]:
    parser = TaggedFileParser()
    parser.feed(text)
    parser.finish()
    return dict(parser.files)


def _files_from_json(text: str) -> dict[str, str]:
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end < start:
        return {}
    try:
        payload = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return {}
    files = payload.get("files") if isinstance(payload, dict) else None
    if not isinstance(files, dict):
        return {}
    return {str(path): content for path, content in files.items() if isinstance(content, str)}


def _gemini_with_backoff(system: str, user: str, *, json_mode: bool):
    backoff = 2.0
    result = None
    for attempt in range(1, 4):
        result = stream_gemini_text(
            system,
            user,
            model_for_provider("gemini", "codegen"),
            json_mode=json_mode,
            thinking_level="low",
        )
        if result.ok or not (
            "503" in (result.fail_reason or "")
            or "429" in (result.fail_reason or "")
            or "RESOURCE_EXHAUSTED" in (result.fail_reason or "")
        ):
            return result, attempt, False
        if "503" not in (result.fail_reason or ""):
            break
        time.sleep(backoff)
        backoff *= 2
    os.environ["TERRARIUM_BEDROCK_THINKING"] = "disabled"
    failover = stream_bedrock_text(TAGGED_SYSTEM, user, bedrock_model())
    return failover, 3, True


def _boot(label: str, files: dict[str, str]) -> dict:
    findings, secrets, _ = scan(files, tool_id=label, version_id=label)
    blocked = preboot_blocks_boot(findings, secrets)
    row = {
        "prebootBlocked": blocked,
        "prebootFindings": [item.file for item in findings],
        "buildPass": False,
        "health": "not-booted",
        "previewUrl": None,
        "sandboxBooted": False,
    }
    if blocked or not BOOT or not files:
        row["health"] = "preboot-blocked" if blocked else "not-booted"
        return row
    runner = SandboxRunner()
    session_id = "bakeoff-" + label
    try:
        handle = runner.start(session_id, files=files)
        report = runner.wait_until_healthy(session_id, timeout_s=40)
        row["sandboxBooted"] = report.status == "running"
        row["health"] = report.status
        row["previewUrl"] = handle.previewUrl
        row["buildPass"] = report.status == "running"
        row["logsExcerpt"] = (report.logs or "")[-800:]
    except Exception as error:  # noqa: BLE001
        row["health"] = "boot-error"
        row["logsExcerpt"] = f"{type(error).__name__}: {error}"[:800]
    finally:
        try:
            runner.stop(session_id)
        except Exception:
            pass
    return row


def _row(mode: str, prompt_name: str, run_index: int, prompt: str) -> dict:
    started = time.monotonic()
    failed_over = False
    attempts = 1
    if mode == "bedrock":
        os.environ["TERRARIUM_BEDROCK_THINKING"] = "disabled"
        result = stream_bedrock_text(TAGGED_SYSTEM, prompt, bedrock_model())
        files = _files_from_tagged(result.text)
    elif mode == "gemini-low-json":
        result, attempts, failed_over = _gemini_with_backoff(JSON_SYSTEM, prompt, json_mode=True)
        files = _files_from_tagged(result.text) if failed_over else _files_from_json(result.text)
    else:
        result, attempts, failed_over = _gemini_with_backoff(TAGGED_SYSTEM, prompt, json_mode=False)
        files = _files_from_tagged(result.text)
    out_tokens = result.output_tokens or max(0, round(len(result.text) / 4))
    window = result.duration_s - (result.time_to_first_token_s or 0)
    if window < 0.25:
        window = result.duration_s or 0.001
    health = _boot(f"{mode}-{prompt_name}-{run_index}", files) if result.ok else {
        "prebootBlocked": None,
        "buildPass": False,
        "health": "no-output",
        "sandboxBooted": False,
        "previewUrl": None,
    }
    return {
        "mode": mode,
        "prompt": prompt_name,
        "run": run_index,
        "generationSource": "fallback" if failed_over else ("model-generated" if result.ok else "failed"),
        "provider": result.provider,
        "model": result.model,
        "ok": result.ok,
        "failReason": result.fail_reason,
        "geminiAttempts": attempts,
        "timeToFirstTokenSeconds": result.time_to_first_token_s,
        "totalSeconds": round(time.monotonic() - started, 3),
        "modelSeconds": round(result.duration_s, 3),
        "inputTokens": result.input_tokens,
        "outputTokens": result.output_tokens,
        "outputTokensPerSecond": round(out_tokens / max(window, 0.001), 2) if result.ok else None,
        "filesProduced": len(files),
        "timeToFirstFileSeconds": None,
        "timeToHealthyPreviewSeconds": round(time.monotonic() - started, 3) if health.get("health") == "running" else None,
        "healAttempts": 0,
        **health,
    }


def main() -> None:
    rows = []
    out = Path("docs/codegen-metrics/bakeoff.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    for mode in ("gemini-low-json", "gemini-low-tagged", "bedrock"):
        for name, prompt in PROMPTS:
            for index in range(1, RUNS + 1):
                row = _row(mode, name, index, prompt)
                rows.append(row)
                out.write_text(json.dumps({"rows": rows}, indent=2), encoding="utf-8")
                print(json.dumps({k: row[k] for k in (
                    "mode", "prompt", "run", "generationSource", "ok", "failReason",
                    "timeToFirstTokenSeconds", "totalSeconds", "outputTokens",
                    "outputTokensPerSecond", "filesProduced", "buildPass", "health",
                )}, default=str), flush=True)
    print(f"wrote {out}", flush=True)


if __name__ == "__main__":
    main()
