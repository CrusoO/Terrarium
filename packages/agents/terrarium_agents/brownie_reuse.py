"""Turn accepted Brownie asset ids into files copied from published dashboard projects.

The caller supplies the published project versions (loaded from the user's
dashboard). Accepted asset files are copied byte for byte into
``src/reused/<project>/`` (or ``frontend/src/reused/...`` for full-stack builds),
and the Code Generator is told to write only the remaining files.
Copied content is treated as data: it is never executed here.
"""

from __future__ import annotations

import hashlib
import posixpath
import re
from collections.abc import Mapping
from dataclasses import dataclass, field

from terrarium_agents.brownie_projects import ASSETS, PROJECTS, BrownieAsset, target_path


@dataclass(frozen=True)
class PublishedProject:
    tool_id: str
    tool_name: str
    version_number: int
    files: Mapping[str, str]


@dataclass(frozen=True)
class ReusedFile:
    source_path: str
    target_path: str
    sha256: str


@dataclass(frozen=True)
class ReusedAsset:
    asset_id: str
    name: str
    version: str
    project_key: str
    project_name: str
    organization: str
    tool_id: str
    tool_name: str
    tool_version: int
    api: str
    files: tuple[ReusedFile, ...]


@dataclass(frozen=True)
class ReusePlan:
    applied: tuple[ReusedAsset, ...] = ()
    ignored: tuple[tuple[str, str], ...] = ()
    files: dict[str, str] = field(default_factory=dict)

    @property
    def applied_ids(self) -> list[str]:
        return [asset.asset_id for asset in self.applied]

    @property
    def ignored_ids(self) -> list[str]:
        return [asset_id for asset_id, _reason in self.ignored]

    def provenance(self) -> list[dict[str, object]]:
        return [
            {
                "assetId": asset.asset_id,
                "name": asset.name,
                "version": asset.version,
                "projectKey": asset.project_key,
                "projectName": asset.project_name,
                "organization": asset.organization,
                "toolId": asset.tool_id,
                "toolName": asset.tool_name,
                "toolVersion": asset.tool_version,
                "files": [
                    {"source": item.source_path, "target": item.target_path, "sha256": item.sha256}
                    for item in asset.files
                ],
            }
            for asset in self.applied
        ]


def sha256_text(body: str) -> str:
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def resolve_reuse(
    asset_ids: list[str] | None,
    *,
    published: Mapping[str, PublishedProject],
    backend_stack: str = "none",
    blocked: Mapping[str, str] | None = None,
) -> ReusePlan:
    """Resolve accepted ids against published projects, adding required dependencies first.

    ``blocked`` maps asset ids to the reason their published files fail the trust card.
    """
    blocked = blocked or {}
    if not asset_ids:
        return ReusePlan()
    applied: dict[str, ReusedAsset] = {}
    ignored: dict[str, str] = {}

    def refuse(asset_id: str, reason: str) -> None:
        ignored.setdefault(asset_id, reason)

    def add(asset_id: str, trail: tuple[str, ...] = ()) -> bool:
        if asset_id in applied:
            return True
        if asset_id in ignored or asset_id in trail:
            return False
        asset = ASSETS.get(asset_id)
        if asset is None:
            refuse(asset_id, "Not in the Brownie catalog.")
            return False
        if not asset.reusable:
            refuse(asset_id, asset.gate_reason or "Not approved for reuse.")
            return False
        if asset_id in blocked:
            refuse(asset_id, blocked[asset_id])
            return False
        if asset.stack == "sapui5" and backend_stack != "sap-cap":
            refuse(asset_id, "SAP parts need the SAP CAP backend in the new app.")
            return False
        for dependency in asset.depends_on:
            if not add(dependency, (*trail, asset_id)):
                needed = ASSETS[dependency].name if dependency in ASSETS else dependency
                refuse(asset_id, f"Needs {needed}, which could not be reused.")
                return False
        reused = _copy_asset(asset, published.get(asset.project_key), backend_stack)
        if isinstance(reused, str):
            refuse(asset_id, reused)
            return False
        applied[asset_id] = reused
        return True

    for asset_id in asset_ids:
        add(asset_id)
    files: dict[str, str] = {}
    for asset in applied.values():
        source = published[asset.project_key].files
        for item in asset.files:
            files[item.target_path] = source[item.source_path]
    return ReusePlan(applied=tuple(applied.values()), ignored=tuple(ignored.items()), files=files)


def _copy_asset(asset: BrownieAsset, project: PublishedProject | None, backend_stack: str) -> ReusedAsset | str:
    meta = PROJECTS[asset.project_key]
    if project is None:
        return f"{meta.name} is not published in your dashboard."
    copied: list[ReusedFile] = []
    for source in asset.files:
        body = project.files.get(source)
        if body is None:
            return f"{source} is missing from {project.tool_name} v{project.version_number}."
        copied.append(ReusedFile(source, target_path(asset, source, backend_stack), sha256_text(body)))
    return ReusedAsset(
        asset_id=asset.asset_id,
        name=asset.name,
        version=asset.version,
        project_key=asset.project_key,
        project_name=meta.name,
        organization=meta.organization,
        tool_id=project.tool_id,
        tool_name=project.tool_name,
        tool_version=project.version_number,
        api=asset.api,
        files=tuple(copied),
    )


_EXPORT_RE = re.compile(r"^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)", re.M)
_EXPORT_LIST_RE = re.compile(r"^export\s*\{([^}]*)\}", re.M)
_NAMED_IMPORT_RE = re.compile(
    r"""import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([^}]*)\}\s*from\s*['"](\.{1,2}/[^'"]+)['"]"""
)
_DEFAULT_IMPORT_RE = re.compile(r"""import\s+([A-Za-z_$][\w$]*)\s+from\s*['"](\.{1,2}/[^'"]+)['"]""")


def exported_names(body: str) -> set[str]:
    names = set(_EXPORT_RE.findall(body))
    for group in _EXPORT_LIST_RE.findall(body):
        for part in group.split(","):
            name = part.strip().split(" as ")[-1].strip()
            if name:
                names.add(name)
    if re.search(r"^export\s+default\b", body, re.M):
        names.add("default")
    return names


def import_path(from_path: str, to_path: str) -> str:
    relative = posixpath.relpath(to_path, posixpath.dirname(from_path) or ".")
    return relative if relative.startswith(".") else f"./{relative}"


def reuse_import_error(files: Mapping[str, str], plan: ReusePlan) -> str | None:
    """Report a generated import of a name the reused file does not export."""
    if not plan.files:
        return None
    exports = {path: exported_names(body) for path, body in plan.files.items()}
    for path, body in files.items():
        if path in plan.files or posixpath.splitext(path)[1] not in {".js", ".jsx", ".ts", ".tsx"}:
            continue
        base = posixpath.dirname(path)
        for match in _NAMED_IMPORT_RE.finditer(body):
            target = posixpath.normpath(posixpath.join(base, match.group(3)))
            if target not in exports:
                continue
            wanted = {part.strip().split(" as ")[0].strip() for part in match.group(2).split(",")}
            if match.group(1):
                wanted.add("default")
            missing = sorted(name for name in wanted if name and name not in exports[target])
            if missing:
                return f"{path} imports {', '.join(missing)} from {match.group(3)}, which exports only {', '.join(sorted(exports[target]))}"
        for match in _DEFAULT_IMPORT_RE.finditer(body):
            target = posixpath.normpath(posixpath.join(base, match.group(2)))
            if target in exports and "default" not in exports[target]:
                return f"{path} default-imports {match.group(2)}, which has no default export; use a named import"
    return None


def reuse_prompt_section(plan: ReusePlan) -> str:
    """Exact provided-versus-generate map for the Code Generator."""
    if not plan.applied:
        return ""
    app_path = next(iter(plan.files)).split("/reused/")[0] + "/App.jsx"
    lines = [
        "## Reused code from the user's published dashboard projects (already in the project)",
        "These files exist and are final. Do NOT output a file at any of these paths and do not edit them.",
        "Generate every other file the plan needs: package.json, index.html, vite config, main.jsx, App.jsx,",
        "the domain screens, data, and styles. Adapt behaviour through props. Import only the names listed.",
        "Each reused component imports its own CSS; do not import those CSS files again.",
        "",
        "### Provided (do not generate)",
    ]
    for asset in plan.applied:
        lines.append(f"- {asset.name} v{asset.version} from {asset.tool_name} v{asset.tool_version}: {asset.api}")
        for item in asset.files:
            body = plan.files[item.target_path]
            names = sorted(name for name in exported_names(body) if name != "default")
            if names:
                lines.append(
                    f"  - {item.target_path}: exports {', '.join(names)}. "
                    f"From {app_path} use: import {{ {', '.join(names)} }} from '{import_path(app_path, item.target_path)}';"
                )
            else:
                lines.append(f"  - {item.target_path}: stylesheet, already imported by its component.")
    lines += [
        "",
        "### Generate",
        "- Everything else, including the entry files and every screen that uses the provided modules.",
        "",
    ]
    for path, body in plan.files.items():
        if path.endswith(".css"):
            continue
        lines.append(f"<<<PROVIDED {path}>>>\n{body}<<<END PROVIDED>>>")
    lines.append("")
    return "\n".join(lines) + "\n"
