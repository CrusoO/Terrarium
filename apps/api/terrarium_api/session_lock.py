from __future__ import annotations

from uuid import uuid4

SESSION_LOCK_TTL_S = 600


def session_lock_key(session_id: str) -> str:
    return f"terrarium:session:{session_id}:build-lock"


async def acquire_session_lock(redis: object, session_id: str) -> str | None:
    token = uuid4().hex
    acquired = await redis.set(  # type: ignore[attr-defined]
        session_lock_key(session_id),
        token,
        ex=SESSION_LOCK_TTL_S,
        nx=True,
    )
    return token if acquired else None


async def session_is_locked(redis: object, session_id: str) -> bool:
    return bool(await redis.exists(session_lock_key(session_id)))  # type: ignore[attr-defined]


async def release_session_lock(redis: object, session_id: str, token: str) -> None:
    script = """
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    end
    return 0
    """
    await redis.eval(script, 1, session_lock_key(session_id), token)  # type: ignore[attr-defined]
