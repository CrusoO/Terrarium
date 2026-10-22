from __future__ import annotations

import hashlib


def stable_finding_id(
    source: str,
    *,
    package_name: str | None = None,
    rule: str | None = None,
    file: str | None = None,
) -> str:
    key = source + (package_name or rule or "") + (file or "")
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
