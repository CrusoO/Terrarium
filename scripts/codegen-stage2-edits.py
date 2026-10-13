"""Ten recorded presentation edits on round-2 apps. Browser gating runs separately."""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]

from terrarium_agents.contract_v2 import spec_for_prompt  # noqa: E402
from terrarium_agents.llm_fixtures import assert_repair_budget, spend_summary  # noqa: E402
from terrarium_agents.per_file import run_blueprint_edit  # noqa: E402

METRICS = ROOT / "docs" / "codegen-metrics"
BASE = Path(os.environ.get("CODEGEN_EDIT_BASE", METRICS / "live-stage2b"))
OUT = Path(os.environ.get("CODEGEN_EDIT_OUT", METRICS / "live-stage2-edits"))
SUMMARY = Path(os.environ.get("CODEGEN_EDIT_SUMMARY", METRICS / "live-stage2-edits.json"))

PROMPTS = {
    "library": "Build a library checkout desk. Librarians search books, filter by status, add a book, and open its detail.",
    "parts-bin": "Build a parts bin. Mechanics search parts, filter by condition, add a part, and open its detail.",
    "volunteers": "Build a volunteer list. Coordinators search volunteers, filter by status, add a volunteer, and open a detail.",
    "greenhouse": "Build a greenhouse log. Gardeners search plants, filter by status, add a plant, and open its detail.",
    "tool-crib": "Build a tool crib. Techs search tools, filter by status, add a tool, and open its detail.",
}

CASES = (
    ("library", "add-field", {"name": "isbn", "type_name": "string", "sample": "978-1-60309-452-8"}),
    ("library", "change-label", {"title": "Loans desk"}),
    ("parts-bin", "rename", {"old": "qty", "new": "quantity"}),
    ("parts-bin", "new-filter", {"status": "Refurbished"}),
    ("volunteers", "add-field", {"name": "phone", "type_name": "string", "sample": "555-0142"}),
    ("volunteers", "new-page", {"name": "Schedule"}),
    ("greenhouse", "rename", {"old": "bed", "new": "zone"}),
    ("greenhouse", "change-label", {"title": "Plant care log"}),
    ("tool-crib", "new-filter", {"status": "Reserved"}),
    ("tool-crib", "new-page", {"name": "Maintenance"}),
)


def read_tree(folder: Path) -> dict[str, str]:
    return {
        path.relative_to(folder).as_posix(): path.read_text(encoding="utf-8")
        for path in folder.rglob("*")
        if path.is_file() and "node_modules" not in path.parts and "dist" not in path.parts
    }


def write_tree(folder: Path, files: dict[str, str]) -> None:
    for path, body in files.items():
        target = folder / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def main() -> None:
    rows = []
    for index, (slug, kind, kwargs) in enumerate(CASES, start=1):
        base = next(path for path in BASE.iterdir() if path.is_dir() and path.name.endswith(slug))
        spec = spec_for_prompt(PROMPTS[slug])
        files = read_tree(base)
        before = spend_summary()
        started = time.monotonic()
        outcome = run_blueprint_edit(files, spec, kind, live=True, **kwargs)
        wall = round(time.monotonic() - started, 3)
        folder = OUT / f"{index:02d}-{slug}-{kind}"
        write_tree(folder, outcome.files)
        after = spend_summary()
        changed = [path for path, body in outcome.files.items() if files.get(path) != body]
        rows.append({
            "index": index,
            "slug": slug,
            "kind": kind,
            "kwargs": kwargs,
            "folder": str(folder),
            "wallSeconds": wall,
            "modelCalls": len(outcome.calls),
            "modelOutputRecorded": len(outcome.calls) > 0,
            "changed": changed,
            "tokens": {
                "input": sum(int(call.get("inputTokens") or 0) for call in outcome.calls),
                "output": sum(int(call.get("outputTokens") or 0) for call in outcome.calls),
                "cacheRead": outcome.cache_read_tokens,
            },
            "costUsd": round(float(after["usd"]) - float(before["usd"]), 6),
        })
        print(json.dumps(rows[-1]), flush=True)
    assert_repair_budget(2)
    payload = {"edits": len(rows), "rows": rows, "spend": spend_summary()}
    SUMMARY.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(SUMMARY), "edits": len(rows), "spend": payload["spend"]}), flush=True)


if __name__ == "__main__":
    main()
