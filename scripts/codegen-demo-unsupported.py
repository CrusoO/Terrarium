"""One demo-mode session. Reads the token from TEMP. Does not print it."""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx

API = os.environ.get("TERRARIUM_API_BASE", "http://127.0.0.1:3010").rstrip("/")
TOKEN = Path(os.environ.get("TEMP") or ".") / "terrarium-test-token"
OUT = Path("docs/codegen-metrics/demo-unsupported-session.json")


def main() -> None:
    token = TOKEN.read_text(encoding="utf-8").strip()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    created = httpx.post(
        f"{API}/sessions",
        headers=headers,
        json={"prompt": "Build a 3D racing game with a lap timer."},
        timeout=30,
    )
    created.raise_for_status()
    session_id = created.json()["sessionId"]
    events: list[dict] = []
    deadline = time.monotonic() + 90
    with httpx.stream("GET", f"{API}/sessions/{session_id}/events", headers=headers, timeout=None) as response:
        response.raise_for_status()
        buffer = ""
        for chunk in response.iter_text():
            if time.monotonic() > deadline:
                break
            buffer += chunk
            while "\n\n" in buffer:
                raw, buffer = buffer.split("\n\n", 1)
                data = "".join(
                    line.removeprefix("data:").strip() for line in raw.splitlines() if line.startswith("data:")
                )
                if not data:
                    continue
                event = json.loads(data)
                events.append({"name": event.get("name"), "payload": event.get("payload")})
                if event.get("name") in {"sandbox.unhealthy", "preview.ready", "heal.exhausted"}:
                    payload = event.get("payload") or {}
                    if payload.get("terminal") or event.get("name") in {"preview.ready", "heal.exhausted"}:
                        OUT.write_text(
                            json.dumps({"sessionId": session_id, "events": events}, indent=2),
                            encoding="utf-8",
                        )
                        names = [item["name"] for item in events]
                        messages = [
                            (item.get("payload") or {}).get("message")
                            for item in events
                            if isinstance(item.get("payload"), dict)
                        ]
                        print(json.dumps({"names": names, "messages": messages, "previewReady": "preview.ready" in names}))
                        return


if __name__ == "__main__":
    main()
