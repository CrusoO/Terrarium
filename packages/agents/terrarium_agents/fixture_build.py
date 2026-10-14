"""Turn saved generated apps into replay fixtures. Does not call a model."""

from __future__ import annotations

import json
from pathlib import Path

from terrarium_agents.canary import HOLDOUT
from terrarium_agents.contract_v2 import (
    SPECS,
    AppSpec,
    build_contract,
    deterministic_files,
    file_is_closed,
    file_task,
    spec_for_prompt,
    strip_page_chrome,
    token_cap,
)
from terrarium_agents.llm import fast_model, leaf_model, page_model
from terrarium_agents.llm_fixtures import (
    fixtures_root,
    invoke_params,
    request_hash,
    stream_params,
    write_fixture,
)
from terrarium_agents.per_file import _static_stage, _strip, repair_request, shared_prefix, stub_component

ROOT = Path(__file__).resolve().parents[3]
METRICS = ROOT / "docs" / "codegen-metrics"
ENTITY = {"crud", "dashboard", "booking"}


def _read_tree(folder: Path) -> dict[str, str]:
    files: dict[str, str] = {}
    if not folder.is_dir():
        return files
    for path in folder.rglob("*"):
        if not path.is_file() or "node_modules" in path.parts or "dist" in path.parts:
            continue
        if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".ico", ".svg"} and "favicon" not in path.name:
            continue
        try:
            files[path.relative_to(folder).as_posix()] = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
    return files


def _tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _walls() -> dict[str, float]:
    found: dict[str, float] = {}
    for name in ("canary-eval.json", "monolith-holdout.json", "canary-edit-five.json"):
        path = METRICS / name
        if not path.is_file():
            continue
        blob = json.loads(path.read_text(encoding="utf-8"))
        _walk_walls(blob, found)
    return found


def _walk_walls(node: object, found: dict[str, float]) -> None:
    if isinstance(node, dict):
        slug = node.get("slug")
        wall = node.get("wallSeconds")
        if isinstance(slug, str) and isinstance(wall, (int, float)):
            found.setdefault(slug, float(wall))
        for value in node.values():
            _walk_walls(value, found)
    elif isinstance(node, list):
        for value in node:
            _walk_walls(value, found)


def _holdout_slugs() -> list[tuple[str, str, str]]:
    """(set, slug, prompt) using the same numbering as the sweep scripts."""
    rows: list[tuple[str, str, str]] = []
    groups: dict[str, int] = {}
    unsupported: list[tuple[str, str]] = []
    for expected, prompt in HOLDOUT:
        groups.setdefault(expected, 0)
        if expected in ENTITY:
            groups[expected] += 1
            rows.append(("holdout", f"{expected}-{groups[expected]}", prompt))
        else:
            unsupported.append((expected, prompt))
    for index, (kind, prompt) in enumerate(unsupported, start=1):
        rows.append(("monolith", f"{kind}-{index}", prompt))
    return rows


_RETRY = "\nThe previous reply was cut off. Return the complete file only, with every brace closed."


def _store_call(
    *,
    model: str,
    system: str,
    user: str,
    params: dict,
    text: str,
    latency: float,
    cache_read: int,
    app: str,
    role: str,
    path: str,
    purpose: str = "codegen",
) -> str:
    return write_fixture(
        provider="bedrock",
        model=model,
        system=system,
        user=user,
        params=params,
        text=text,
        input_tokens=_tokens(system + user),
        output_tokens=_tokens(text),
        latency_seconds=latency,
        cache_read=cache_read,
        purpose=purpose,
        app=app,
        role=role,
        path=path,
        force=True,
    )


def _per_file_app(app_id: str, prompt: str, spec: AppSpec, folder: Path, raw: Path | None, wall: float) -> dict:
    contract = build_contract(spec)
    locked = _read_tree(folder)
    raw_files = _read_tree(raw) if raw else {}
    leaves = [component for component in contract.llm_components() if component.kind == "leaf"]
    pages = [component for component in contract.llm_components() if component.kind == "page"]
    prefix = shared_prefix(contract)
    per_call = wall / max(1, 1 + len(pages) + (1 if leaves else 0))
    hashes: list[str] = []
    model_files: dict[str, str] = {}

    leaf_system = prefix + "This call writes several small files. The one-file rule does not apply.\n"
    hashes.append(
        _store_call(
            model=leaf_model(),
            system=leaf_system,
            user="Reply with the single word ok.",
            params=stream_params(max_tokens=32, cache_system=True, purpose="codegen"),
            text="ok",
            latency=min(per_call, 1.0),
            cache_read=0,
            app=app_id,
            role="warmup",
            path="",
        )
    )
    if leaves:
        system = leaf_system
        user = (
            "Write every file below. Wrap each one exactly like this:\n"
            '<<<FILE path="src/components/Example.jsx">>>\n'
            "export default function Example() { return null }\n"
            "<<<END FILE>>>\n\n"
            + "\n\n".join(file_task(contract, component) for component in leaves)
        )
        parts = []
        for component in leaves:
            body = raw_files.get(component.path) or locked.get(component.path) or stub_component(contract, component)
            model_files[component.path] = body
            parts.append(f'<<<FILE path="{component.path}">>>\n{body}\n<<<END FILE>>>')
            leaf_user = file_task(contract, component)
            hashes.append(
                _store_call(
                    model=leaf_model(),
                    system=prefix,
                    user=leaf_user,
                    params=stream_params(max_tokens=token_cap("leaf"), cache_system=True, purpose="codegen"),
                    text=body,
                    latency=per_call,
                    cache_read=_tokens(prefix),
                    app=app_id,
                    role="leaf",
                    path=component.path,
                )
            )
            if not file_is_closed(body):
                hashes.append(
                    _store_call(
                        model=leaf_model(),
                        system=prefix,
                        user=leaf_user + _RETRY,
                        params=stream_params(max_tokens=token_cap("leaf"), cache_system=True, purpose="codegen"),
                        text=body,
                        latency=per_call,
                        cache_read=_tokens(prefix),
                        app=app_id,
                        role="leaf-retry",
                        path=component.path,
                    )
                )
        hashes.append(
            _store_call(
                model=leaf_model(),
                system=system,
                user=user,
                params=stream_params(max_tokens=min(16000, 1400 * len(leaves)), cache_system=True, purpose="codegen"),
                text="\n".join(parts),
                latency=per_call,
                cache_read=_tokens(system),
                app=app_id,
                role="leaf-batch",
                path=",".join(component.path for component in leaves),
            )
        )
    for component in pages:
        body = raw_files.get(component.path) or locked.get(component.path) or stub_component(contract, component)
        model_files[component.path] = body
        page_user = file_task(contract, component)
        hashes.append(
            _store_call(
                model=page_model(),
                system=prefix,
                user=page_user,
                params=stream_params(max_tokens=token_cap("page"), cache_system=True, purpose="codegen"),
                text=body,
                latency=per_call,
                cache_read=_tokens(prefix),
                app=app_id,
                role="page",
                path=component.path,
            )
        )
        if not file_is_closed(body):
            hashes.append(
                _store_call(
                    model=page_model(),
                    system=prefix,
                    user=page_user + _RETRY,
                    params=stream_params(max_tokens=token_cap("page"), cache_system=True, purpose="codegen"),
                    text=body,
                    latency=per_call,
                    cache_read=_tokens(prefix),
                    app=app_id,
                    role="page-retry",
                    path=component.path,
                )
            )
    files = deterministic_files(contract)
    for path, body in model_files.items():
        text = _strip(body) if "/views/" in path else body
        files[path] = strip_page_chrome(text) if "/views/" in path else text
    _parse, _css, mismatches = _static_stage(files, contract)
    if mismatches:
        system, user = repair_request(files, contract, mismatches)
        hashes.append(
            _store_call(
                model=fast_model(),
                system=system,
                user=user,
                params=invoke_params(max_tokens=1200, temperature=0.2, purpose="repair"),
                text='{"patches":[]}',
                latency=0.5,
                cache_read=_tokens(system),
                app=app_id,
                role="repair",
                path="",
                purpose="repair",
            )
        )
    return {
        "id": app_id,
        "source": str(folder.relative_to(ROOT)).replace("\\", "/"),
        "prompt": prompt,
        "calls": len(hashes),
        "hashes": hashes,
        "mismatches": len(mismatches),
    }


def _monolith_app(slug: str, prompt: str, folder: Path, wall: float, output_tokens: int | None) -> dict:
    files = _read_tree(folder)
    parts = [f'<<<FILE path="{path}">>>\n{body}\n<<<END FILE>>>' for path, body in sorted(files.items())]
    text = "\n".join(parts)
    system = "monolith-snapshot"
    params = {"task": "monolith-snapshot", "maxTokens": 16000, "cacheSystem": False, "purpose": "codegen"}
    digest = _store_call(
        model="anthropic.claude-sonnet-4-6",
        system=system,
        user=prompt,
        params=params,
        text=text,
        latency=wall or 60.0,
        cache_read=0,
        app=f"monolith/{slug}",
        role="monolith",
        path="",
    )
    record_path = fixtures_root() / "records" / f"{digest}.json"
    if record_path.is_file() and output_tokens:
        record = json.loads(record_path.read_text(encoding="utf-8"))
        record["outputTokens"] = output_tokens
        record["keyKind"] = "snapshot"
        record_path.write_text(json.dumps(record, indent=2), encoding="utf-8")
    return {
        "id": f"monolith/{slug}",
        "source": str(folder.relative_to(ROOT)).replace("\\", "/"),
        "prompt": prompt,
        "calls": 1,
        "hashes": [digest],
        "keyKind": "snapshot",
    }


def _edit_apps(walls: dict[str, float]) -> list[dict]:
    from terrarium_agents.contract_v2 import apply_blueprint_edit
    from terrarium_agents.per_file import affected_pages

    cases = [
        ("crud-add-field", SPECS[0], "add-field", {"name": "note", "type_name": "string", "sample": "Leave at door"}),
        ("dashboard-rename", SPECS[2], "rename", {"old": "owner", "new": "lead"}),
        ("booking-new-filter", SPECS[3], "new-filter", {"status": "Waiting"}),
        (
            "landing-add-field",
            spec_for_prompt("Build a landing page for a pottery studio with a hero section and a pricing section."),
            "add-field",
            {"name": "phone", "type_name": "string", "sample": "555-0100"},
        ),
        (
            "charts-new-page",
            spec_for_prompt("Build a sales chart page with a bar graph of monthly revenue."),
            "new-page",
            {"name": "Compare"},
        ),
    ]
    rows = []
    for folder_name, spec, kind, kwargs in cases:
        folder = METRICS / "canary-edit-five" / folder_name
        saved = _read_tree(folder)
        if not saved:
            continue
        edited = apply_blueprint_edit(spec, kind, **kwargs)
        contract = build_contract(edited)
        pages = affected_pages(contract, kind, saved, **kwargs)
        hashes = []
        prefix = shared_prefix(contract)
        for component in pages:
            body = saved.get(component.path)
            if not body:
                continue
            extra = "The blueprint changed. Update this page only."
            hashes.append(
                _store_call(
                    model=page_model(),
                    system=prefix,
                    user=file_task(contract, component) + "\n" + extra,
                    params=stream_params(max_tokens=token_cap("page"), cache_system=True, purpose="codegen"),
                    text=body,
                    latency=walls.get(folder_name, 4.0),
                    cache_read=_tokens(prefix),
                    app=f"edit/{folder_name}",
                    role="edit",
                    path=component.path,
                )
            )
        rows.append(
            {
                "id": f"edit/{folder_name}",
                "source": str(folder.relative_to(ROOT)).replace("\\", "/"),
                "calls": len(hashes),
                "hashes": hashes,
            }
        )
    return rows


def build_fixtures() -> dict:
    walls = _walls()
    apps: list[dict] = []
    latencies: list[float] = sorted(set(round(value, 3) for value in walls.values()))
    for spec in SPECS:
        folder = METRICS / "canary-apps" / spec.slug
        if not folder.is_dir():
            continue
        raw = METRICS / "canary-apps-raw" / spec.slug
        apps.append(_per_file_app(f"catalogue/{spec.slug}", spec.prompt, spec, folder, raw, walls.get(spec.slug, 8.0)))
    monolith_meta = {}
    summary = METRICS / "monolith-holdout.json"
    if summary.is_file():
        for row in json.loads(summary.read_text(encoding="utf-8")).get("rows") or []:
            monolith_meta[row["slug"]] = row
    for bucket, slug, prompt in _holdout_slugs():
        if bucket == "holdout":
            folder = METRICS / "canary-holdout" / slug
            if not folder.is_dir():
                continue
            spec = spec_for_prompt(prompt)
            apps.append(_per_file_app(f"holdout/{slug}", prompt, spec, folder, None, walls.get(slug, 8.0)))
        else:
            folder = METRICS / "monolith-holdout" / slug
            if not folder.is_dir():
                continue
            meta = monolith_meta.get(slug) or {}
            apps.append(
                _monolith_app(slug, prompt, folder, float(meta.get("wallSeconds") or walls.get(slug, 60.0)), meta.get("outputTokens"))
            )
    apps.extend(_edit_apps(walls))
    orders = shared_prefix(build_contract(SPECS[0]))
    root = fixtures_root()
    root.mkdir(parents=True, exist_ok=True)
    (root / "cached-prefix.txt").write_text(orders, encoding="utf-8")
    manifest = {
        "mode": "replay",
        "apps": [{key: value for key, value in app.items() if key != "prompt"} | {"prompt": app.get("prompt", "")} for app in apps],
        "latencies": latencies,
        "calls": sum(app["calls"] for app in apps),
        "note": "Reconstructed from saved apps. A live record-missing run writes only hashes that are not already here.",
    }
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return {"apps": len(apps), "calls": manifest["calls"], "latencies": len(latencies)}


_SECRET_RE = (
    "sk_live_",
    "AKIA",
    "BEGIN PRIVATE KEY",
    "BEGIN RSA PRIVATE KEY",
    "xoxb-",
    "ghp_",
)


def scan_fixtures() -> dict:
    """Look for secrets and measure size. Example addresses are not secrets."""
    root = fixtures_root()
    records = root / "records"
    hits = []
    total = 0
    count = 0
    if records.is_dir():
        for path in records.glob("*.json"):
            count += 1
            total += path.stat().st_size
            text = path.read_text(encoding="utf-8", errors="replace")
            for needle in _SECRET_RE:
                if needle in text:
                    hits.append({"file": path.name, "needle": needle})
    manifest = {
        "records": count,
        "bytes": total,
        "secrets": hits,
        "git": "records/ is gitignored and rebuilt by scripts/codegen-fixtures.py",
    }
    root.mkdir(parents=True, exist_ok=True)
    (root / "manifest-size.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def triage_saved() -> dict:
    """Classify known failures in the saved trees. No model call."""
    findings: list[dict] = []
    roots = [
        METRICS / "canary-apps",
        METRICS / "canary-holdout",
        METRICS / "monolith-holdout",
        METRICS / "canary-edit-five",
    ]
    for root in roots:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or "node_modules" in path.parts or "dist" in path.parts:
                continue
            if path.suffix.lower() not in {".js", ".jsx", ".ts", ".tsx", ".css"}:
                continue
            try:
                body = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            rel = path.relative_to(METRICS).as_posix()
            slug = path.relative_to(root).parts[0]
            if "draft.push" in body:
                findings.append({"slug": slug, "path": rel, "kind": "draft.push"})
            if "addItem((" in body:
                findings.append({"slug": slug, "path": rel, "kind": "function-addItem"})
            if path.suffix.lower() in {".js", ".jsx", ".ts", ".tsx", ".css"} and not file_is_closed(body):
                findings.append({"slug": slug, "path": rel, "kind": "unclosed"})
            if "<<<FILE" in body or "<<<END FILE>>>" in body:
                findings.append({"slug": slug, "path": rel, "kind": "raw-marker"})
    report = {"findings": findings, "counts": {}}
    for item in findings:
        report["counts"][item["kind"]] = report["counts"].get(item["kind"], 0) + 1
    target = fixtures_root() / "triage.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def snapshot_files(slug: str) -> dict[str, str]:
    """Replay a monolith app from its snapshot fixture."""
    from terrarium_agents.tagged_files import TaggedFileParser

    manifest = json.loads((fixtures_root() / "manifest.json").read_text(encoding="utf-8"))
    app = next(item for item in manifest["apps"] if item["id"] == f"monolith/{slug}")
    record = json.loads((fixtures_root() / "records" / f"{app['hashes'][0]}.json").read_text(encoding="utf-8"))
    parser = TaggedFileParser()
    parser.feed(record["text"])
    return parser.finish()


def fixture_digest_for(system: str, user: str, model: str, params: dict) -> str:
    return request_hash("bedrock", model, system, user, params)
