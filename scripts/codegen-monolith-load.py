"""Vite-load each monolith holdout app and record success and time."""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "codegen-metrics" / "monolith-holdout"
OUT = ROOT / "docs" / "codegen-metrics" / "monolith-holdout-load.json"
IMAGE = "terrarium-node-sandbox:p1-s3"


def main() -> None:
    rows = []
    for folder in sorted(path for path in SRC.iterdir() if (path / "package.json").exists()):
        started = time.monotonic()
        proc = subprocess.run(
            ["docker", "run", "--rm", "-v", f"{folder}:/work", "-w", "/work", IMAGE, "sh", "-lc",
             "ln -sfn /opt/terrarium/node_modules /work/node_modules && npm run build"],
            capture_output=True, text=True, check=False,
        )
        subprocess.run(["docker", "run", "--rm", "-v", f"{folder}:/work", IMAGE, "rm", "-f", "/work/node_modules"], check=False)
        log = (proc.stdout or "") + (proc.stderr or "")
        row = {
            "slug": folder.name,
            "loadOk": proc.returncode == 0 and "error during build" not in log.lower(),
            "seconds": round(time.monotonic() - started, 3),
            "tail": "\n".join(log.splitlines()[-4:]),
        }
        rows.append(row)
        print(json.dumps({key: row[key] for key in ("slug", "loadOk", "seconds")}), flush=True)
    ok = sum(1 for row in rows if row["loadOk"])
    payload = {"apps": len(rows), "loadOk": ok, "rows": rows}
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(OUT), "loadOk": ok, "apps": len(rows)}), flush=True)


if __name__ == "__main__":
    main()
