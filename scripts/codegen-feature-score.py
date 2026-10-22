"""Score the checklist on apps already on disk."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]
from terrarium_agents.contract_v2 import SPECS  # noqa: E402
from terrarium_agents.per_file import feature_checks  # noqa: E402

APPS = ROOT / "docs" / "codegen-metrics" / "per-file-apps"


def _files(folder: Path) -> dict[str, str]:
    files = {}
    for path in folder.rglob("*"):
        if not path.is_file():
            continue
        if any(part in {"node_modules", "dist", "vendor"} for part in path.parts):
            continue
        if path.suffix not in {".js", ".jsx", ".ts", ".tsx", ".css"}:
            continue
        files[path.relative_to(folder).as_posix()] = path.read_text(encoding="utf-8", errors="replace")
    return files


def main() -> None:
    for language in ("jsdoc", "ts"):
        passed = 0
        total = 0
        for spec in SPECS:
            folder = APPS / language / spec.slug
            checks = feature_checks(spec, _files(folder))
            ok = sum(1 for value in checks.values() if value)
            passed += ok
            total += len(checks)
            print(language, spec.slug, checks)
        print(language, "checklist", passed, "/", total)


if __name__ == "__main__":
    main()
