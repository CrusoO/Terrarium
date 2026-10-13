"""Browser interaction gate for the five archetype edits."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "codegen-metrics" / "canary-edit-five"
SUMMARY = ROOT / "docs" / "codegen-metrics" / "canary-edit-five.json"

spec = importlib.util.spec_from_file_location("canary_validate", ROOT / "scripts" / "codegen-canary-validate.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def main() -> None:
    payload = json.loads(SUMMARY.read_text(encoding="utf-8"))
    gate.SHOTS.mkdir(parents=True, exist_ok=True)
    first = next(OUT.iterdir())
    gate._prepare(first, gate.LIVE, first.name)
    gate._ensure_pool()
    for row in payload["rows"]:
        folder = OUT / f"{row['archetype']}-{row['kind']}"
        gate._prepare(folder, gate.LIVE, folder.name)
        gate._restart_dev(folder.name)
        viewed = gate._browse(gate.LIVE, gate.SHOTS / f"edit-{folder.name}.png")
        row["loaded"] = viewed.get("loaded")
        row["interactionValidated"] = viewed.get("interactionValidated")
        row["errors"] = viewed.get("errors")
        row["behaviour"] = viewed.get("behaviour")
        print(json.dumps({"archetype": row["archetype"], "kind": row["kind"], "loaded": row["loaded"], "interactionValidated": row["interactionValidated"], "behaviour": row["behaviour"], "errors": row["errors"]}), flush=True)
    payload["interactionValidated"] = sum(1 for row in payload["rows"] if row.get("interactionValidated"))
    payload["loaded"] = sum(1 for row in payload["rows"] if row.get("loaded"))
    SUMMARY.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    gate._docker("rm", "-f", gate.NAME)
    print(json.dumps({"loaded": payload["loaded"], "interactionValidated": payload["interactionValidated"]}), flush=True)


if __name__ == "__main__":
    main()
