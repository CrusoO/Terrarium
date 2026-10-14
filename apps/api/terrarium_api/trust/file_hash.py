from __future__ import annotations

import hashlib
import json

from terrarium_contracts import FileMap


def file_map_hash(files: FileMap) -> str:
    payload = json.dumps(files, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
