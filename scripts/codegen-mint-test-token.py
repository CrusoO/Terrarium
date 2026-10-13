"""Mint TERRARIUM_TEST_TOKEN from the env password. Prints only the length."""

from __future__ import annotations

import json
import os
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _env_file() -> dict[str, str]:
    found: dict[str, str] = {}
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        found[key.strip()] = value.strip().strip('"')
    return found


def main() -> None:
    password = os.environ.get("TERRARIUM_TEST_PASSWORD", "")
    if not password:
        raise SystemExit("TERRARIUM_TEST_PASSWORD is not set")
    email = os.environ.get("TERRARIUM_TEST_EMAIL", "codegen.step0.terrarium@gmail.com")
    key = _env_file()["VITE_FIREBASE_API_KEY"]
    body = json.dumps(
        {
            "email": email,
            "password": password,
            "returnSecureToken": True,
        }
    ).encode()
    request = urllib.request.Request(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={key}",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    payload = json.load(urllib.request.urlopen(request, timeout=30))
    token = str(payload["idToken"])
    out = Path(os.environ.get("TEMP") or os.environ.get("TMP") or "/tmp") / "terrarium-test-token"
    out.write_text(token, encoding="utf-8")
    print(json.dumps({"tokenBytes": len(token), "emailOk": payload.get("email") == email}))


if __name__ == "__main__":
    main()
