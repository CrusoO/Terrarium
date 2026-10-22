"""Build replay fixtures from saved apps. Does not call Bedrock."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]

from terrarium_agents.fixture_build import build_fixtures, triage_saved  # noqa: E402


def main() -> None:
    built = build_fixtures()
    triage = triage_saved()
    print(json.dumps({"built": built, "triage": triage["counts"]}, indent=2))


if __name__ == "__main__":
    main()
