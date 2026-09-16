from __future__ import annotations

import unittest

from terrarium_api.session_lock import (
    acquire_session_lock,
    release_session_lock,
    session_is_locked,
    session_lock_key,
)


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}

    async def set(
        self,
        key: str,
        value: str,
        *,
        ex: int | None = None,
        nx: bool = False,
    ) -> bool:
        _ = ex
        if nx and key in self.values:
            return False
        self.values[key] = value
        return True

    async def exists(self, key: str) -> int:
        return int(key in self.values)

    async def eval(self, _script: str, _keys: int, key: str, token: str) -> int:
        if self.values.get(key) != token:
            return 0
        del self.values[key]
        return 1


class SessionLockTests(unittest.IsolatedAsyncioTestCase):
    async def test_lock_acquire_rejects_duplicate_and_releases_by_token(self) -> None:
        redis = FakeRedis()
        token = await acquire_session_lock(redis, "s1")

        self.assertIsNotNone(token)
        self.assertTrue(await session_is_locked(redis, "s1"))
        self.assertIsNone(await acquire_session_lock(redis, "s1"))

        await release_session_lock(redis, "s1", "wrong-token")
        self.assertIn(session_lock_key("s1"), redis.values)

        await release_session_lock(redis, "s1", token or "")
        self.assertFalse(await session_is_locked(redis, "s1"))


if __name__ == "__main__":
    unittest.main()
