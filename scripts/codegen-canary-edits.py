"""Edits on five archetypes. Only affected pages go to the model.

Each edit is then opened in the browser interaction gate.
CANARY_EDIT_LIVE=1 calls the model. The default builds the scaffold and still
runs the gate, so a dry run does not spend tokens.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]

from terrarium_agents.contract_v2 import SPECS, spec_for_prompt  # noqa: E402
from terrarium_agents.per_file import run_blueprint_edit, run_per_file  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics" / "canary-edit-five"
SUMMARY = ROOT / "docs" / "codegen-metrics" / "canary-edit-five.json"
LIVE = os.environ.get("CANARY_EDIT_LIVE", "1") == "1"

CASES = [
    ("crud", SPECS[0], [("add-field", {"name": "note", "type_name": "string", "sample": "Leave at door"})]),
    ("dashboard", SPECS[2], [("rename", {"old": "owner", "new": "lead"})]),
    ("booking", SPECS[3], [("new-filter", {"status": "Waiting"})]),
    ("landing", spec_for_prompt("Build a landing page for a pottery studio with a hero section and a pricing section."), [("add-field", {"name": "phone", "type_name": "string", "sample": "555-0100"})]),
    ("charts", spec_for_prompt("Build a sales chart page with a bar graph of monthly revenue."), [("new-page", {"name": "Compare"})]),
]


def _write(folder: Path, files: dict[str, str]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for path, body in files.items():
        target = folder / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def _gate(folder: Path) -> dict:
    env = dict(os.environ)
    env["CANARY_ONLY"] = folder.name
    # The validate script reads the raw/holdout trees. Point it at this edit folder
    # by dropping a copy where it already looks, then invoking the browser directly
    # is simpler: reuse the validate module's helpers.
    import importlib.util

    spec = importlib.util.spec_from_file_location("canary_validate", ROOT / "scripts" / "codegen-canary-validate.py")
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)

    gate._prepare(folder, gate.LIVE, folder.name)
    if not gate._docker("inspect", "-f", "{{.State.Running}}", gate.NAME).stdout.strip().startswith("true"):
        gate._ensure_pool()
    gate._wait_http(20, folder.name)
    shot = gate.SHOTS / f"edit-{folder.name}.png"
    gate.SHOTS.mkdir(parents=True, exist_ok=True)
    return gate._browse(gate.LIVE, shot)


def main() -> None:
    rows = []
    for archetype, spec, edits in CASES:
        base = run_per_file(spec.prompt, live=False, spec=spec).files
        files = base
        current = spec
        for kind, kwargs in edits:
            started = time.monotonic()
            outcome = run_blueprint_edit(files, current, kind, live=LIVE, **kwargs)
            wall = round(time.monotonic() - started, 3)
            current = outcome.contract.spec
            changed = [path for path, body in outcome.files.items() if files.get(path) != body]
            pages = [path for path in changed if "/views/" in path]
            files = outcome.files
            folder = OUT / f"{archetype}-{kind}"
            _write(folder, files)
            viewed = _gate(folder) if os.environ.get("CANARY_EDIT_GATE", "1") == "1" else {}
            row = {
                "archetype": archetype,
                "kind": kind,
                "wallSeconds": wall,
                "filesChanged": len(changed),
                "changed": changed,
                "pagesRewritten": pages,
                "modelCalls": len(outcome.calls),
                "packageUntouched": "vite" in files.get("package.json", "") and "hacked" not in files.get("package.json", ""),
                "loaded": viewed.get("loaded"),
                "interactionValidated": viewed.get("interactionValidated"),
                "errors": viewed.get("errors"),
                "behaviour": viewed.get("behaviour"),
            }
            rows.append(row)
            print(json.dumps({key: row[key] for key in ("archetype", "kind", "wallSeconds", "filesChanged", "pagesRewritten", "loaded", "interactionValidated")}), flush=True)
    interaction = sum(1 for row in rows if row["interactionValidated"])
    payload = {"edits": len(rows), "interactionValidated": interaction, "rows": rows}
    SUMMARY.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(SUMMARY), **{key: payload[key] for key in ("edits", "interactionValidated")}}), flush=True)


if __name__ == "__main__":
    main()
