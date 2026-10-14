"""Repair the TypeScript apps whose type check failed. Max two attempts."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.contract_v2 import SPECS, Mismatch, build_contract  # noqa: E402
from terrarium_agents.per_file import _repair_once  # noqa: E402

APPS = ROOT / "docs" / "codegen-metrics" / "per-file-apps" / "ts"
CASES = {
    "expenses": [
        Mismatch(
            "src/components/TotalsCard.tsx",
            "TotalsCard",
            "src/views/DashboardPage.tsx",
            "totals",
            "TS2339: Property 'spentOn' does not exist on type 'DailyTotal'. DailyTotal fields are date, count, and total.",
        )
    ],
    "guests": [
        Mismatch(
            "src/components/GuestCard.tsx",
            "GuestCard",
            "src/views/FormPage.tsx",
            "item",
            "TS2304: Cannot find name 'Guest'. Import the Guest type from '../types'. Also FormPage passes id inside Omit<Guest, 'id'>; do not send id to addItem.",
        )
    ],
    "recipes": [
        Mismatch(
            "src/views/FormPage.tsx",
            "useRecipeActions",
            "src/views/FormPage.tsx",
            "addItem",
            "TS2353: Object literal may only specify known properties, and 'id' does not exist in type Omit<Recipe, 'id'>. Remove id from the addItem argument.",
        )
    ],
    "roster": [
        Mismatch(
            "src/views/FormPage.tsx",
            "useStudentActions",
            "src/views/FormPage.tsx",
            "addItem",
            "TS2345: addItem expects Omit<Student, 'id'>, not a function. Pass an object with the form fields.",
        )
    ],
}


def _load(folder: Path) -> dict[str, str]:
    files = {}
    for path in folder.rglob("*"):
        if path.is_file() and path.suffix in {".ts", ".tsx", ".css", ".json", ".html"} and "node_modules" not in path.parts:
            files[path.relative_to(folder).as_posix()] = path.read_text(encoding="utf-8")
    return files


def main() -> None:
    specs = {spec.slug: spec for spec in SPECS}
    log = []
    for slug, mismatches in CASES.items():
        folder = APPS / slug
        files = _load(folder)
        contract = build_contract(specs[slug], "ts")
        attempts = []
        for _ in range(2):
            repair = _repair_once(files, contract, mismatches)
            attempts.append({
                "implicated": repair["implicated"],
                "applied": repair["applied"],
                "ok": repair["ok"],
                "durationSeconds": repair["durationSeconds"],
                "failReason": repair["failReason"],
            })
            if repair["applied"]:
                break
        for rel, body in files.items():
            target = folder / rel
            if target.exists():
                target.write_text(body, encoding="utf-8")
        log.append({"slug": slug, "attempts": attempts})
        print(json.dumps(log[-1]))
    out = ROOT / "docs" / "codegen-metrics" / "per-file-repairs.json"
    out.write_text(json.dumps(log, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
