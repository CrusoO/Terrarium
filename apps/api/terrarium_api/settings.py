from __future__ import annotations

import os
import secrets
from urllib.parse import urlparse

from arq.connections import RedisSettings
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "127.0.0.1")
POSTGRES_PORT = int(os.environ.get("POSTGRES_PORT", "5432"))
POSTGRES_USER = os.environ.get("POSTGRES_USER", "terrarium")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "terrarium")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "terrarium")


def _database_url() -> str:
    raw = os.environ.get("DATABASE_URL")
    if not raw:
        return (
            f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
            f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
        )
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    if raw.startswith("postgresql://"):
        raw = "postgresql+psycopg://" + raw[len("postgresql://") :]
    return raw


DATABASE_URL = _database_url()

# P6-S1 auth
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = int(os.environ.get("JWT_EXPIRE_DAYS", "7"))
AUTH_COOKIE = "terrarium_token"
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "terrariumauth")

IDLE_TIMEOUT_SECONDS = int(
    os.environ.get(
        "TERRARIUM_IDLE_TIMEOUT_SECONDS",
        os.environ.get("IDLE_TIMEOUT_SECONDS", str(30 * 60)),
    )
)


def redis_settings() -> RedisSettings:
    raw = os.environ.get("REDIS_URL")
    if not raw:
        return RedisSettings(host=REDIS_HOST, port=REDIS_PORT)
    parsed = urlparse(raw)
    database = parsed.path.lstrip("/") or "0"
    return RedisSettings(
        host=parsed.hostname or REDIS_HOST,
        port=parsed.port or REDIS_PORT,
        database=int(database),
        username=parsed.username or None,
        password=parsed.password,
    )
