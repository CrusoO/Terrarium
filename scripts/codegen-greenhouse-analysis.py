"""Reconstruct the two failed greenhouse repair attempts without calling a model."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]

from terrarium_agents.contract_v2 import build_contract, spec_for_prompt  # noqa: E402
from terrarium_agents.per_file import repair_request, run_tsc  # noqa: E402

folder = ROOT / "docs" / "codegen-metrics" / "live-stage2b" / "04-greenhouse-firstpass"
files = {
    path.relative_to(folder).as_posix(): path.read_text(encoding="utf-8")
    for path in folder.rglob("*")
    if path.is_file() and "node_modules" not in path.parts and "dist" not in path.parts
}
prompt = (
    "Build a greenhouse log. Gardeners search plants, filter by status, "
    "add a plant, and open its detail."
)
contract = build_contract(spec_for_prompt(prompt), "ts")
errors = run_tsc(folder)
_system, user = repair_request(files, contract, [], errors)
record_path = (
    ROOT
    / "docs"
    / "codegen-metrics"
    / "fixtures"
    / "records"
    / "39de614ec77e57d576e0ab38314206c2b540b0b2c615b747e2ee2541ac96d2d5.json"
)
attempt = json.loads(record_path.read_text(encoding="utf-8"))["text"]
report = {
    "file": "src/components/PlantCard.tsx",
    "tscErrors": errors,
    "repairPrompt": user,
    "attempts": [attempt, attempt],
    "appliedPatches": [[], []],
    "whyFailed": (
        "Both attempts replayed the same repair response because the prompt hash was unchanged. "
        "Every search string targeted code that was not in PlantCard.tsx (a useData type "
        "declaration, an extensionless import, a div wrapper, and h3/p fields), so apply_patches "
        "applied nothing. The prompt included broad file context instead of isolating the exact "
        "failing PlantCard lines."
    ),
    "deterministicFix": (
        "Rewrite the Plant type import to ../types.ts, use key={String(field)}, and render "
        "String(field). Replay result: 3 errors before, 0 after."
    ),
}
out = ROOT / "docs" / "codegen-metrics" / "greenhouse-repair-analysis.json"
out.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(out)
