from __future__ import annotations

import os

from fastapi import APIRouter
from terrarium_contracts import DEV_USER

router = APIRouter()


def _codegen_mode() -> str:
    raw = (os.environ.get("CODEGEN_LLM_MODE") or "replay").strip().lower()
    return raw if raw in {"replay", "record-missing", "live"} else "replay"


@router.get("/health")
async def health() -> dict[str, bool | str]:
    return {
        "ok": True,
        "actor": DEV_USER,
        "codegenMode": _codegen_mode(),
        "demoMode": os.environ.get("DEMO_MODE", "").strip().lower() in {"1", "true", "on", "yes"},
    }
