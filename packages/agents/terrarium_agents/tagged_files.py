"""Incremental tagged-file parser for streaming codegen (Step 2).

Format (one block per file):

<<<FILE path="src/App.jsx">>>
...file contents...
<<<END FILE>>>

JSON FileMap remains available when TERRARIUM_CODEGEN_FORMAT=json.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Callable

_OPEN = re.compile(
    r"""<<<FILE\s+path=(?P<q>['"])(?P<path>[^'"]+)(?P=q)\s*>>>""",
    re.I,
)
_CLOSE = re.compile(r"""<<<END\s+FILE>>>""", re.I)

FileCallback = Callable[[str, str], None]


def _clean_body(content: str) -> str:
    """Drop a leaked file marker and one leading newline."""
    content = _OPEN.sub("", content)
    content = _CLOSE.sub("", content)
    if content.startswith("\r\n"):
        return content[2:]
    if content.startswith("\n"):
        return content[1:]
    return content


def stream_file_status(text: str, *, stop_reason: str | None = None, output_tokens: int | None = None, max_tokens: int = 16000) -> dict[str, object]:
    """Describe whether a tagged stream finished its last file or was cut."""
    parser = TaggedFileParser()
    parser.feed(text)
    open_path = parser._open_path
    closed = dict(parser.files)
    stripped = text.rstrip()
    last_closed = open_path is None and bool(re.search(r"<<<END\s+FILE>>>\s*$", stripped))
    hit_cap = stop_reason == "max_tokens" or (
        output_tokens is not None and output_tokens >= max_tokens
    )
    return {
        "stopReason": stop_reason,
        "lastFileClosed": last_closed,
        "fileCut": open_path is not None or (hit_cap and not last_closed),
        "hitOutputCap": hit_cap,
        "closedFiles": len(closed),
        "openPath": open_path,
    }


def codegen_format() -> str:
    raw = (os.environ.get("TERRARIUM_CODEGEN_FORMAT") or "tagged").strip().lower()
    return "json" if raw == "json" else "tagged"


@dataclass
class TaggedFileParser:
    """Feed streamed text; emits completed files via on_file(path, content)."""

    on_file: FileCallback | None = None
    buffer: str = ""
    files: dict[str, str] = field(default_factory=dict)
    _open_path: str | None = None
    _body_parts: list[str] = field(default_factory=list)

    def feed(self, delta: str) -> list[tuple[str, str]]:
        if not delta:
            return []
        self.buffer += delta
        completed: list[tuple[str, str]] = []
        while True:
            if self._open_path is None:
                match = _OPEN.search(self.buffer)
                if not match:
                    # Keep a short tail so a split marker can still match.
                    if len(self.buffer) > 256:
                        self.buffer = self.buffer[-256:]
                    break
                self._open_path = match.group("path").replace("\\", "/").lstrip("/")
                self._body_parts = []
                self.buffer = self.buffer[match.end() :]
                continue
            close = _CLOSE.search(self.buffer)
            leaked = _OPEN.search(self.buffer)
            if leaked and (close is None or leaked.start() < close.start()):
                self._body_parts.append(self.buffer[: leaked.start()])
                self._store_open(completed)
                self.buffer = self.buffer[leaked.start() :]
                continue
            if not close:
                # Hold back possible partial end marker.
                keep = 240
                if len(self.buffer) > keep:
                    self._body_parts.append(self.buffer[:-keep])
                    self.buffer = self.buffer[-keep:]
                break
            self._body_parts.append(self.buffer[: close.start()])
            self._store_open(completed)
            self.buffer = self.buffer[close.end() :]
        return completed

    def _store_open(self, completed: list[tuple[str, str]]) -> None:
        content = _clean_body("".join(self._body_parts))
        path = self._open_path or ""
        self.files[path] = content
        completed.append((path, content))
        if self.on_file:
            self.on_file(path, content)
        self._open_path = None
        self._body_parts = []

    def finish(self) -> dict[str, str]:
        """Flush any remaining open body (best-effort) and return all files."""
        if self._open_path is not None:
            content = _clean_body("".join(self._body_parts) + self.buffer)
            self.files[self._open_path] = content
            if self.on_file:
                self.on_file(self._open_path, content)
            self._open_path = None
            self._body_parts = []
            self.buffer = ""
        return dict(self.files)

    def drop_open(self) -> None:
        """Discard an unclosed tail so a continuation starts clean."""
        self._open_path = None
        self._body_parts = []
        self.buffer = ""


def closed_file_prefix(text: str) -> tuple[str, list[str]]:
    """Return text through the last closed file marker, and those paths."""
    parser = TaggedFileParser()
    parser.feed(text)
    matches = list(re.finditer(r"<<<END\s+FILE>>>", text, re.I))
    if not matches:
        return "", []
    return text[: matches[-1].end()], list(parser.files)
