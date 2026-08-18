from __future__ import annotations

import os

from arq.connections import RedisSettings

REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))


def redis_settings() -> RedisSettings:
    return RedisSettings(host=REDIS_HOST, port=REDIS_PORT)
