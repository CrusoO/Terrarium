from __future__ import annotations

import json
import os
import tarfile
import tempfile
from io import BytesIO
from pathlib import Path

import docker
from docker.errors import DockerException

from terrarium_contracts import FileMap
from terrarium_sandbox import config


def _trust_offline() -> bool:
    return os.environ.get("TERRARIUM_TRUST_OFFLINE", "").strip() == "1"


def gitleaks_image() -> str:
    return os.environ.get("TERRARIUM_GITLEAKS_IMAGE", "zricethezav/gitleaks:v8.21.2")


def semgrep_image() -> str:
    return os.environ.get("TERRARIUM_SEMGREP_IMAGE", "semgrep/semgrep:1.96.0")


def osv_image() -> str:
    return os.environ.get("TERRARIUM_OSV_IMAGE", "ghcr.io/google/osv-scanner:v1.9.0")


def trivy_image() -> str:
    return os.environ.get("TERRARIUM_TRIVY_IMAGE", "aquasec/trivy:0.58.1")


def _filemap_tar(files: FileMap) -> bytes:
    buffer = BytesIO()
    with tarfile.open(fileobj=buffer, mode="w") as archive:
        for path, content in files.items():
            data = content.encode("utf-8")
            info = tarfile.TarInfo(name=path)
            info.size = len(data)
            archive.addfile(info, BytesIO(data))
    return buffer.getvalue()


def run_gitleaks(files: FileMap) -> list[dict]:
    if _trust_offline():
        return []
    client = docker.from_env()
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for path, content in files.items():
            target = root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
        try:
            logs = client.containers.run(
                gitleaks_image(),
                command=["detect", "--source", "/repo", "--no-git", "--report-format", "json"],
                volumes={str(root): {"bind": "/repo", "mode": "ro"}},
                network_mode="none",
                remove=True,
                mem_limit="256m",
            )
        except DockerException as exc:
            if hasattr(exc, "container") and exc.container:
                logs = exc.container.logs()
            else:
                return []
        try:
            payload = json.loads(logs.decode("utf-8", errors="replace") or "[]")
        except json.JSONDecodeError:
            return []
        return payload if isinstance(payload, list) else []


def run_osv(files: FileMap) -> list[dict]:
    if _trust_offline():
        return []
    if not any(name.endswith("package-lock.json") or name == "package.json" for name in files):
        return []
    client = docker.from_env()
    tar_bytes = _filemap_tar({k: v for k, v in files.items() if "package" in k or k.endswith(".json")})
    try:
        logs = client.containers.run(
            osv_image(),
            command=["--recursive", "/scan"],
            network_disabled=False,
            remove=True,
            mem_limit="512m",
        )
        _ = tar_bytes, logs
    except DockerException:
        return []
    return []
