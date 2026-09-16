from __future__ import annotations

import io
import json
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
_APP_ROOT = "/app"
_SMOKE_RESULT_PREFIX = "TERRARIUM_SMOKE_RESULT "
_NODE_ERROR_MARKERS = (
    "Pre-transform error",
    "Failed to resolve import",
    "Transform failed",
    "Failed to scan for dependencies",
    "Internal server error",
)
_SMOKE_SCRIPT = r"""
const { chromium } = require("playwright");

const targetUrl = process.env.TARGET_URL;
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || "15000");
const failures = [];
const checks = [];

function recordFailure(message) {
  failures.push(String(message).slice(0, 700));
}

function ignoredConsoleError(message) {
  return /favicon|ERR_ABORTED/i.test(message);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible().catch(() => false)) {
      return item;
    }
  }
  return null;
}

async function fillFirstTextInput(page) {
  const input = await firstVisible(
    page.locator("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea")
  );
  if (!input) {
    return false;
  }
  await input.fill("42", { timeout: 1200 });
  checks.push("filled input");
  return true;
}

async function clickAndWait(locator, label) {
  await locator.click({ timeout: 1500 });
  checks.push(label);
  await new Promise((resolve) => setTimeout(resolve, 350));
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    page.on("console", (message) => {
      if (message.type() === "error" && !ignoredConsoleError(message.text())) {
        recordFailure(`console.error: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      recordFailure(`pageerror: ${error.message}`);
    });

    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });
    if (!response || !response.ok()) {
      recordFailure(`load failed: ${response ? response.status() : "no response"}`);
    }
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});

    const bodyStats = await page
      .locator("body")
      .evaluate((body) => ({
        text: (body.innerText || "").trim(),
        childCount: body.children.length,
      }))
      .catch(() => ({ text: "", childCount: 0 }));
    if (!bodyStats.text && bodyStats.childCount === 0) {
      recordFailure("page loaded with an empty body");
    }

    const keypadButton = await firstVisible(page.locator(".keypad button, .calc-keys button"));
    if (keypadButton) {
      const before = await page.locator("body").innerText().catch(() => "");
      await clickAndWait(keypadButton, "clicked keypad button");
      const after = await page.locator("body").innerText().catch(() => "");
      if (before === after) {
        recordFailure("keypad click did not change visible output");
      }
    } else {
      await fillFirstTextInput(page).catch((error) => {
        recordFailure(`input fill failed: ${error.message}`);
        return false;
      });

      const formButton = await firstVisible(
        page.locator(".tool-form button, form button, button[type=submit], input[type=submit]")
      );
      if (formButton) {
        await clickAndWait(formButton, "submitted form");
      } else {
        const action = await firstVisible(
          page.locator("button, [role=button], input:not([type=hidden]), select, textarea, a[href]")
        );
        if (action) {
          const tagName = await action.evaluate((element) => element.tagName.toLowerCase());
          if (tagName === "input" || tagName === "textarea") {
            await action.fill("42", { timeout: 1200 });
            checks.push(`filled ${tagName}`);
          } else {
            await clickAndWait(action, `clicked ${tagName}`);
          }
        } else {
          checks.push("display-only page");
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
    const result = {
      ok: failures.length === 0,
      failures,
      checks,
      title: await page.title().catch(() => ""),
      bodyText: bodyStats.text.slice(0, 240),
    };
    console.log(`${JSON.stringify(result)}`);
    console.log(`TERRARIUM_SMOKE_RESULT ${JSON.stringify(result)}`);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    const result = {
      ok: false,
      failures: [`smoke runner failed: ${error.message}`],
      checks,
    };
    console.log(`TERRARIUM_SMOKE_RESULT ${JSON.stringify(result)}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
})();
"""


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


def project_runtime(files: FileMap | None) -> str:
    if not files:
        return "static"
    names = set(files)
    if "frontend/package.json" in names and "backend/package.json" in names:
        return "react-node"
    if "package.json" in names and ("src/main.jsx" in names or "src/App.jsx" in names):
        return "react"
    return "static"


def _node_command(runtime: str, base_path: str) -> str:
    if runtime == "react-node":
        return (
            "sh -lc 'until [ -f /app/.terrarium-ready ]; do sleep 0.2; done; "
            "ln -sfn /opt/terrarium/node_modules /app/frontend/node_modules; "
            "ln -sfn /opt/terrarium/node_modules /app/backend/node_modules; "
            "cd /app/backend && (npm run dev > /tmp/backend.log 2>&1 &); "
            f"cd /app/frontend && npm run dev -- --host 0.0.0.0 --base {base_path}'"
        )
    return (
        "sh -lc 'until [ -f /app/.terrarium-ready ]; do sleep 0.2; done; "
        "ln -sfn /opt/terrarium/node_modules /app/node_modules; "
        f"cd /app && npm run dev -- --host 0.0.0.0 --base {base_path}'"
    )


class SandboxRunner:
    """Starts fixture apps only inside Docker. Never executes generated code on the API host."""

    def __init__(self, client: docker.DockerClient | None = None) -> None:
        self.client = client or docker.from_env()

    def start(self, session_id: str, files: FileMap | None = None) -> SandboxHandle:
        slug = session_slug(session_id)
        name = container_name(session_id)
        self.stop(session_id)
        self._ensure_network()
        runtime = project_runtime(files)
        if runtime == "static":
            self._ensure_fixture_image()
            image = config.FIXTURE_IMAGE
            command = None
            app_port = "80"
            target_root = _HTML_ROOT
        else:
            self._ensure_node_image()
            image = config.NODE_IMAGE
            base_path = f"/preview/{slug}/" if config.PREVIEW_MODE == "path" else "/"
            command = _node_command(runtime, base_path)
            app_port = "5173"
            target_root = _APP_ROOT

        router = f"sandbox-{slug}"
        run_kwargs: dict = {
            "name": name,
            "detach": True,
            "nano_cpus": config.NANO_CPUS,
            "mem_limit": config.NODE_MEM_LIMIT if runtime != "static" else config.MEM_LIMIT,
            "memswap_limit": config.NODE_MEM_LIMIT if runtime != "static" else config.MEM_LIMIT,
            "pids_limit": config.PIDS_LIMIT,
            "network": config.SANDBOX_NETWORK,
            "publish_all_ports": False,
            "labels": {
                "terrarium.session": session_id,
                "terrarium.runtime": runtime,
                "terrarium.port": app_port,
                "traefik.enable": "true",
                "traefik.docker.network": config.SANDBOX_NETWORK,
                f"traefik.http.routers.{router}.rule": f"Host(`{slug}.{config.SANDBOX_HOST}`)",
                f"traefik.http.routers.{router}.entrypoints": "web",
                f"traefik.http.services.{router}.loadbalancer.server.port": app_port,
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
        if command:
            run_kwargs["command"] = command
            run_kwargs["working_dir"] = _APP_ROOT
        container = self.client.containers.run(image, **run_kwargs)
        self._wait_until_running(container)
        if files:
            if runtime != "static":
                files = {**files, ".terrarium-ready": "1\n"}
            _write_filemap(container, files, target_root=target_root)
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
        labels = container.attrs.get("Config", {}).get("Labels", {}) or {}
        runtime = str(labels.get("terrarium.runtime") or "static")
        port = str(labels.get("terrarium.port") or "80")
        docker_status = str(state.get("Status") or container.status)
        health_status = str((state.get("Health") or {}).get("Status") or "")

        if docker_status == "running":
            if runtime != "static":
                probe = container.exec_run(
                    ["sh", "-lc", f"wget -qO- http://127.0.0.1:{port}/ >/dev/null 2>&1"]
                )
                if int(getattr(probe, "exit_code", 1)) != 0:
                    return HealthReport(status="booting", logs=logs or "Node preview is starting")
                if any(marker in logs for marker in _NODE_ERROR_MARKERS):
                    return HealthReport(status="unhealthy", logs=logs)
            if health_status == "unhealthy":
                return HealthReport(status="unhealthy", logs=logs)
            if health_status == "starting":
                return HealthReport(status="booting", logs=logs)
            return HealthReport(status="running", logs=logs)

        return HealthReport(status="unhealthy", logs=logs or docker_status)

    def wait_until_healthy(
        self, session_id: str, timeout_s: float | None = None
    ) -> HealthReport:
        timeout = timeout_s if timeout_s is not None else config.SMOKE_TIMEOUT_S
        deadline = time.monotonic() + timeout
        last_report = HealthReport(status="booting", logs="")
        while time.monotonic() < deadline:
            last_report = self.health(session_id)
            if last_report.status != "booting":
                return last_report
            time.sleep(0.25)
        logs = last_report.logs or f"Sandbox health stayed booting for {timeout:.1f}s"
        return HealthReport(status="unhealthy", logs=logs)

    def smoke(self, session_id: str, timeout_s: float | None = None) -> HealthReport:
        """Run a generic DOM smoke test from an ephemeral browser container."""
        timeout = timeout_s if timeout_s is not None else config.SMOKE_TIMEOUT_S
        self._ensure_smoke_image()
        slug = session_slug(session_id)
        target_url = f"http://{container_name(session_id)}:80/"
        container = None
        try:
            container = self.client.containers.run(
                config.SMOKE_IMAGE,
                ["node", "-e", _SMOKE_SCRIPT],
                detach=True,
                network=config.SANDBOX_NETWORK,
                environment={
                    "TARGET_URL": target_url,
                    "SMOKE_TIMEOUT_MS": str(int(timeout * 1000)),
                },
                name=f"terrarium-smoke-{slug}-{int(time.time() * 1000)}",
                nano_cpus=config.NANO_CPUS,
                mem_limit=config.SMOKE_MEM_LIMIT,
                memswap_limit=config.SMOKE_MEM_LIMIT,
                pids_limit=config.SMOKE_PIDS_LIMIT,
                security_opt=["no-new-privileges:true"],
                shm_size="128m",
            )
            wait_result = container.wait(timeout=timeout + 5)
            exit_code = int(wait_result.get("StatusCode", 1))
            logs = _decode_logs(container.logs(stdout=True, stderr=True, tail=200))
            return _smoke_report_from_output(exit_code, logs)
        except Exception as error:
            logs = str(error)
            if container is not None:
                try:
                    logs = (
                        _decode_logs(container.logs(stdout=True, stderr=True, tail=200))
                        or logs
                    )
                except Exception:
                    pass
            return HealthReport(status="unhealthy", logs=f"DOM smoke failed: {logs}")
        finally:
            if container is not None:
                try:
                    container.remove(force=True)
                except Exception:
                    pass

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

    def _ensure_smoke_image(self) -> None:
        try:
            self.client.images.get(config.SMOKE_IMAGE)
            return
        except ImageNotFound:
            self.client.images.pull(config.SMOKE_IMAGE)

    def _ensure_node_image(self) -> None:
        try:
            self.client.images.get(config.NODE_IMAGE)
            return
        except ImageNotFound:
            pass
        if (config.NODE_FIXTURE_DIR / "Dockerfile").is_file():
            self.client.images.build(
                path=str(config.NODE_FIXTURE_DIR),
                tag=config.NODE_IMAGE,
                rm=True,
            )
            return
        self.client.images.pull(config.NODE_IMAGE)

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


def _write_filemap(container, files: FileMap, *, target_root: str = _HTML_ROOT) -> None:
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
    container.put_archive(target_root, buf.getvalue())


def _decode_logs(raw: bytes | str) -> str:
    if isinstance(raw, bytes):
        return raw.decode("utf-8", errors="replace")
    return raw


def _smoke_report_from_output(exit_code: int, logs: str) -> HealthReport:
    result: dict[str, object] | None = None
    for line in logs.splitlines():
        if not line.startswith(_SMOKE_RESULT_PREFIX):
            continue
        try:
            result = json.loads(line.removeprefix(_SMOKE_RESULT_PREFIX))
        except Exception:
            result = None
    if result is not None:
        return _smoke_report_from_result(result)
    if exit_code == 0:
        return HealthReport(status="running", logs="DOM smoke passed")
    excerpt = logs.strip()[-2000:] or f"smoke container exited with code {exit_code}"
    return HealthReport(status="unhealthy", logs=f"DOM smoke failed: {excerpt}")


def _smoke_report_from_result(result: dict[str, object]) -> HealthReport:
    checks = result.get("checks")
    check_text = (
        ", ".join(str(item) for item in checks) if isinstance(checks, list) else ""
    )
    if result.get("ok") is True:
        suffix = f": {check_text}" if check_text else ""
        return HealthReport(status="running", logs=f"DOM smoke passed{suffix}")

    failures = result.get("failures")
    if isinstance(failures, list) and failures:
        details = "; ".join(str(item) for item in failures[:8])
    else:
        details = "unknown browser failure"
    if check_text:
        details = f"{details}. Checks before failure: {check_text}"
    return HealthReport(status="unhealthy", logs=f"DOM smoke failed: {details}")
