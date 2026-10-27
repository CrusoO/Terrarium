"""Plan on the fast model, overlapped with copying a Vite skeleton into a sandbox.

Does not change the product pipeline. Target for the plan call is 5 seconds.
Time to first visible UI is when the skeleton preview answers HTTP with the
Orders heading and without a Vite error overlay.
"""

from __future__ import annotations

import json
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "agents"))
sys.path.insert(0, str(ROOT / "packages" / "sandbox"))
sys.path.insert(0, str(ROOT / "packages" / "py-contracts"))
import terrarium_agents.llm  # noqa: E402,F401

from terrarium_agents.llm import fast_model, invoke_bedrock_text  # noqa: E402

OUT = ROOT / "docs" / "codegen-metrics" / "plan-skeleton.json"
SESSION = "spike-skeleton-plan"
SYSTEM = (
    "You are Terrarium's architecture step. Do not write application files yet. "
    "From the requirements, decide architecture, technical approach, module structure, "
    "and the stack selected by the user. React means Vite React files. "
    "Do not add a backend unless backendStack is node-express. "
    "Return JSON only: "
    '{"complexity":"basic"|"complex","stack":"react"|"fullstack",'
    '"architecture":"2-4 sentences","approach":"2-4 sentences",'
    '"structure":["path — role"],"screens":["..."],"data":["..."],'
    '"files":["package.json","index.html","src/main.jsx"],"notes":"one paragraph"}.'
)
USER = (
    "summary: customer order tracker\n"
    "prompt: Build a customer/order tracker. Staff enter customer name, order items, "
    "pickup date, and payment status. Show a searchable list, detail, and daily totals.\n"
    "frontendStack: react\nbackendStack: none\n"
)
SKELETON = {
    "package.json": json.dumps(
        {
            "name": "skeleton",
            "private": True,
            "type": "module",
            "scripts": {"dev": "vite --host 0.0.0.0 --port 5173"},
        }
    ),
    "vite.config.js": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n",
    "index.html": "<!doctype html><html><head><meta charset=\"UTF-8\" /><title>Orders</title></head><body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.jsx\"></script></body></html>\n",
    "src/main.jsx": "import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App.jsx'\ncreateRoot(document.getElementById('root')).render(<App />)\n",
    "src/App.jsx": "export default function App() { return <main><h1>Orders</h1><p>Skeleton preview</p></main> }\n",
}


def _plan(box: dict) -> None:
    started = time.monotonic()
    result = invoke_bedrock_text(SYSTEM, USER, fast_model(), max_tokens=700, temperature=0.2)
    box["planSeconds"] = round(time.monotonic() - started, 3)
    box["plan"] = result


def _skeleton(box: dict) -> None:
    started = time.monotonic()
    try:
        from terrarium_sandbox.runner import SandboxRunner
    except Exception as error:
        box["skeletonError"] = f"import:{type(error).__name__}:{error}"
        box["skeletonSeconds"] = round(time.monotonic() - started, 3)
        return
    try:
        runner = SandboxRunner()
        handle = runner.start(SESSION, SKELETON)
        report = runner.wait_until_healthy(SESSION, timeout_s=40)
        body = ""
        overlay = False
        try:
            import docker

            container = docker.from_env().containers.get(handle.containerId)
            probe = container.exec_run(["wget", "-qO-", "http://127.0.0.1:5173/"])
            body = probe.output.decode("utf-8", errors="replace") if isinstance(probe.output, bytes) else str(probe.output)
            overlay = any(marker in body for marker in ("Pre-transform error", "[plugin:vite:", "Failed to resolve"))
        except Exception as error:
            box["probeError"] = f"{type(error).__name__}: {error}"
        box["previewUrl"] = handle.previewUrl
        box["health"] = report.status
        box["htmlHasOrders"] = "Orders" in body
        box["errorOverlay"] = overlay
        box["visible"] = report.status == "running" and "Orders" in body and not overlay
        box["skeletonSeconds"] = round(time.monotonic() - started, 3)
    except Exception as error:
        box["skeletonError"] = f"{type(error).__name__}: {error}"
        box["skeletonSeconds"] = round(time.monotonic() - started, 3)


def main() -> None:
    box: dict = {}
    started = time.monotonic()
    plan_thread = threading.Thread(target=_plan, args=(box,))
    skeleton_thread = threading.Thread(target=_skeleton, args=(box,))
    plan_thread.start()
    skeleton_thread.start()
    plan_thread.join()
    skeleton_thread.join()
    wall = round(time.monotonic() - started, 3)
    plan = box.get("plan") or {}
    summary = {
        "fastModel": fast_model(),
        "planSeconds": box.get("planSeconds"),
        "planOk": bool(plan.get("ok")),
        "planModel": plan.get("model"),
        "planInputTokens": plan.get("inputTokens"),
        "planOutputTokens": plan.get("outputTokens"),
        "planFailReason": plan.get("failReason"),
        "planTargetSeconds": 5,
        "planMetTarget": bool(box.get("planSeconds") is not None and box["planSeconds"] <= 5),
        "skeletonSeconds": box.get("skeletonSeconds"),
        "timeToFirstVisibleUiSeconds": box.get("skeletonSeconds") if box.get("visible") else None,
        "visible": bool(box.get("visible")),
        "health": box.get("health"),
        "previewUrl": box.get("previewUrl"),
        "htmlHasOrders": box.get("htmlHasOrders"),
        "errorOverlay": box.get("errorOverlay"),
        "overlappedWallSeconds": wall,
        "skeletonError": box.get("skeletonError"),
        "probeError": box.get("probeError"),
    }
    OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
