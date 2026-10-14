"""Vite build, CSS log, and server-render ladder for apps already written to disk."""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPS = ROOT / "docs" / "codegen-metrics" / "per-file-apps"
OUT = ROOT / "docs" / "codegen-metrics" / "per-file-validate.json"
IMAGE = "terrarium-node-sandbox:p1-s3"
RENDER = r"""
import * as esbuild from 'esbuild'
import { pathToFileURL } from 'node:url'
const source = [
  "import React from 'react'",
  "import { renderToString } from 'react-dom/server'",
  "import App from './src/App'",
  "try {",
  "  const html = renderToString(React.createElement(App))",
  "  console.log('RENDER_OK', String(html).slice(0, 180))",
  "} catch (error) {",
  "  const line = error && error.stack ? String(error.stack).split(String.fromCharCode(10))[0] : String(error)",
  "  console.log('RENDER_FAIL', line)",
  "}",
].join(String.fromCharCode(10))
try {
  await esbuild.build({
    stdin: { contents: source, resolveDir: '/work', sourcefile: 'entry.jsx', loader: 'jsx' },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: '/work/spike-render.mjs',
    packages: 'external',
    jsx: 'automatic',
    logLevel: 'silent',
    external: [],
  })
} catch (error) {
  const text = error && error.errors ? error.errors.map((item) => {
    const where = item.location ? (item.location.file + ':' + item.location.line) : 'entry'
    return where + ' ' + item.text
  }).join(' | ') : String(error)
  console.log('RENDER_FAIL', text)
  process.exit(0)
}
try {
  await import(pathToFileURL('/work/spike-render.mjs').href)
} catch (error) {
  const line = error && error.stack ? String(error.stack).split(String.fromCharCode(10))[0] : String(error)
  console.log('RENDER_FAIL', line)
}
"""


def _docker(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, capture_output=True, text=True, check=False)


def _validate(folder: Path) -> dict:
    script = folder / "render-check.mjs"
    script.write_text(RENDER, encoding="utf-8")
    started = time.monotonic()
    build = _docker([
        "docker", "run", "--rm",
        "-v", f"{folder}:/work",
        "-w", "/work",
        IMAGE,
        "sh", "-lc",
        "ln -sfn /opt/terrarium/node_modules /work/node_modules && npm run build",
    ])
    vite_seconds = round(time.monotonic() - started, 3)
    log = (build.stdout or "") + (build.stderr or "")
    css_warning = "css-syntax-error" in log or "unclosed" in log.lower()
    render_started = time.monotonic()
    render = _docker([
        "docker", "run", "--rm",
        "-v", f"{folder}:/work",
        "-w", "/work",
        IMAGE,
        "sh", "-lc",
        "ln -sfn /opt/terrarium/node_modules /work/node_modules && node render-check.mjs",
    ])
    render_seconds = round(time.monotonic() - render_started, 3)
    render_log = (render.stdout or "") + (render.stderr or "")
    tsc_line = ""
    tsc_ok = None
    if any(folder.rglob("*.tsx")):
        tsc_started = time.monotonic()
        config = {
            "compilerOptions": {
                "jsx": "react-jsx",
                "strict": True,
                "noEmit": True,
                "module": "ESNext",
                "moduleResolution": "bundler",
                "target": "ES2022",
                "skipLibCheck": True,
                "allowImportingTsExtensions": True,
                "types": [],
            },
            "include": ["src"],
        }
        config["compilerOptions"]["baseUrl"] = "."
        config["compilerOptions"]["paths"] = {
            "react": ["vendor/react"],
            "react/jsx-runtime": ["vendor/react/jsx-runtime"],
            "react-dom": ["vendor/react-dom"],
            "react-dom/client": ["vendor/react-dom/client"],
        }
        (folder / "tsconfig.json").write_text(json.dumps(config), encoding="utf-8")
        tsc_cache = ROOT / "docs" / "codegen-metrics" / "tsc-cache"
        tsc = _docker([
            "docker", "run", "--rm",
            "-v", f"{folder}:/work",
            "-v", f"{tsc_cache}:/opt/tsc",
            "-w", "/work",
            IMAGE,
            "sh", "-lc",
            "ln -sfn /opt/terrarium/node_modules /work/node_modules && mkdir -p /work/vendor && ln -sfn /opt/tsc/node_modules/@types/react /work/vendor/react && ln -sfn /opt/tsc/node_modules/@types/react-dom /work/vendor/react-dom && /opt/tsc/node_modules/.bin/tsc --noEmit --pretty false",
        ])
        tsc_log = (tsc.stdout or "") + (tsc.stderr or "")
        tsc_ok = tsc.returncode == 0
        tsc_line = "\n".join(line for line in tsc_log.splitlines() if "error TS" in line)[:1500]
        tsc_seconds = round(time.monotonic() - tsc_started, 3)
    else:
        tsc_seconds = 0
    script.unlink(missing_ok=True)
    _docker(["docker", "run", "--rm", "-v", f"{folder}:/work", IMAGE, "sh", "-lc", "rm -rf /work/node_modules /work/vendor /work/tsconfig.json /work/spike-render.mjs /work/dist"])
    return {
        "path": str(folder.relative_to(ROOT)).replace("\\", "/"),
        "viteOk": build.returncode == 0 and not css_warning,
        "viteSeconds": vite_seconds,
        "cssWarning": css_warning,
        "renderOk": "RENDER_OK" in render_log and "RENDER_FAIL" not in render_log,
        "renderSeconds": render_seconds,
        "renderLine": next((line for line in render_log.splitlines() if line.startswith("RENDER_")), render_log[-300:]),
        "tscOk": tsc_ok,
        "tscSeconds": tsc_seconds,
        "tscErrors": tsc_line,
        "viteTail": "\n".join(log.splitlines()[-8:]),
    }


def _ensure_tsc() -> None:
    cache = ROOT / "docs" / "codegen-metrics" / "tsc-cache"
    if (cache / "node_modules" / "typescript").exists() and (cache / "node_modules" / "@types" / "react").exists():
        return
    cache.mkdir(parents=True, exist_ok=True)
    _docker([
        "docker", "run", "--rm", "-v", f"{cache}:/work", "-w", "/work", IMAGE,
        "npm", "install", "typescript@5.9.2", "@types/react@19.1.8", "@types/react-dom@19.1.6", "--no-audit", "--no-fund",
    ])


def main() -> None:
    rows = []
    if not APPS.exists():
        raise SystemExit(f"missing {APPS}")
    _ensure_tsc()
    for folder in sorted(path.parent for path in APPS.glob("*/*/package.json")):
        row = _validate(folder)
        rows.append(row)
        print(json.dumps({k: row[k] for k in ("path", "viteOk", "renderOk", "viteSeconds", "renderSeconds")}))
    OUT.write_text(json.dumps({"rows": rows}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
