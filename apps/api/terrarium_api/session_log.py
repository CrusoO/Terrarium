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
INTENT_SUFFIX = ":intent"
GITHUB_SUFFIX = ":github"
GITHUB_SESSION_TOKEN_SUFFIX = ":githubToken"
GITHUB_TOKEN_PREFIX = "terrarium:github:token:"


def stream_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{STREAM_SUFFIX}"


def files_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{FILES_SUFFIX}"


def conversation_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{CONV_SUFFIX}"


def tool_id_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{TOOL_SUFFIX}"


def intent_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{INTENT_SUFFIX}"


def github_repo_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{GITHUB_SUFFIX}"


def github_token_key(user_id: str) -> str:
    return f"{GITHUB_TOKEN_PREFIX}{user_id}"


def github_session_token_key(session_id: str) -> str:
    return f"{STREAM_PREFIX}{session_id}{GITHUB_SESSION_TOKEN_SUFFIX}"


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

    async def save_intent(self, session_id: str, intent: dict[str, object]) -> None:
        await self.redis.set(intent_key(session_id), json.dumps(intent), ex=60 * 60 * 24)

    async def load_intent(self, session_id: str) -> dict[str, object] | None:
        raw = await self.redis.get(intent_key(session_id))
        if raw:
            parsed = json.loads(_as_str(raw))
            if isinstance(parsed, dict):
                return parsed
        messages = await self.redis.xrevrange(stream_key(session_id), count=200)
        for _message_id, fields in messages:
            raw_event = fields.get("json", fields.get(b"json"))
            if not raw_event:
                continue
            try:
                event = SessionEvent.model_validate_json(_as_str(raw_event))
            except Exception:
                continue
            if event.name == "intent.classified" and isinstance(event.payload, dict):
                return event.payload
        return None

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

    async def save_github_token(self, user_id: str, token: str) -> None:
        await self.redis.set(github_token_key(user_id), token, ex=60 * 60 * 8)

    async def load_github_token(self, user_id: str) -> str | None:
        raw = await self.redis.get(github_token_key(user_id))
        if not raw:
            return None
        token = _as_str(raw).strip()
        return token or None

    async def save_github_session_token(self, session_id: str, token: str) -> None:
        await self.redis.set(github_session_token_key(session_id), token, ex=60 * 60 * 24 * 7)

    async def load_github_session_token(self, session_id: str) -> str | None:
        raw = await self.redis.get(github_session_token_key(session_id))
        if not raw:
            return None
        token = _as_str(raw).strip()
        return token or None

    async def resolve_github_token(self, user_id: str, session_id: str = "") -> str | None:
        if session_id:
            session_token = await self.load_github_session_token(session_id)
            if session_token:
                return session_token
        return await self.load_github_token(user_id)

    async def save_github_repo(self, session_id: str, repo: dict[str, str]) -> None:
        await self.redis.set(github_repo_key(session_id), json.dumps(repo), ex=60 * 60 * 24 * 7)

    async def load_github_repo(self, session_id: str) -> dict[str, str] | None:
        raw = await self.redis.get(github_repo_key(session_id))
        if not raw:
            return None
        parsed = json.loads(_as_str(raw))
        if not isinstance(parsed, dict):
            return None
        return {str(key): str(value) for key, value in parsed.items() if value is not None}

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
