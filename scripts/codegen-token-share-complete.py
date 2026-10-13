"""Token shares for complete per-file apps. The truncated nine-app set is retired."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPS = ROOT / "docs" / "codegen-metrics" / "per-file-apps"
OUT = ROOT / "docs" / "codegen-metrics" / "token-share-complete.json"

_spec = importlib.util.spec_from_file_location("codegen_token_share", ROOT / "scripts" / "codegen-token-share.py")
_mod = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(_mod)


def _files(folder: Path) -> dict[str, str]:
    files = {}
    for path in folder.rglob("*"):
        if not path.is_file() or path.suffix == ".map":
            continue
        if any(part in {"node_modules", "dist", "vendor"} for part in path.parts):
            continue
        if path.name in {"render-check.mjs", "tsconfig.json", "spike-render.mjs"}:
            continue
        files[path.relative_to(folder).as_posix()] = path.read_text(encoding="utf-8", errors="replace")
    return files


def main() -> None:
    rows = []
    for folder in sorted(path for path in APPS.glob("*/*") if path.parent.name in {"jsdoc", "ts"}):
        if not (folder / "package.json").exists():
            continue
        summary = _mod.summarize(_files(folder))
        summary["language"] = folder.parent.name
        summary["slug"] = folder.name
        summary["complete"] = True
        rows.append(summary)
    shares = [row["scaffoldUiKitShare"] for row in rows]
    payload = {
        "retiredTruncatedNine": "docs/codegen-metrics/retired-truncated-nine.json",
        "apps": len(rows),
        "meanScaffoldShare": round(sum(shares) / len(shares), 3) if shares else None,
        "rows": rows,
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"apps": payload["apps"], "meanScaffoldShare": payload["meanScaffoldShare"], "out": str(OUT)}))


if __name__ == "__main__":
    main()
