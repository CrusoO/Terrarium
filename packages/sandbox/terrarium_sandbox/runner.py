from __future__ import annotations

import re
import time

import docker
from docker.errors import ImageNotFound, NotFound
from terrarium_contracts import HealthReport, SandboxHandle

from terrarium_sandbox import config

_SESSION_SLUG = re.compile(r"[^a-z0-9-]+")


class SandboxError(RuntimeError):
    pass


def session_slug(session_id: str) -> str:
    slug = _SESSION_SLUG.sub("-", session_id.strip().lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)[:63]
    if not slug:
        raise SandboxError("sessionId must contain a letter or digit")
    return slug


def preview_url(session_id: str, host: str = config.SANDBOX_HOST) -> str:
    return f"http://{session_slug(session_id)}.{host}"


def container_name(session_id: str) -> str:
    return f"{config.CONTAINER_PREFIX}{session_slug(session_id)}"


class SandboxRunner:
    """Starts fixture apps only inside Docker. Never executes generated code on the API host."""

    def __init__(self, client: docker.DockerClient | None = None) -> None:
        self.client = client or docker.from_env()

    def start(self, session_id: str) -> SandboxHandle:
        slug = session_slug(session_id)
        name = container_name(session_id)
        self.stop(session_id)
        self._ensure_network()
        self._ensure_fixture_image()

        router = f"sandbox-{slug}"
        container = self.client.containers.run(
            config.FIXTURE_IMAGE,
            name=name,
            detach=True,
            nano_cpus=config.NANO_CPUS,
            mem_limit=config.MEM_LIMIT,
            memswap_limit=config.MEM_LIMIT,
            pids_limit=config.PIDS_LIMIT,
            network=config.SANDBOX_NETWORK,
            publish_all_ports=False,
            labels={
                "terrarium.session": session_id,
                "traefik.enable": "true",
                "traefik.docker.network": config.SANDBOX_NETWORK,
                f"traefik.http.routers.{router}.rule": f"Host(`{slug}.{config.SANDBOX_HOST}`)",
                f"traefik.http.routers.{router}.entrypoints": "web",
                f"traefik.http.services.{router}.loadbalancer.server.port": "80",
            },
            security_opt=["no-new-privileges:true"],
            read_only=True,
            tmpfs={
                "/var/cache/nginx": "size=8m,mode=1777",
                "/var/run": "size=1m,mode=1777",
                "/tmp": "size=8m,mode=1777",
                "/var/log/nginx": "size=2m,mode=1777",
            },
        )
        self._wait_until_running(container)
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
            return
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


def _decode_logs(raw: bytes | str) -> str:
    if isinstance(raw, bytes):
        return raw.decode("utf-8", errors="replace")
    return raw
