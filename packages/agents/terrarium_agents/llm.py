"""Shared LLM wiring. Keys stay in env — never in prompts or source."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

AgentsMode = Literal["stub", "live"]

DEFAULT_INTENT_MODEL = "gemini-3.1-flash-lite"


def _load_dotenv() -> None:
    here = Path(__file__).resolve()
    candidates = [
        Path.cwd() / ".env",
        here.parents[3] / ".env",  # repo root from packages/agents/terrarium_agents
    ]
    for path in candidates:
        if path.is_file():
            load_dotenv(path, override=False)
            return
    load_dotenv(override=False)


def _configure_tls() -> None:
    """Use the Windows/macOS trust store so Gemini HTTPS works behind corp proxies."""
    try:
        import truststore

        truststore.inject_into_ssl()
        return
    except Exception:
        pass
    try:
        import certifi

        os.environ.setdefault("SSL_CERT_FILE", certifi.where())
        os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
        os.environ.setdefault("CURL_CA_BUNDLE", certifi.where())
    except Exception:
        pass


_load_dotenv()
_configure_tls()


def gemini_api_key() -> str | None:
    key = (
        os.environ.get("GOOGLE_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_GENAI_API_KEY")
        or ""
    ).strip()
    return key or None


def agents_mode() -> AgentsMode:
    explicit = os.environ.get("TERRARIUM_AGENTS", "").strip().lower()
    if explicit in {"stub", "live"}:
        return explicit  # type: ignore[return-value]
    return "live" if gemini_api_key() else "stub"


def intent_model() -> str:
    return os.environ.get("TERRARIUM_MODEL_INTENT", DEFAULT_INTENT_MODEL).strip() or DEFAULT_INTENT_MODEL


@lru_cache(maxsize=1)
def gemini_client():
    from google import genai

    key = gemini_api_key()
    if not key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing. Set it in .env or export it, "
            "or set TERRARIUM_AGENTS=stub."
        )
    return genai.Client(api_key=key)

