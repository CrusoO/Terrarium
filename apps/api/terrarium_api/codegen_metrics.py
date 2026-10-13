from __future__ import annotations

import json
import os
import re
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


_RUNS: dict[str, dict[str, Any]] = {}


def enabled() -> bool:
    return os.environ.get("CODEGEN_METRICS", "").strip().lower() in {"1", "true", "yes", "on"}


def _now_ms() -> int:
    return int(time.time() * 1000)


def _estimate_tokens(text: str) -> int:
    # Cheap local estimate for reports when provider usage metadata is missing.
    return max(1, round(len(text) / 4)) if text else 0


def start_run(session_id: str, prompt: str, *, run_type: str = "new") -> None:
    if not enabled():
        return
    started_at = _now_ms()
    _RUNS[session_id] = {
        "runId": f"{session_id}-{started_at}",
        "sessionId": session_id,
        "runType": run_type,
        "prompt": prompt,
        "startedAtMs": started_at,
        "stages": [],
        "modelCalls": [],
        "events": [],
    }


def event(session_id: str, name: str, payload: dict[str, Any] | None = None) -> None:
    if not enabled():
        return
    run = _RUNS.setdefault(session_id, {"sessionId": session_id, "stages": [], "modelCalls": [], "events": []})
    run["events"].append({"name": name, "atMs": _now_ms(), "payload": payload or {}})


@contextmanager
def stage(session_id: str, name: str, *, kind: str) -> Iterator[None]:
    if not enabled():
        yield
        return
    started = time.monotonic()
    started_wall = _now_ms()
    try:
        yield
    finally:
        run = _RUNS.setdefault(session_id, {"sessionId": session_id, "stages": [], "modelCalls": [], "events": []})
        run["stages"].append(
            {
                "name": name,
                "kind": kind,
                "startedAtMs": started_wall,
                "durationMs": int((time.monotonic() - started) * 1000),
            }
        )


def record_model_calls(session_id: str, stage_name: str, calls: list[dict[str, Any]]) -> None:
    if not enabled() or not calls:
        return
    run = _RUNS.setdefault(session_id, {"sessionId": session_id, "stages": [], "modelCalls": [], "events": []})
    for index, call in enumerate(calls, start=1):
        run["modelCalls"].append({**call, "stage": stage_name, "attempt": index})


def record_filemap(session_id: str, files: dict[str, str]) -> None:
    if not enabled():
        return
    raw_code = "\n".join(files.values())
    json_wrapped = json.dumps({"files": files}, separators=(",", ":"))
    by_file = {
        path: {
            "bytes": len(content.encode("utf-8")),
            "estimatedTokens": _estimate_tokens(content),
            "category": _classify_file(path, content),
        }
        for path, content in files.items()
    }
    run = _RUNS.setdefault(session_id, {"sessionId": session_id, "stages": [], "modelCalls": [], "events": []})
    run["fileMap"] = {
        "fileCount": len(files),
        "rawCodeBytes": len(raw_code.encode("utf-8")),
        "rawCodeEstimatedTokens": _estimate_tokens(raw_code),
        "jsonWrappedBytes": len(json_wrapped.encode("utf-8")),
        "jsonWrappedEstimatedTokens": _estimate_tokens(json_wrapped),
        "jsonOverheadEstimatedTokens": max(0, _estimate_tokens(json_wrapped) - _estimate_tokens(raw_code)),
        "tokensPerFileEstimated": by_file,
        "boilerplate": _boilerplate_summary(by_file),
    }


def finish_run(session_id: str, *, status: str) -> None:
    if not enabled():
        return
    run = _RUNS.get(session_id)
    if not run:
        return
    run["finishedAtMs"] = _now_ms()
    run["durationMs"] = run["finishedAtMs"] - int(run.get("startedAtMs", run["finishedAtMs"]))
    run["status"] = status
    run["headline"] = _headline(run)
    _write_run(run)


def _headline(run: dict[str, Any]) -> dict[str, Any]:
    events = run.get("events") or []
    stages = run.get("stages") or []
    first_file = next((e for e in events if e.get("name") == "codegen.first_file"), None)
    healthy = next((e for e in events if e.get("name") == "preview.healthy"), None)
    started = int(run.get("startedAtMs") or 0)
    heal_attempts = sum(1 for e in events if e.get("name") == "heal.attempt")
    source = "fallback"
    for call in reversed(run.get("modelCalls") or []):
        if call.get("purpose") == "codegen" and call.get("ok"):
            source = "model-generated"
            break
    if any("fallback" in str(e.get("name")) for e in events):
        source = "fallback"
    return {
        "generationSource": source,
        "timeToFirstFileSeconds": (
            round((int(first_file["atMs"]) - started) / 1000, 3)
            if first_file and started
            else None
        ),
        "timeToHealthyPreviewSeconds": (
            round((int(healthy["atMs"]) - started) / 1000, 3)
            if healthy and started
            else None
        ),
        "healAttempts": heal_attempts,
        "modelStageSeconds": round(
            sum(int(s.get("durationMs") or 0) for s in stages if s.get("kind") == "model") / 1000,
            3,
        ),
        "infrastructureStageSeconds": round(
            sum(int(s.get("durationMs") or 0) for s in stages if s.get("kind") == "infrastructure") / 1000,
            3,
        ),
    }


def _write_run(run: dict[str, Any]) -> None:
    out_dir = Path(os.environ.get("CODEGEN_METRICS_DIR") or "docs/codegen-metrics")
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{run.get('runId') or run['sessionId']}.json"
    path.write_text(json.dumps(run, indent=2, sort_keys=True), encoding="utf-8")


def _classify_file(path: str, content: str) -> str:
    lower = path.lower()
    if lower.endswith(("package.json", "vite.config.js", "vite.config.ts", "index.html", "main.jsx", "main.tsx")):
        return "config"
    if "/components/" in lower or lower.endswith(("app.jsx", "app.tsx")):
        return "ui"
    if "/hooks/" in lower or "/utils/" in lower or "/lib/" in lower:
        return "ui-primitives"
    if re.search(r"\b(import|export)\b", content) and len(content) < 400:
        return "imports"
    if re.search(r"\b(sample|mock|seed|initial[A-Z]|\[\s*\{)", content):
        return "mock-data"
    if lower.endswith((".css", ".scss")):
        return "layout"
    return "business-logic"


def _boilerplate_summary(by_file: dict[str, dict[str, Any]]) -> dict[str, Any]:
    buckets: dict[str, int] = {}
    for info in by_file.values():
        category = str(info["category"])
        buckets[category] = buckets.get(category, 0) + int(info["estimatedTokens"])
    boilerplate_categories = {"config", "layout", "ui-primitives", "imports", "mock-data"}
    boilerplate_tokens = sum(tokens for category, tokens in buckets.items() if category in boilerplate_categories)
    total_tokens = sum(buckets.values())
    return {
        "estimatedTokensByCategory": buckets,
        "estimatedBoilerplateTokens": boilerplate_tokens,
        "estimatedBoilerplateShare": round(boilerplate_tokens / total_tokens, 3) if total_tokens else 0,
    }
