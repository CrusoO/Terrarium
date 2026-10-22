"""One-off patch for already generated per-file apps. Not part of the product path."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "docs" / "codegen-metrics" / "per-file-apps"
OLD_MAIN = "createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)"
NEW_MAIN = (
    "const root = document.getElementById('root')\n"
    "if (root) createRoot(root).render(<React.StrictMode><App /></React.StrictMode>)"
)


def main() -> None:
    for path in ROOT.rglob("useData.*"):
        text = path.read_text(encoding="utf-8")
        updated = re.sub(
            r"export function useTotals\(items: (\w+)\[\]\)",
            r"export function useTotals(items: \1[] = [])",
            text,
        )
        updated = updated.replace("export function useTotals(items) {", "export function useTotals(items = []) {")
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            print("hook", path.relative_to(ROOT))
    for path in ROOT.rglob("main.*"):
        if path.suffix not in {".js", ".jsx", ".ts", ".tsx"}:
            continue
        text = path.read_text(encoding="utf-8")
        if OLD_MAIN in text:
            path.write_text(text.replace(OLD_MAIN, NEW_MAIN), encoding="utf-8")
            print("main", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
