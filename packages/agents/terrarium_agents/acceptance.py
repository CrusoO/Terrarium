from __future__ import annotations

import hashlib
import json
import re

from terrarium_contracts import AcceptanceCheck, FileMap


def _playwright_script_template(checks_body: str) -> str:
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


def propose_acceptance_checks(summary: str, *, kind: str) -> list[AcceptanceCheck]:
    """Deterministic checks when LLM is unavailable."""
    base = summary.strip() or "the app"
    checks = [
        AcceptanceCheck(
            id="load-home",
            description=f"The home screen for {base} loads without errors",
        ),
        AcceptanceCheck(
            id="primary-action",
            description="The primary button or form action updates visible output",
        ),
    ]
    if kind == "modify":
        checks.append(
            AcceptanceCheck(
                id="regression-visible",
                description="Existing content from the previous version is still visible",
            )
        )
    return checks[:5]


def translate_checks(checks: list[AcceptanceCheck], files: FileMap) -> str:
    """Compile acceptance checks into a Playwright script body."""
    lines: list[str] = []
    for check in checks:
        desc = check.description.replace('"', "'")
        selector_hint = _guess_selector(check, files)
        lines.append(
            f"""
    // {desc}
    {{
      const checkId = {json.dumps(check.id)};
      try {{
        {selector_hint}
        emit({{ checkId, status: "passed", durationMs: Date.now() - started }});
      }} catch (error) {{
        emit({{ checkId, status: "failed", error: String(error.message), durationMs: Date.now() - started }});
      }}
    }}
"""
        )
    return _playwright_script_template("\n".join(lines))


def checks_cache_key(checks: list[AcceptanceCheck], file_map_hash: str) -> str:
    payload = file_map_hash + "|" + "|".join(sorted(c.id for c in checks))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]


def _guess_selector(check: AcceptanceCheck, files: FileMap) -> str:
    blob = " ".join(files.values()).lower()
    if "broken" in check.description.lower() or "data-broken" in blob:
        return (
            'const btn = page.locator("[data-broken], button").first(); '
            "await btn.click(); "
            'await page.waitForTimeout(200); '
            'if (!(await page.locator("body").innerText()).includes("999")) '
            'throw new Error("Button did not update total");'
        )
    if "expense" in check.description.lower() or "total" in check.description.lower():
        return (
            'await page.getByRole("button", { name: /add|expense/i }).first().click({ timeout: 5000 }); '
            'const text = await page.locator("body").innerText(); '
            'if (!/total|sum/i.test(text)) throw new Error("Total not visible");'
        )
    return (
        'await page.waitForLoadState("domcontentloaded"); '
        'const body = await page.locator("body").innerText(); '
        'if (!body.trim()) throw new Error("Empty page");'
    )
