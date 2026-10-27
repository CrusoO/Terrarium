"""Run the flagged per-file pipeline and write timings. Does not change the default.

PER_FILE_PHASE=smoke|ab|scale|quality
PER_FILE_LIMIT=N caps the catalogue.
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
sys.path.insert(0, str(ROOT / "packages" / "py-contracts"))
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.contract_v2 import SPECS  # noqa: E402
from terrarium_agents.per_file import GATE, call_cost, run_per_file  # noqa: E402
from terrarium_agents.llm_stream import stream_with_one_continuation  # noqa: E402
from terrarium_agents.llm import bedrock_model  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics" / "per-file-eval.json"
APPS = ROOT / "docs" / "codegen-metrics" / "per-file-apps"


def _p95(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, int(round(0.95 * (len(ordered) - 1)))))
    return round(ordered[index], 3)


def _write_app(language: str, slug: str, files: dict[str, str]) -> None:
    folder = APPS / language / slug
    if folder.exists():
        for child in folder.rglob("*"):
            if child.is_file():
                child.unlink()
    for path, body in files.items():
        target = folder / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def _one(spec, language: str, folder_language: str | None = None) -> dict:
    started = time.monotonic()
    outcome = run_per_file(spec.prompt, language, live=True, spec=spec)
    wall = round(time.monotonic() - started, 3)
    _write_app(folder_language or language, spec.slug, outcome.files)
    row = outcome.public()
    row["wallSeconds"] = wall
    row["calls"] = [
        {key: call.get(key) for key in (
            "path", "role", "model", "ok", "timeToFirstTokenSeconds", "durationSeconds",
            "inputTokens", "outputTokens", "cacheCreationInputTokens", "cacheReadInputTokens",
            "stopReason", "failReason", "throttled", "queueSeconds", "applied",
        )}
        for call in outcome.calls
    ]
    print(json.dumps({k: row[k] for k in ("slug", "language", "wallSeconds", "staticOk", "repairs", "waves", "costUsd", "cacheReadTokens", "mismatchCount")}))
    return row


def _ab(limit: int) -> list[dict]:
    rows = []
    for spec in SPECS[:limit]:
        for language in ("jsdoc", "ts"):
            rows.append(_one(spec, language))
    return rows


def _scale(limit: int = 5) -> dict:
    specs = list(SPECS[:limit])
    rows: list[dict] = []
    lock = threading.Lock()
    started = time.monotonic()

    def _go(spec) -> None:
        row = _one(spec, "jsdoc", folder_language="scale")
        with lock:
            rows.append(row)

    threads = [threading.Thread(target=_go, args=(spec,)) for spec in specs]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    calls = [call for row in rows for call in row["calls"]]
    throttled = sum(1 for call in calls if call.get("throttled"))
    return {
        "apps": len(rows),
        "calls": len(calls),
        "wallSeconds": round(time.monotonic() - started, 3),
        "throttleRate": round(throttled / len(calls), 4) if calls else 0,
        "throttled": throttled,
        "queueP95Seconds": _p95([call.get("queueSeconds") or 0 for call in calls]),
        "callP95Seconds": _p95([call.get("durationSeconds") or 0 for call in calls]),
        "appP95Seconds": _p95([row["wallSeconds"] for row in rows]),
        "gateLimit": GATE.limit,
        "rows": [{k: row[k] for k in ("slug", "wallSeconds", "staticOk", "costUsd", "llmCalls")} for row in rows],
    }


def _quality(limit: int) -> list[dict]:
    system = "You write a Vite React app. Emit one block per file and nothing else:\n<<<FILE path=\"relative/path\">>>\ncontents\n<<<END FILE>>>"
    rows = []
    for spec in SPECS[:limit]:
        started = time.monotonic()
        first, second = stream_with_one_continuation(system, spec.prompt, bedrock_model(), max_tokens=16000)
        text = (first.text or "") + "\n" + ((second.text if second else "") or "")
        folder = APPS / "monolith" / spec.slug
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "stream.txt").write_text(text, encoding="utf-8")
        from terrarium_agents.per_file import feature_checks
        from terrarium_agents.tagged_files import TaggedFileParser

        parser = TaggedFileParser()
        parser.feed(text)
        if parser._open_path is None:
            parser.finish()
        files = dict(parser.files)
        for path, body in files.items():
            target = folder / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")
        rows.append({
            "slug": spec.slug,
            "wallSeconds": round(time.monotonic() - started, 3),
            "continued": bool(second),
            "stopReason": (second or first).stop_reason,
            "fileCount": len(files),
            "features": feature_checks(spec, files),
            "inputTokens": (first.input_tokens or 0) + ((second.input_tokens or 0) if second else 0),
            "outputTokens": (first.output_tokens or 0) + ((second.output_tokens or 0) if second else 0),
            "costUsd": round(call_cost({"model": first.model, "inputTokens": first.input_tokens, "outputTokens": first.output_tokens}) + (call_cost({"model": second.model, "inputTokens": second.input_tokens, "outputTokens": second.output_tokens}) if second else 0), 6),
        })
        print(json.dumps(rows[-1]))
    return rows


def _quotas() -> dict:
    import boto3
    from terrarium_agents.llm import bedrock_region

    client = boto3.client("service-quotas", region_name=bedrock_region())
    rows = []
    try:
        token = None
        while True:
            kwargs = {"ServiceCode": "bedrock", "MaxResults": 100}
            if token:
                kwargs["NextToken"] = token
            page = client.list_service_quotas(**kwargs)
            for quota in page.get("Quotas", []):
                name = str(quota.get("QuotaName") or "")
                if any(word in name.lower() for word in ("token", "request", "rpm", "tpm", "invoke")):
                    rows.append({"name": name, "value": quota.get("Value")})
            token = page.get("NextToken")
            if not token:
                break
    except Exception as error:
        return {"error": f"{type(error).__name__}: {error}", "quotas": rows}
    return {"quotas": rows}


def main() -> None:
    phase = os.environ.get("PER_FILE_PHASE", "ab")
    limit = int(os.environ.get("PER_FILE_LIMIT", "10"))
    payload: dict = {"phase": phase}
    if phase == "quotas":
        payload = _quotas()
    elif phase == "scale":
        payload = _scale(min(5, limit))
    elif phase == "quality":
        payload = {"rows": _quality(limit)}
    else:
        payload = {"rows": _ab(1 if phase == "smoke" else limit)}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    previous = {}
    if OUT.exists():
        previous = json.loads(OUT.read_text(encoding="utf-8"))
    previous[phase] = payload
    OUT.write_text(json.dumps(previous, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(OUT), "phase": phase}))


if __name__ == "__main__":
    main()
