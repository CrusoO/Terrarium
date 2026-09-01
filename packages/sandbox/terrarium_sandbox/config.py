from __future__ import annotations

import os
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
FIXTURE_DIR = PACKAGE_DIR / "fixture"

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


def fixture_image() -> str:
    return os.environ.get("TERRARIUM_FIXTURE_IMAGE", "terrarium-fixture-react:p1-s3")


def sandbox_network() -> str:
    return os.environ.get("TERRARIUM_SANDBOX_NETWORK", "terrarium-sandbox")


def sandbox_host() -> str:
    """Windows cannot resolve *.sandbox.local. Host-mode URLs use nip.io."""
    return os.environ.get("TERRARIUM_SANDBOX_HOST", "127.0.0.1.nip.io")


def preview_mode() -> str:
    """path = same-origin /preview/{slug}/ (survives Zscaler). host = Traefik subdomain."""
    value = os.environ.get("TERRARIUM_PREVIEW_MODE", "path").strip().lower()
    return value if value in {"path", "host"} else "path"


def nano_cpus() -> int:
    return int(os.environ.get("TERRARIUM_SANDBOX_NANO_CPUS", str(500_000_000)))


def mem_limit() -> str:
    return os.environ.get("TERRARIUM_SANDBOX_MEM_LIMIT", "256m")


def pids_limit() -> int:
    return int(os.environ.get("TERRARIUM_SANDBOX_PIDS_LIMIT", "128"))


CONTAINER_PREFIX = "terrarium-sandbox-"

# Import-time aliases so existing callers keep working after dotenv load.
FIXTURE_IMAGE = fixture_image()
SANDBOX_NETWORK = sandbox_network()
SANDBOX_HOST = sandbox_host()
PREVIEW_MODE = preview_mode()
NANO_CPUS = nano_cpus()
MEM_LIMIT = mem_limit()
PIDS_LIMIT = pids_limit()

