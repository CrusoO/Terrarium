"""Slots that stay off until the per-file preview gate is met.

Diffusion, the Bedrock Priority tier, and a speculative sandbox boot are parked
until a measured validated-preview rate is at least 90%. Setting the env vars
does not enable them.
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

GATE = "validated preview rate >= 90%"

PARKED = {
    "diffusion": "TERRARIUM_ENABLE_DIFFUSION",
    "priority": "TERRARIUM_RUN_PRIORITY_AB",
    "speculative_sandbox": "TERRARIUM_SPECULATIVE_SANDBOX",
}


def parked_reason(slot: str) -> str:
    return f"{slot} is parked until {GATE}. It stays disabled."


def note_parked() -> list[str]:
    """Clear parked env flags so a later reader cannot turn the slots on."""
    notes: list[str] = []
    for slot, env_name in PARKED.items():
        if os.environ.get(env_name) == "1":
            os.environ[env_name] = "0"
            message = parked_reason(slot)
            logger.warning(message)
            notes.append(message)
    return notes
