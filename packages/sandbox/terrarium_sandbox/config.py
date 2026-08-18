from __future__ import annotations

import os
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
FIXTURE_DIR = PACKAGE_DIR / "fixture"

FIXTURE_IMAGE = os.environ.get("TERRARIUM_FIXTURE_IMAGE", "terrarium-fixture-react:p1-s3")
SANDBOX_NETWORK = os.environ.get("TERRARIUM_SANDBOX_NETWORK", "terrarium-sandbox")
SANDBOX_HOST = os.environ.get("TERRARIUM_SANDBOX_HOST", "sandbox.local")
NANO_CPUS = int(os.environ.get("TERRARIUM_SANDBOX_NANO_CPUS", str(500_000_000)))
MEM_LIMIT = os.environ.get("TERRARIUM_SANDBOX_MEM_LIMIT", "256m")
PIDS_LIMIT = int(os.environ.get("TERRARIUM_SANDBOX_PIDS_LIMIT", "128"))
CONTAINER_PREFIX = "terrarium-sandbox-"
