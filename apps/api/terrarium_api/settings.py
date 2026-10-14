from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

from arq.connections import RedisSettings
from dotenv import load_dotenv


def _load_dotenv() -> None:
    here = Path(__file__).resolve()
    candidates = [
        Path.cwd() / ".env",
        here.parents[3] / ".env",  # Terrarium/.env from apps/api/terrarium_api
    ]
    for path in candidates:
        if path.is_file():
            load_dotenv(path, override=False)
            return
    load_dotenv(override=False)


_load_dotenv()

REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6380"))
POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "127.0.0.1")
POSTGRES_PORT = int(os.environ.get("POSTGRES_PORT", "5433"))
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

# P6-S1 auth — Firebase ID tokens. Cookie is only for EventSource (no custom headers).
AUTH_COOKIE = "terrarium_token"
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "terrariumauth")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "").strip()
GITHUB_OAUTH_REDIRECT = os.environ.get(
    "GITHUB_OAUTH_REDIRECT", "http://127.0.0.1:3001/github/callback"
).strip()
GITHUB_UI_ORIGIN = os.environ.get("GITHUB_UI_ORIGIN", "http://localhost:5173").strip()


def _certifi_path() -> str | None:
    try:
        import certifi

        p = certifi.where()
        return p if Path(p).is_file() else None
    except ImportError:
        return None


def _merged_ca_bundle(extra_pem: Path) -> str:
    """Mozilla CA bundle plus corporate/Zscaler root (needed when TLS is still MITM'd)."""
    cache_raw = (os.environ.get("TERRARIUM_CA_BUNDLE_CACHE") or "").strip()
    cache = Path(cache_raw) if cache_raw else Path("/tmp/terrarium-ca-bundle.pem")
    parts: list[str] = []
    base = _certifi_path()
    if base:
        parts.append(Path(base).read_text(encoding="ascii"))
    parts.append(extra_pem.read_text(encoding="ascii"))
    cache.write_text("\n".join(parts) + "\n", encoding="ascii")
    return str(cache)


def ssl_verify() -> bool | str:
    """Trust store for httpx: certifi, optional corp CA merge, or explicit bundle paths."""
    for key in ("TERRARIUM_SSL_CA_FILE", "TERRARIUM_EXTRA_CA_FILE"):
        path = (os.environ.get(key) or "").strip()
        if path and Path(path).is_file():
            extra = Path(path)
            if key == "TERRARIUM_EXTRA_CA_FILE" or _certifi_path():
                return _merged_ca_bundle(extra)
            return path
    for key in ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE"):
        path = (os.environ.get(key) or "").strip()
        if path and Path(path).is_file():
            return path
    base = _certifi_path()
    return base if base else True

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
