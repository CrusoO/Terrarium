from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone

import docker

from terrarium_contracts import AcceptanceCheckResult

from terrarium_sandbox import config

_CHECK_TIMEOUT_MS = 30_000


def run_checks(
    preview_url: str,
    script: str,
    *,
    check_ids: list[str],
) -> list[AcceptanceCheckResult]:
    """Run a Playwright script in a pinned container on the sandbox network."""
    if os.environ.get("TERRARIUM_TRUST_OFFLINE") == "1":
        return _offline_stub(check_ids, script)

    client = docker.from_env()
    env = {
        "TARGET_URL": preview_url,
        "CHECK_TIMEOUT_MS": str(_CHECK_TIMEOUT_MS),
        "TERRARIUM_CHECK_IDS": json.dumps(check_ids),
    }
    container = client.containers.run(
        config.smoke_image(),
        command=["node", "-e", script],
        network=config.sandbox_network(),
        environment=env,
        detach=True,
        mem_limit=config.smoke_mem_limit(),
        pids_limit=config.smoke_pids_limit(),
        security_opt=["no-new-privileges:true"],
    )
    started = time.monotonic()
    try:
        result = container.wait(timeout=int(_CHECK_TIMEOUT_MS / 1000) + 15)
        logs = container.logs().decode("utf-8", errors="replace")
        exit_code = result.get("StatusCode", 1)
        return _parse_check_logs(logs, check_ids, exit_code, started)
    finally:
        container.remove(force=True)


def _offline_stub(check_ids: list[str], script: str) -> list[AcceptanceCheckResult]:
    broken = "TERRARIUM_BROKEN_BUTTON" in script or "data-broken" in script
    results: list[AcceptanceCheckResult] = []
    for cid in check_ids:
        if broken:
            results.append(
                AcceptanceCheckResult(
                    checkId=cid,
                    status="failed",
                    error="Button did not update total",
                    durationMs=100,
                )
            )
        else:
            results.append(
                AcceptanceCheckResult(checkId=cid, status="passed", durationMs=100)
            )
    return results


def _parse_check_logs(
    logs: str,
    check_ids: list[str],
    exit_code: int,
    started: float,
) -> list[AcceptanceCheckResult]:
    duration = int((time.monotonic() - started) * 1000)
    parsed: dict[str, AcceptanceCheckResult] = {}
    for line in logs.splitlines():
        if not line.startswith("TERRARIUM_CHECK_RESULT "):
            continue
        try:
            payload = json.loads(line.split(" ", 1)[1])
            cid = str(payload.get("checkId", ""))
            parsed[cid] = AcceptanceCheckResult(
                checkId=cid,
                status=payload.get("status", "failed"),  # type: ignore[arg-type]
                screenshotUrl=payload.get("screenshotUrl"),
                error=payload.get("error"),
                durationMs=int(payload.get("durationMs") or duration),
            )
        except (json.JSONDecodeError, ValueError):
            continue

    results: list[AcceptanceCheckResult] = []
    for cid in check_ids:
        if cid in parsed:
            results.append(parsed[cid])
        else:
            results.append(
                AcceptanceCheckResult(
                    checkId=cid,
                    status="passed" if exit_code == 0 else "failed",
                    error=None if exit_code == 0 else "Check did not report a result",
                    durationMs=duration,
                )
            )
    return results


def playwright_script_template(checks_body: str) -> str:
    return f"""
const {{ chromium }} = require("playwright");
const targetUrl = process.env.TARGET_URL;
const timeoutMs = Number(process.env.CHECK_TIMEOUT_MS || "30000");
const checkIds = JSON.parse(process.env.TERRARIUM_CHECK_IDS || "[]");

function emit(result) {{
  console.log("TERRARIUM_CHECK_RESULT " + JSON.stringify(result));
}}

(async () => {{
  const browser = await chromium.launch({{ headless: true, args: ["--no-sandbox"] }});
  const page = await browser.newPage();
  await page.goto(targetUrl, {{ waitUntil: "domcontentloaded", timeout: timeoutMs }});
  const started = Date.now();
  try {{
{checks_body}
  }} catch (error) {{
    for (const checkId of checkIds) {{
      emit({{ checkId, status: "failed", error: String(error.message), durationMs: Date.now() - started }});
    }}
  }} finally {{
    await browser.close();
  }}
}})();
"""
