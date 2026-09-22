"""
Smart Match Agent — P5-S2

Searches the tool library index for exact matches using deterministic fingerprints
before Code Generator runs. Emits smartmatch.hit or smartmatch.miss.
"""
from __future__ import annotations

import hashlib
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from terrarium_contracts import Stack

logger = logging.getLogger(__name__)


def compute_prompt_fingerprint(prompt: str, stack: Stack) -> str:
    """
    P5-S1: Deterministic SHA-256 fingerprint for exact matching.
    
    Implementation choice: Simple fingerprint over embeddings for:
    - Deterministic results (same prompt → same hash)
    - Fast lookups (indexed string comparison)
    - No external dependencies (no embedding models)
    - Exact matching only (no fuzzy semantic search)
    
    Args:
        prompt: User's normalized prompt text
        stack: Target stack ('react' or 'fullstack')
    
    Returns:
        64-character hex digest of SHA-256(normalized_prompt + stack)
    """
    # Normalize: lowercase, strip whitespace, collapse multiple spaces
    normalized = " ".join(prompt.lower().strip().split())
    # Combine with stack for unique fingerprint per stack
    combined = f"{normalized}|{stack}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def prompts_match(prompt1: str, stack1: Stack, prompt2: str, stack2: Stack) -> bool:
    """
    Check if two prompts are exact matches using fingerprints.
    
    Returns:
        True if both prompts produce the same fingerprint
    """
    return compute_prompt_fingerprint(prompt1, stack1) == compute_prompt_fingerprint(prompt2, stack2)
