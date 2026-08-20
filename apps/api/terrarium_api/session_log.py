from __future__ import annotations

import json
from collections.abc import AsyncIterator

from arq.connections import ArqRedis
from terrarium_contracts import SessionEvent

STREAM_PREFIX = "terrarium:session:"
STREAM_SUFFIX = ":events"
FILES_SUFFIX = ":files"
CONV_SUFFIX = ":conversation"
TOOL_SUFFIX = ":toolId"


def stream_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{STREAM_SUFFIX}"


def files_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{FILES_SUFFIX}"


def conversation_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{CONV_SUFFIX}"


def tool_id_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{TOOL_SUFFIX}"


def _as_str(value: object) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return str(value)


class SessionEventLog:
    """Redis Stream-backed log so SSE can replay and resume with Last-Event-ID."""

    def __init__(self, redis: ArqRedis) -> None:
        self.redis = redis

    async def exists(self, session_id: str) -> bool:
        return bool(await self.redis.exists(stream_key(session_id)))

    async def append(self, event: SessionEvent) -> str:
        message_id = await self.redis.xadd(
            stream_key(event.sessionId),
            {"json": event.model_dump_json()},
            maxlen=500,
            approximate=True,
        )
        return _as_str(message_id)

    async def save_files(self, session_id: str, files: dict[str, str]) -> None:
        await self.redis.set(files_key(session_id), json.dumps(files), ex=60 * 60 * 24)

    async def load_files(self, session_id: str) -> dict[str, str] | None:
        raw = await self.redis.get(files_key(session_id))
        if not raw:
            return None
        parsed = json.loads(_as_str(raw))
        if not isinstance(parsed, dict):
            return None
        files = {
            str(path): contents
            for path, contents in parsed.items()
            if isinstance(contents, str)
        }
        return files or None

    async def load_tool_id(self, session_id: str) -> str | None:
        raw = await self.redis.get(tool_id_key(session_id))
        if not raw:
            return None
        tool_id = _as_str(raw).strip()
        return tool_id or None

    async def save_tool_id(self, session_id: str, tool_id: str) -> None:
        await self.redis.set(tool_id_key(session_id), tool_id, ex=60 * 60 * 24)

    async def load_conversation(self, session_id: str) -> list[dict[str, str]]:
        raw = await self.redis.get(conversation_key(session_id))
        if not raw:
            return []
        parsed = json.loads(_as_str(raw))
        return parsed if isinstance(parsed, list) else []

    async def save_conversation(
        self, session_id: str, turns: list[dict[str, str]]
    ) -> None:
        await self.redis.set(
            conversation_key(session_id),
            json.dumps(turns),
            ex=60 * 60 * 24,
        )

    async def iter_events(
        self, session_id: str, last_id: str = "0-0"
    ) -> AsyncIterator[tuple[str, SessionEvent] | None]:
        cursor = last_id or "0-0"
        key = stream_key(session_id)
        while True:
            result = await self.redis.xread({key: cursor}, block=15000, count=20)
            if not result:
                yield None
                continue
            for _stream, messages in result:
                for message_id, fields in messages:
                    cursor = _as_str(message_id)
                    raw = fields.get("json", fields.get(b"json"))
                    yield cursor, SessionEvent.model_validate_json(_as_str(raw))
