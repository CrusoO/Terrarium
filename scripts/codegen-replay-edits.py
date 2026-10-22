"""Write 25 blueprint edits from the scaffold. No model calls.

Five archetypes, five edits each: add-field, rename, new-filter, new-page,
and a second add-field. The browser gate reads the folders afterwards.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]

from terrarium_agents.contract_v2 import SPECS, spec_for_prompt  # noqa: E402
from terrarium_agents.per_file import run_blueprint_edit, run_per_file  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics" / "canary-edit-replay"

CASES = [
    ("crud", SPECS[0], "city", "town"),
    ("dashboard", SPECS[2], "owner", "lead"),
    ("booking", SPECS[3], "service", "offering"),
    ("landing", spec_for_prompt("Build a landing page for a pottery studio with a hero section and a pricing section."), "email", "mail"),
    ("charts", spec_for_prompt("Build a sales chart page with a bar graph of monthly revenue."), "label", "month"),
]
EDITS = (
    ("add-field", lambda _old, _new: {"name": "note", "type_name": "string", "sample": "Leave at door"}),
    ("rename", lambda old, new: {"old": old, "new": new}),
    ("new-filter", lambda _old, _new: {"status": "Waiting"}),
    ("new-page", lambda _old, _new: {"name": "Archive"}),
    ("add-field-2", lambda _old, _new: {"name": "phone", "type_name": "string", "sample": "555-0100"}),
)


def _write(folder: Path, files: dict[str, str]) -> None:
    for path, body in files.items():
        target = folder / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


def main() -> None:
    rows = []
    for archetype, spec, old, new in CASES:
        base = run_per_file(spec.prompt, live=False, spec=spec).files
        for kind, kwargs_for in EDITS:
            kwargs = kwargs_for(old, new)
            edit_kind = "add-field" if kind == "add-field-2" else kind
            outcome = run_blueprint_edit(base, spec, edit_kind, live=False, **kwargs)
            folder = OUT / f"{archetype}-{kind}"
            _write(folder, outcome.files)
            app = outcome.files.get("src/App.jsx", "")
            rows.append({
                "folder": str(folder),
                "archetype": archetype,
                "kind": kind,
                "hasDetail": "DetailPage" in app,
                "hasForm": "FormPage" in app,
                "hasFilter": "filter-row" in outcome.files.get("src/components/FilterTabs.jsx", ""),
            })
    print(json.dumps({"edits": len(rows), "rows": rows}, indent=2))


if __name__ == "__main__":
    main()
