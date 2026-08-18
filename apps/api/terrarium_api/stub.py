from __future__ import annotations

from terrarium_contracts import FileMap


def echo_filemap(prompt: str) -> FileMap:
    """Deterministic stub FileMap. Never executed on the API host."""
    return {
        "README.md": "Terrarium echo stub. No LLM.\n",
        "prompt.txt": prompt,
    }
