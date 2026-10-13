"""Classify why recent codegen sessions never reached a healthy preview.

Loads FileMaps from Redis, re-runs the pre-boot scan, and optionally boots a
known-good Vite template through SandboxRunner.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "sandbox"))
sys.path.insert(0, str(ROOT / "packages" / "py-contracts"))
sys.path.insert(0, str(ROOT / "apps" / "api"))

import redis  # noqa: E402

from terrarium_sandbox.runner import SandboxRunner  # noqa: E402
from terrarium_sandbox.trust.scanners import preboot_blocks_boot, scan  # noqa: E402

SESSIONS = [
    "16905fa5b32f403187e9930e719b8ede",
    "af2015a93ddf4a78a19ba19a30d8e5f9",
    "fd0f6906ca8f4f3fa09b825352ed1903",
]

KNOWN_GOOD = {
    "package.json": json.dumps(
        {
            "name": "known-good",
            "private": True,
            "scripts": {"dev": "vite"},
            "dependencies": {"react": "^19.0.0", "react-dom": "^19.0.0"},
            "devDependencies": {"vite": "^6.0.0", "@vitejs/plugin-react": "^4.3.0"},
        }
    ),
    "index.html": (
        "<!doctype html><html><head><meta charset='utf-8'><title>ok</title></head>"
        "<body><div id='root'></div><script type='module' src='/src/main.jsx'></script></body></html>"
    ),
    "src/main.jsx": (
        "import React from 'react';\n"
        "import { createRoot } from 'react-dom/client';\n"
        "import App from './App.jsx';\n"
        "createRoot(document.getElementById('root')).render(<App />);\n"
    ),
    "src/App.jsx": "export default function App(){ return <h1>known good</h1>; }\n",
    "vite.config.js": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n",
}


def _redis() -> redis.Redis:
    return redis.Redis(
        host=os.environ.get("REDIS_HOST", "127.0.0.1"),
        port=int(os.environ.get("REDIS_PORT", "6380")),
        decode_responses=True,
    )


def _classify(findings: list, secrets: int, blocked: bool) -> str:
    if not blocked:
        return "not-blocked-by-preboot"
    titles = [f"{item.source}:{item.severity}:{item.title}:{getattr(item, 'file', '')}" for item in findings]
    if secrets:
        return "generated-code:secret-or-gitleaks"
    high = [t for t in titles if ":high:" in t or ":critical:" in t]
    if high:
        return "generated-code:preboot-high-finding"
    return "generated-code:preboot-other"


def main() -> None:
    boot = os.environ.get("BOOT_KNOWN_GOOD", "1") == "1"
    client = _redis()
    rows = []
    for session_id in SESSIONS:
        raw = client.get(f"terrarium:session:{session_id}:files")
        if not raw:
            rows.append({"sessionId": session_id, "cause": "no-filemap-in-redis", "sandboxBooted": False})
            continue
        files = json.loads(raw)
        findings, secrets, code_issues = scan(files, tool_id=session_id, version_id=session_id)
        blocked = preboot_blocks_boot(findings, secrets)
        rows.append(
            {
                "sessionId": session_id,
                "fileCount": len(files),
                "secrets": secrets,
                "codeIssues": code_issues,
                "blocked": blocked,
                "cause": _classify(findings, secrets, blocked),
                "sandboxBooted": False,
                "findings": [
                    {
                        "source": item.source,
                        "severity": item.severity,
                        "title": item.title,
                        "file": item.file,
                        "rule": item.rule,
                    }
                    for item in findings
                ],
            }
        )

    if boot:
        for row in rows:
            if row.get("blocked") is False and row.get("sessionId"):
                raw = client.get(f"terrarium:session:{row['sessionId']}:files")
                files = json.loads(raw)
                runner = SandboxRunner()
                handle = runner.start(row["sessionId"] + "-recheck", files=files)
                report = runner.wait_until_healthy(row["sessionId"] + "-recheck", timeout_s=45)
                row["sandboxBooted"] = report.status == "running"
                row["health"] = report.status
                row["previewUrl"] = handle.previewUrl
                row["logsExcerpt"] = (report.logs or "")[-1200:]
                row["port"] = handle.previewUrl
                runner.stop(row["sessionId"] + "-recheck")
                break
    known = {"label": "known-good-template", "sandboxBooted": False}
    if boot:
        findings, secrets, _ = scan(KNOWN_GOOD, tool_id="known-good", version_id="known-good")
        blocked = preboot_blocks_boot(findings, secrets)
        known["prebootBlocked"] = blocked
        if not blocked:
            runner = SandboxRunner()
            handle = runner.start("known-good-step4", files=KNOWN_GOOD)
            report = runner.wait_until_healthy("known-good-step4", timeout_s=40)
            known.update(
                {
                    "sandboxBooted": report.status == "running",
                    "health": report.status,
                    "previewUrl": handle.previewUrl,
                    "containerId": handle.containerId,
                    "logsExcerpt": (report.logs or "")[-1500:],
                    "cause": "infrastructure-ok" if report.status == "running" else "infrastructure:sandbox-health",
                }
            )
            runner.stop("known-good-step4")
        else:
            known["cause"] = "known-good-blocked-by-preboot"
    rows.append(known)
    out = {"rows": rows}
    path = Path(os.environ.get("PREVIEW_DIAG_OUT", "docs/codegen-metrics/preview-diagnosis.json"))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
