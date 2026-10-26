"""Drive one Brownie build end to end inside the worker container (live models, real Redis, Postgres, sandbox).

Usage: python apps/api/scripts/brownie_e2e.py
Publishes the three fictional projects for a test owner, then runs: request -> answers -> Brownie review -> reuse.
"""

from __future__ import annotations

import asyncio
import json
import sys
import time
from uuid import uuid4

from arq import create_pool

from terrarium_api import worker
from terrarium_api.brownie_catalog import sync_projects
from terrarium_api.db import SessionLocal, init_db
from terrarium_api.session_log import SessionEventLog
from terrarium_api.settings import redis_settings

OWNER = {"id": "e2e-brownie", "email": "e2e-brownie@example.test"}
PROMPT = (
    "Build an SAP purchase requisition workspace in React. Requesters sign in and raise requisitions, "
    "approvers approve or reject them, there is a requisition status dashboard and approval notifications."
)
ANSWERS = "React. Yes — keep shared data on a server. Requesters and approvers. Just build it."
REUSE = ["pm-auth-context", "pm-role-guard", "pm-dashboard-shell", "commerce-notification-service"]

KEYS = ("phase", "message", "logs", "backendStack", "frontendStack", "appliedAssetIds", "ignored", "previewUrl")
CAPTURED: list = []
_append = SessionEventLog.append


async def _capture(self, event):
    CAPTURED.append(event)
    return await _append(self, event)


SessionEventLog.append = _capture  # type: ignore[method-assign]


async def turn(redis, log: SessionEventLog, sid: str, prompt: str, asset_ids: list[str] | None = None) -> list:
    before = len(CAPTURED)
    started = time.monotonic()
    await worker._run_stub_session_locked(redis, sid, prompt, brownie_asset_ids=asset_ids)
    events = CAPTURED
    print(f"--- turn done in {time.monotonic() - started:.0f}s", flush=True)
    for event in events[before:]:
        payload = event.payload or {}
        brief = {key: payload[key] for key in KEYS if key in payload}
        if event.name == "brownie.applied":
            brief["provenance"] = [
                (p["name"], p["toolName"], p["toolVersion"], [(f["source"], f["target"]) for f in p["files"]])
                for p in payload.get("provenance", [])
            ]
        print(event.name, json.dumps(brief, ensure_ascii=False)[:600])
    return events[before:]


async def main() -> int:
    init_db()
    with SessionLocal() as db:
        sync_projects(db, OWNER)
    redis = await create_pool(redis_settings())
    log = SessionEventLog(redis)
    sid = uuid4().hex
    print("session", sid)
    await log.save_actor_id(sid, OWNER["id"])
    await log.save_actor_email(sid, OWNER["email"])
    await turn(redis, log, sid, PROMPT)
    events = await turn(redis, log, sid, ANSWERS)
    if not any(event.name == "brownie.review" for event in events):
        print("no brownie.review; stopping")
        return 1
    final = await turn(redis, log, sid, "Continue the build with the selected Brownie assets.", REUSE)
    files = await log.load_files(sid) or {}
    reused = sorted(path for path in files if "/reused/" in path)
    print("files", len(files), "reused", reused)
    print("backend files", sorted(path for path in files if path.startswith("backend/"))[:12])
    return 0 if any(event.name == "preview.ready" for event in final) else 2


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
