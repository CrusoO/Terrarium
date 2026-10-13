"""Generate the 22 unsupported holdout prompts with the monolith.

TERRARIUM_PER_FILE_CODEGEN is forced off. Writes each app and a JSON row
with completion, truncation, and raw <<<FILE markers.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

os.environ["TERRARIUM_PER_FILE_CODEGEN"] = "0"

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts"), str(ROOT / "packages" / "sandbox")]
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.canary import HOLDOUT, classify  # noqa: E402
from terrarium_agents.codegen import generate  # noqa: E402
from terrarium_agents.contract_v2 import file_is_closed  # noqa: E402
from terrarium_agents.llm import drain_llm_calls  # noqa: E402
from terrarium_contracts import AgentJob, Intent  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics" / "monolith-holdout"
SUMMARY = ROOT / "docs" / "codegen-metrics" / "monolith-holdout.json"
ENTITY = {"crud", "dashboard", "booking"}


def _write(folder: Path, files: dict[str, str]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for path, body in files.items():
        target = folder / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def main() -> None:
    rows = []
    prompts = [(kind, prompt) for kind, prompt in HOLDOUT if kind not in ENTITY]
    for index, (kind, prompt) in enumerate(prompts, start=1):
        decision = classify(prompt)
        started = time.monotonic()
        drain_llm_calls()
        error = ""
        files: dict[str, str] = {}
        try:
            result = generate(
                AgentJob(
                    sessionId=f"monolith-holdout-{index}",
                    intent=Intent(kind="new", stack="react", summary=prompt[:80]),
                    prompt=prompt,
                )
            )
            files = dict(result.files)
        except Exception as exc:  # noqa: BLE001 — one failed app must not stop the set
            error = f"{type(exc).__name__}: {exc}"
        wall = round(time.monotonic() - started, 3)
        calls = drain_llm_calls()
        codegen_calls = [call for call in calls if call.get("purpose") == "codegen"]
        markers = []
        unclosed = []
        for path, body in files.items():
            if "<<<FILE" in body or "<<<END FILE>>>" in body:
                markers.append(path)
            if path.endswith((".js", ".jsx", ".ts", ".tsx", ".css")) and not file_is_closed(body):
                unclosed.append(path)
        truncated = any(
            (call.get("outputTokens") or 0) >= 16000 or call.get("continued") or "max_token" in str(call.get("failReason") or "")
            for call in codegen_calls
        )
        slug = f"{kind}-{index}"
        if files:
            _write(OUT / slug, files)
        row = {
            "slug": slug,
            "archetype": kind,
            "classified": decision.archetype,
            "confidence": decision.confidence,
            "prompt": prompt,
            "completed": bool(files) and not error,
            "error": error,
            "wallSeconds": wall,
            "files": len(files),
            "truncated": truncated,
            "rawMarkers": markers,
            "unclosed": unclosed,
            "outputTokens": sum(call.get("outputTokens") or 0 for call in codegen_calls),
            "calls": len(codegen_calls),
        }
        rows.append(row)
        print(json.dumps({key: row[key] for key in ("slug", "completed", "truncated", "rawMarkers", "unclosed", "wallSeconds", "files", "error")}), flush=True)
    payload = {
        "apps": len(rows),
        "completed": sum(1 for row in rows if row["completed"]),
        "truncated": sum(1 for row in rows if row["truncated"]),
        "rawMarkerApps": sum(1 for row in rows if row["rawMarkers"]),
        "rows": rows,
    }
    SUMMARY.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(SUMMARY), "completed": payload["completed"], "truncated": payload["truncated"], "rawMarkerApps": payload["rawMarkerApps"]}), flush=True)


if __name__ == "__main__":
    main()
