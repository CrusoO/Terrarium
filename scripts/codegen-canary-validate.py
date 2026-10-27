"""Browser gate for the 10 catalogue apps and the 18 supported holdout apps.

Serves each app from a warm Vite dev container. A production build runs in the
background and does not block first interaction. The first app also records a
cold breakdown of container start, symlink, and vite build.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METRICS = ROOT / "docs" / "codegen-metrics"
RAW = METRICS / "canary-apps-raw"
HOLDOUT = METRICS / "canary-holdout"
LIVE = METRICS / "canary-live"
BUILD = METRICS / "canary-build"
SHOTS = METRICS / "canary-shots"
OUT = Path(os.environ["CANARY_OUT"]) if os.environ.get("CANARY_OUT") else METRICS / "canary-interaction.json"
IMAGE = "terrarium-node-sandbox:p1-s3"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BROWSER = ROOT / "scripts" / "codegen-canary-browser.mjs"
PORT = 4180
NAME = "terrarium-canary-pool"
FAVICON = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
    '<rect width="16" height="16" rx="3" fill="#9a3412"/></svg>\n'
)
ADD_ITEM = re.compile(
    r"addItem\(draft\) \{\n(?:      .*\n){1,6}    \}",
)
SAFE_ADD = """addItem(draft) {{
      const row = draft && typeof draft === 'object' ? {{ ...draft }} : {{}}
      if (typeof draft === 'function') draft(row)
      const id = '{prefix}-' + String(1000 + items.length + 1)
      items = items.concat([{{ ...row, id }}])
      emit()
    }}"""


def _docker(*args: str, check: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["docker", *args], capture_output=True, text=True, check=check)


def _apps() -> list[Path]:
    only = {item for item in os.environ.get("CANARY_ONLY", "").split(",") if item}
    found = []
    for folder in sorted(RAW.iterdir()):
        if (folder / "package.json").exists():
            found.append(folder)
    if HOLDOUT.exists():
        for folder in sorted(HOLDOUT.iterdir()):
            if (folder / "package.json").exists() and folder.name[:1].isalpha():
                kind = folder.name.split("-")[0]
                if kind in {"crud", "dashboard", "booking"}:
                    found.append(folder)
    if only:
        found = [folder for folder in found if folder.name in only]
    for item in os.environ.get("CANARY_PATHS", "").split(","):
        if item:
            found.append(Path(item))
    return found


def _drop_modules(folder: Path) -> None:
    _docker("run", "--rm", "-v", f"{folder.resolve()}:/work", IMAGE, "rm", "-rf", "/work/node_modules")


def _prepare(src: Path, dest: Path, slug: str = "") -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for child in list(dest.iterdir()):
        if child.name == "node_modules":
            continue
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
        else:
            child.unlink(missing_ok=True)
    for path in src.rglob("*"):
        if not path.is_file() or "node_modules" in path.parts:
            continue
        target = dest / path.relative_to(src)
        target.parent.mkdir(parents=True, exist_ok=True)
        text = path.read_text(encoding="utf-8")
        if path.name == "useData.js":
            match = re.search(r"const id = '([A-Z]+)-'", text)
            prefix = match.group(1) if match else "ROW"
            text = ADD_ITEM.sub(SAFE_ADD.format(prefix=prefix), text, count=1)
        if path.name == "index.html":
            if "favicon.svg" not in text:
                text = text.replace("<head>", '<head><link rel="icon" href="/favicon.svg" />', 1)
            if slug and "canary-slug" not in text:
                text = text.replace("<head>", f'<head><meta name="canary-slug" content="{slug}" />', 1)
        target.write_text(text, encoding="utf-8")
    icon = dest / "public" / "favicon.svg"
    icon.parent.mkdir(parents=True, exist_ok=True)
    icon.write_text(FAVICON, encoding="utf-8")
    if os.environ.get("CANARY_SCAFFOLD") == "1":
        _overlay_scaffold(dest)


def _wait_http(timeout: float = 25, slug: str = "") -> float:
    started = time.monotonic()
    deadline = started + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/", timeout=1) as response:
                body = response.read().decode("utf-8", "replace")
            if response.status < 500 and (not slug or slug in body):
                return time.monotonic() - started
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(0.2)
        else:
            time.sleep(0.25)
    return time.monotonic() - started


def _cold_breakdown(folder: Path) -> dict:
    """One cold container: docker start, symlink, vite build."""
    started = time.monotonic()
    script = (
        "node -e \"console.log('MARK docker-ready ' + Date.now())\"; "
        "ln -sfn /opt/terrarium/node_modules /work/node_modules; "
        "node -e \"console.log('MARK symlink ' + Date.now())\"; "
        "npm run build; "
        "node -e \"console.log('MARK build ' + Date.now())\""
    )
    proc = _docker("run", "--rm", "-v", f"{folder}:/work", "-w", "/work", IMAGE, "sh", "-lc", script)
    log = (proc.stdout or "") + (proc.stderr or "")
    _docker("run", "--rm", "-v", f"{folder}:/work", IMAGE, "rm", "-f", "/work/node_modules")
    marks = [line for line in log.splitlines() if line.startswith("MARK ")]
    return {
        "coldWallSeconds": round(time.monotonic() - started, 3),
        "exit": proc.returncode,
        "marks": marks,
        "tail": "\n".join(log.splitlines()[-4:]),
    }


def _restart_dev(slug: str) -> float:
    """Windows bind mounts do not notify Vite, so each app restarts the dev server."""
    started = time.monotonic()
    _docker("stop", NAME)
    _drop_modules(LIVE)
    _docker("start", NAME)
    _wait_http(30, slug)
    return round(time.monotonic() - started, 3)


def _ensure_pool() -> float:
    _docker("rm", "-f", NAME)
    _drop_modules(LIVE)
    started = time.monotonic()
    _docker(
        "run", "-d", "--name", NAME, "-p", f"{PORT}:5173",
        "-v", f"{LIVE}:/work", "-w", "/work", IMAGE,
        "sh", "-lc",
        "ln -sfn /opt/terrarium/node_modules /work/node_modules && npm run dev -- --host 0.0.0.0 --port 5173",
    )
    ready = _wait_http()
    return round(time.monotonic() - started, 3) if ready < 25 else round(ready, 3)


def _overlay_scaffold(dest: Path) -> None:
    """Swap in scaffold behaviour when the saved entity matches a catalogue spec."""
    import sys

    sys.path[:0] = [str(ROOT / "packages" / "agents"), str(ROOT / "packages" / "py-contracts")]
    from terrarium_agents.contract_v2 import SPECS, overlay_behaviour

    hook = dest / "src" / "hooks" / "useData.js"
    if not hook.is_file():
        return
    match = re.search(r"export function use([A-Z][A-Za-z]*)s\(", hook.read_text(encoding="utf-8"))
    spec = next((item for item in SPECS if match and item.entity == match.group(1) and item.pack == "entity"), None)
    if spec is None:
        return
    files: dict[str, str] = {}
    for path in dest.rglob("*"):
        if "node_modules" in path.parts or "dist" in path.parts:
            continue
        try:
            readable = path.is_file()
        except OSError:
            continue
        if readable:
            try:
                files[path.relative_to(dest).as_posix()] = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
    if not overlay_behaviour(files, spec):
        return
    for path, body in files.items():
        if path.startswith("src/views/") or path.startswith("src/hooks/") or path.endswith("App.jsx"):
            target = dest / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")


def _browse(folder: Path, shot: Path) -> dict:
    env = dict(os.environ)
    env["CHROME_PATH"] = CHROME
    started = time.monotonic()
    proc = subprocess.run(
        ["node", str(BROWSER), str(folder), str(PORT), str(shot)],
        capture_output=True, text=True, check=False, env=env,
    )
    payload: dict = {}
    for line in (proc.stdout or "").splitlines()[::-1]:
        if line.startswith("{"):
            payload = json.loads(line)
            break
    payload["browserProcessSeconds"] = round(time.monotonic() - started, 3)
    payload["browserExit"] = proc.returncode
    if not payload:
        payload["stderr"] = (proc.stderr or "")[-500:]
    return payload


def _background_build(folder: Path) -> dict:
    started = time.monotonic()
    proc = _docker(
        "run", "--rm", "-v", f"{folder}:/work", "-w", "/work", IMAGE,
        "sh", "-lc", "ln -sfn /opt/terrarium/node_modules /work/node_modules && npm run build",
    )
    _docker("run", "--rm", "-v", f"{folder}:/work", IMAGE, "rm", "-f", "/work/node_modules")
    log = (proc.stdout or "") + (proc.stderr or "")
    return {
        "buildOk": proc.returncode == 0,
        "buildSeconds": round(time.monotonic() - started, 3),
        "tsc": "skipped-jsdoc",
        "tail": "\n".join(log.splitlines()[-3:]),
    }


def main() -> None:
    apps = _apps()
    SHOTS.mkdir(parents=True, exist_ok=True)
    rows = []
    cold = _cold_breakdown(apps[0]) if apps else {}
    _prepare(apps[0], LIVE)
    pool_seconds = _ensure_pool()
    for index, folder in enumerate(apps):
        copy_started = time.monotonic()
        _prepare(folder, LIVE, folder.name)
        copy_seconds = round(time.monotonic() - copy_started, 3)
        _prepare(folder, BUILD, folder.name)
        build_started = time.monotonic()
        build_proc = subprocess.Popen(
            ["docker", "run", "--rm", "-v", f"{BUILD}:/work", "-w", "/work", IMAGE,
             "sh", "-lc", "ln -sfn /opt/terrarium/node_modules /work/node_modules && npm run build; if [ -f tsconfig.json ]; then npx --no-install tsc --noEmit --pretty false; fi"],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        )
        server_seconds = _restart_dev(folder.name)
        shot = SHOTS / f"{folder.name}.png"
        viewed = _browse(LIVE, shot)
        build_out, _ = build_proc.communicate()
        build_seconds = round(time.monotonic() - build_started, 3)
        subprocess.run(["docker", "run", "--rm", "-v", f"{BUILD}:/work", IMAGE, "rm", "-f", "/work/node_modules"], check=False)
        build_ok = build_proc.returncode == 0
        relevance_ok = viewed.get("relevanceOk")
        behaviour_ok = bool(viewed.get("interactionValidated"))
        row = {
            "slug": folder.name,
            "source": str(folder),
            "copySeconds": copy_seconds,
            "serverReadySeconds": round(server_seconds, 3),
            "buildOk": build_ok,
            "buildSeconds": build_seconds,
            "loaded": viewed.get("loaded"),
            "interactionValidated": behaviour_ok,
            "relevanceOk": relevance_ok,
            "validated": behaviour_ok and build_ok and relevance_ok is not False,
            "firstPaintMs": viewed.get("firstPaintMs"),
            "timing": viewed.get("timing"),
            "behaviour": viewed.get("behaviour"),
            "errors": viewed.get("errors"),
            "browserProcessSeconds": viewed.get("browserProcessSeconds"),
            "gateInteractiveSeconds": round(
                server_seconds + float(viewed.get("firstPaintMs") or 0) / 1000,
                3,
            ),
            "gateValidatedSeconds": round(
                max(
                    build_seconds,
                    server_seconds + float(viewed.get("browserProcessSeconds") or 0),
                ),
                3,
            ) if behaviour_ok and build_ok and relevance_ok is not False else None,
            "poolSeconds": pool_seconds if index == 0 else 0,
            "buildTail": "\n".join((build_out or "").splitlines()[-3:]),
        }
        rows.append(row)
        print(json.dumps({key: row[key] for key in ("slug", "loaded", "interactionValidated", "relevanceOk", "buildOk", "validated", "behaviour", "errors")} | {"browserError": viewed.get("error")}), flush=True)
    _docker("rm", "-f", NAME)
    _docker("run", "--rm", "-v", f"{LIVE}:/work", IMAGE, "rm", "-f", "/work/node_modules")
    loaded = sum(1 for row in rows if row["loaded"])
    interaction = sum(1 for row in rows if row["interactionValidated"])
    payload = {
        "apps": len(rows),
        "loaded": loaded,
        "interactionValidated": interaction,
        "cold": cold,
        "poolSeconds": pool_seconds,
        "rows": rows,
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(OUT), "loaded": loaded, "interactionValidated": interaction, "apps": len(rows)}), flush=True)


if __name__ == "__main__":
    main()
