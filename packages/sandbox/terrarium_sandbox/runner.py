from __future__ import annotations

import io
import re
import tarfile
import time
from pathlib import Path

import docker
from docker.errors import ImageNotFound, NotFound
from terrarium_contracts import FileMap, HealthReport, SandboxHandle

from terrarium_sandbox import config

_SESSION_SLUG = re.compile(r"[^a-z0-9-]+")
_HTML_ROOT = "/usr/share/nginx/html"


class SandboxError(RuntimeError):
    pass


def session_slug(session_id: str) -> str:
    slug = _SESSION_SLUG.sub("-", session_id.strip().lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)[:63]
    if not slug:
        raise SandboxError("sessionId must contain a letter or digit")
    return slug


def preview_url(session_id: str, host: str = config.SANDBOX_HOST) -> str:
    slug = session_slug(session_id)
    if config.preview_mode() == "host":
        return f"http://{slug}.{host}"
    return f"/preview/{slug}/"


def container_name(session_id: str) -> str:
    return f"{config.CONTAINER_PREFIX}{session_slug(session_id)}"


class SandboxRunner:
    """Starts fixture apps only inside Docker. Never executes generated code on the API host."""

    def __init__(self, client: docker.DockerClient | None = None) -> None:
        self.client = client or docker.from_env()

    def start(self, session_id: str, files: FileMap | None = None) -> SandboxHandle:
        slug = session_slug(session_id)
        name = container_name(session_id)
        self.stop(session_id)
        self._ensure_network()
        self._ensure_fixture_image()

        router = f"sandbox-{slug}"
        run_kwargs: dict = {
            "name": name,
            "detach": True,
            "nano_cpus": config.NANO_CPUS,
            "mem_limit": config.MEM_LIMIT,
            "memswap_limit": config.MEM_LIMIT,
            "pids_limit": config.PIDS_LIMIT,
            "network": config.SANDBOX_NETWORK,
            "publish_all_ports": False,
            "labels": {
                "terrarium.session": session_id,
                "traefik.enable": "true",
                "traefik.docker.network": config.SANDBOX_NETWORK,
                f"traefik.http.routers.{router}.rule": f"Host(`{slug}.{config.SANDBOX_HOST}`)",
                f"traefik.http.routers.{router}.entrypoints": "web",
                f"traefik.http.services.{router}.loadbalancer.server.port": "80",
                f"traefik.http.routers.{router}-path.rule": f"PathPrefix(`/preview/{slug}`)",
                f"traefik.http.routers.{router}-path.entrypoints": "web",
                f"traefik.http.routers.{router}-path.middlewares": f"{router}-strip",
                f"traefik.http.middlewares.{router}-strip.stripprefix.prefixes": f"/preview/{slug}",
            },
            "security_opt": ["no-new-privileges:true"],
            "read_only": files is None,
            "tmpfs": {
                "/var/cache/nginx": "size=8m,mode=1777",
                "/var/run": "size=1m,mode=1777",
                "/tmp": "size=8m,mode=1777",
                "/var/log/nginx": "size=2m,mode=1777",
            },
        }
        container = self.client.containers.run(config.FIXTURE_IMAGE, **run_kwargs)
        self._wait_until_running(container)
        if files:
            _write_filemap(container, files)
        return SandboxHandle(
            sessionId=session_id,
            previewUrl=preview_url(session_id),
            containerId=container.id,
        )

    def health(self, session_id: str) -> HealthReport:
        try:
            container = self.client.containers.get(container_name(session_id))
        except NotFound:
            return HealthReport(status="stopped", logs="")

        container.reload()
        logs = _decode_logs(container.logs(tail=200))
        state = container.attrs.get("State") or {}
        docker_status = str(state.get("Status") or container.status)
        health_status = str((state.get("Health") or {}).get("Status") or "")

        if docker_status == "running":
            if health_status == "unhealthy":
                return HealthReport(status="unhealthy", logs=logs)
            if health_status == "starting":
                return HealthReport(status="booting", logs=logs)
            return HealthReport(status="running", logs=logs)

        return HealthReport(status="unhealthy", logs=logs or docker_status)

    def stop(self, session_id: str) -> None:
        name = container_name(session_id)
        try:
            container = self.client.containers.get(name)
        except NotFound:
            container = None
        if container is not None:
            container.remove(force=True)

    def _ensure_network(self) -> None:
        try:
            self.client.networks.get(config.SANDBOX_NETWORK)
        except NotFound as error:
            raise SandboxError(
                f'Docker network "{config.SANDBOX_NETWORK}" is missing. '
                "Start infra with: npx pnpm@9.15.4 infra:up"
            ) from error

    def _ensure_fixture_image(self) -> None:
        try:
            self.client.images.get(config.FIXTURE_IMAGE)
            return
        except ImageNotFound:
            pass
        if not (config.FIXTURE_DIR / "Dockerfile").is_file():
            raise SandboxError(f"Fixture Dockerfile missing at {config.FIXTURE_DIR}")
        self.client.images.build(
            path=str(config.FIXTURE_DIR),
            tag=config.FIXTURE_IMAGE,
            rm=True,
        )

    def _wait_until_running(self, container, timeout_s: float = 20.0) -> None:
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            container.reload()
            if container.status == "running":
                return
            if container.status in {"exited", "dead"}:
                logs = _decode_logs(container.logs(tail=50))
                raise SandboxError(
                    f"Sandbox container exited during start ({container.status}). {logs}"
                )
            time.sleep(0.25)
        raise SandboxError(f"Sandbox container did not reach running within {timeout_s}s")


def _write_filemap(container, files: FileMap) -> None:
    """Copy FileMap through the Docker API. Works when the worker itself is in Docker."""
    buf = io.BytesIO()
    wrote = False
    with tarfile.open(fileobj=buf, mode="w") as tar:
        for rel, body in files.items():
            rel_path = Path(rel)
            if rel_path.is_absolute() or ".." in rel_path.parts:
                continue
            data = body.encode("utf-8")
            info = tarfile.TarInfo(name=rel_path.as_posix())
            info.size = len(data)
            info.mode = 0o644
            tar.addfile(info, io.BytesIO(data))
            wrote = True
    if not wrote:
        raise SandboxError("FileMap did not contain any safe relative paths")
    container.put_archive(_HTML_ROOT, buf.getvalue())


def _decode_logs(raw: bytes | str) -> str:
    if isinstance(raw, bytes):
        return raw.decode("utf-8", errors="replace")
    return raw
