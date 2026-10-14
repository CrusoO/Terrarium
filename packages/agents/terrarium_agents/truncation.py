"""When a monolith file is left unclosed, regenerate only that file."""

from __future__ import annotations

from collections.abc import Callable

from terrarium_agents.contract_v2 import file_is_closed

CODE_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".css"}


def unclosed_paths(files: dict[str, str]) -> list[str]:
    return [
        path
        for path, body in files.items()
        if any(path.endswith(suffix) for suffix in CODE_SUFFIXES) and not file_is_closed(body)
    ]


def regenerate_unclosed(files: dict[str, str], regenerate: Callable[[str], str]) -> list[str]:
    """One call per unclosed file. Other files stay as they are."""
    targets = unclosed_paths(files)
    for path in targets:
        files[path] = regenerate(path)
    return targets
