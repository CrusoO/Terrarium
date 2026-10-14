"""Check that a follow-up edit landed in code, not only in CSS."""

from __future__ import annotations

import re

_CODE_SUFFIXES = (".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs")
_STYLE_SUFFIXES = (".css", ".scss", ".sass")


def edit_matches_request(prompt: str, changed_files: dict[str, str]) -> dict[str, object]:
    """Return whether `changed_files` actually implements `prompt`.

    A status-filter request must show up in JSX or component state. A CSS-only
    diff does not count.
    """
    code = {
        path: content
        for path, content in changed_files.items()
        if path.lower().endswith(_CODE_SUFFIXES)
    }
    styles = [path for path in changed_files if path.lower().endswith(_STYLE_SUFFIXES)]
    css_only = bool(changed_files) and not code
    prompt_l = prompt.lower()
    wants_status_filter = "status" in prompt_l and "filter" in prompt_l

    if wants_status_filter:
        evidence: list[str] = []
        for path, content in code.items():
            if _has_status_filter(content):
                evidence.append(path)
        ok = bool(evidence)
        if ok:
            reason = "Status filter is present in JSX or component state."
        elif css_only:
            reason = "Only styles changed. The status filter is not in JSX or state."
        else:
            reason = "Changed code files do not contain a status filter control or state."
        return {
            "ok": ok,
            "reason": reason,
            "cssOnly": css_only,
            "evidenceFiles": evidence,
            "styleFiles": styles,
        }

    ok = bool(code)
    return {
        "ok": ok,
        "reason": "Code files changed." if ok else "No code files changed.",
        "cssOnly": css_only,
        "evidenceFiles": sorted(code),
        "styleFiles": styles,
    }


def _has_status_filter(content: str) -> bool:
    lower = content.lower()
    if "status" not in lower or "filter" not in lower:
        return False
    has_control = any(
        token in lower
        for token in ("<select", "<button", "<option", "onclick", "onchange", "role=\"tab\"")
    )
    has_state = bool(
        re.search(
            r"useState|statusFilter|filterStatus|setFilter|filter\s*[:=]",
            content,
        )
    )
    return has_control or has_state
