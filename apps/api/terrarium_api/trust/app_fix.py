"""Fix what the trust card found, using Terrarium itself.

Known problems are fixed with codemods that change only the lines involved.
Anything else (a failing business test, an unknown pattern) goes to the
Editor Agent as search/replace patches, with the failing checks as context.
The caller re-runs the trust card on the result; nothing here is trusted on
its own word.
"""

from __future__ import annotations

import difflib
import json
import logging
import posixpath
import re
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field

from terrarium_sandbox.trust.scanners import _CREDENTIAL_FILES

logger = logging.getLogger(__name__)

FileMap = dict[str, str]
Check = Mapping[str, object]


@dataclass
class Change:
    checkId: str
    name: str
    how: str
    summary: str
    files: list[str]


@dataclass
class FixOutcome:
    files: FileMap
    changes: list[Change] = field(default_factory=list)
    editor: dict[str, object] | None = None


def _evidence_files(check: Check) -> list[str]:
    items = check.get("evidence") or []
    return sorted({str(item.get("file")) for item in items if isinstance(item, dict) and item.get("file")})  # type: ignore[union-attr]


def _evidence_lines(check: Check) -> list[tuple[str, int | None]]:
    items = check.get("evidence") or []
    return [
        (str(item.get("file")), item.get("line") if isinstance(item.get("line"), int) else None)  # type: ignore[union-attr]
        for item in items
        if isinstance(item, dict) and item.get("file")
    ]


# --- Codemods -------------------------------------------------------------------------------

_AUTH_PROFILES = {"[development]": {"kind": "dummy"}, "[production]": {"kind": "xsuaa"}}


def _cap_auth(files: FileMap, check: Check) -> tuple[str, list[str]] | None:
    changed: list[str] = []
    for path, line in sorted(set(_evidence_lines(check)), key=lambda item: (item[0], -(item[1] or 0))):
        body = files.get(path)
        if body is None or line is None:
            continue
        lines = body.split("\n")
        lines.insert(line - 1, "@requires: 'authenticated-user'")
        files[path] = "\n".join(lines)
        changed.append(path)
    if not changed:
        return None
    for path in sorted(set(changed)):
        root = path.split("/srv/")[0] if "/srv/" in path else ""
        rc = posixpath.join(root, ".cdsrc.json") if root else ".cdsrc.json"
        try:
            config = json.loads(files[rc]) if rc in files else {}
        except json.JSONDecodeError:
            continue
        requires = config.setdefault("requires", {})
        if "auth" not in requires:
            requires["auth"] = dict(_AUTH_PROFILES)
            files[rc] = json.dumps(config, indent=2) + "\n"
            changed.append(rc)
    return "Added @requires: 'authenticated-user' to the service, with dummy auth locally and XSUAA in production.", sorted(set(changed))


_UPDATE_TEMPLATE = re.compile(
    r"cds\.run\(\s*`UPDATE\s+(\w+)\s+SET\s+(\w+)\s*=\s*\$\{(\w+)\}\s+WHERE\s+(\w+)\s*=\s*'\$\{(\w+)\}'\s*`\s*\)"
)
_SELECT_WHERE = re.compile(r"\.where\(\s*`(\w+)\s*=\s*'\$\{(\w+)\}'\s*`\s*\)")


def _entity_name(table: str) -> str:
    parts = table.split("_")
    return ".".join(parts) if len(parts) > 1 else table


def _string_query(files: FileMap, check: Check) -> tuple[str, list[str]] | None:
    changed: list[str] = []
    for path in _evidence_files(check):
        body = files.get(path)
        if body is None:
            continue
        updated = _UPDATE_TEMPLATE.sub(
            lambda m: f"cds.run(UPDATE.entity('{_entity_name(m.group(1))}').set({{ {m.group(2)}: {m.group(3)} }}).where({{ {m.group(4)}: {m.group(5)} }}))",
            body,
        )
        updated = _SELECT_WHERE.sub(lambda m: f".where({{ {m.group(1)}: {m.group(2)} }})", updated)
        if updated == body:
            return None
        if "UPDATE.entity(" in updated and "cds.ql" not in updated:
            updated = updated.replace(
                "const cds = require('@sap/cds');\n",
                "const cds = require('@sap/cds');\nconst { UPDATE } = cds.ql;\n",
                1,
            )
        files[path] = updated
        changed.append(path)
    if not changed:
        return None
    return "Rewrote the query with the CQL builder, so the bin and quantity are passed as parameters.", changed


_ENV_REQUIRE = re.compile(r"""require\(\s*(['"])((?:\.\.?/)+(?:[\w.-]+/)*)(?P<name>default-env\.json|vcap-services\.json)\1\s*\)""")


def _secrets(files: FileMap, check: Check) -> tuple[str, list[str]] | None:
    targets = [path for path in _evidence_files(check) if posixpath.basename(path) in _CREDENTIAL_FILES]
    if not targets or len(targets) != len(_evidence_files(check)):
        return None
    changed: list[str] = []
    for path in targets:
        files.pop(path, None)
        changed.append(path)
    for path, body in list(files.items()):
        updated = _ENV_REQUIRE.sub("{ destinations: JSON.parse(process.env.destinations || '[]') }", body)
        if updated != body:
            files[path] = updated
            changed.append(path)
    ignore = files.get(".gitignore", "")
    lines = [line for line in ignore.splitlines() if line.strip()]
    for path in targets:
        if path not in lines:
            lines.append(path)
    files[".gitignore"] = "\n".join(lines) + "\n"
    changed.append(".gitignore")
    names = ", ".join(posixpath.basename(path) for path in targets)
    return (
        f"Removed {names} from the app and ignored it in git. The destination now comes from the "
        "destinations environment variable, which is how BTP supplies it.",
        changed,
    )


_ADVISORY_FIX = re.compile(r"first fixed version", re.I)


def _dependencies(files: FileMap, check: Check, fixed: Mapping[str, str]) -> tuple[str, list[str]] | None:
    changed: list[str] = []
    raised: list[str] = []
    for path in _evidence_files(check):
        try:
            manifest = json.loads(files.get(path, ""))
        except json.JSONDecodeError:
            continue
        for section in ("dependencies", "devDependencies"):
            deps = manifest.get(section) or {}
            for name, version in fixed.items():
                if name in deps:
                    deps[name] = f"^{version}"
                    raised.append(f"{name} {version}")
        files[path] = json.dumps(manifest, indent=2) + "\n"
        changed.append(path)
    if not raised:
        return None
    return f"Raised {', '.join(sorted(set(raised)))}.", changed


def _payload_logging(files: FileMap, check: Check) -> tuple[str, list[str]] | None:
    changed: list[str] = []
    for path in _evidence_files(check):
        lines = files.get(path, "").split("\n")
        kept = [line for line in lines if not re.search(r"console\.(?:log|info|debug|warn)\([^\n]*\breq\.(?:data|body|headers)\b", line)]
        if len(kept) != len(lines):
            files[path] = "\n".join(kept)
            changed.append(path)
    if not changed:
        return None
    return "Removed the line that printed the whole request payload.", changed


# --- Editor Agent --------------------------------------------------------------------------


def _editor_prompt(checks: list[Check]) -> str:
    lines = [
        "Fix these failing trust card checks. Change only what is needed so each one passes.",
        "Keep every exported function name and return shape. Do not edit any test file.",
        "",
    ]
    for index, check in enumerate(checks, start=1):
        where = ", ".join(
            f"{file}:{line}" if line else file for file, line in _evidence_lines(check)
        ) or ", ".join(str(item) for item in check.get("related") or [])  # type: ignore[union-attr]
        lines.append(f"{index}. [{check.get('kind')}] {check.get('name')} ({where})")
        lines.append(f"   Result: {check.get('detail')}")
        related = [str(item) for item in check.get("related") or [] if "/test/" not in f"/{item}"]  # type: ignore[union-attr]
        if related:
            lines.append(f"   Code under test: {', '.join(related)}")
    return "\n".join(lines)


def _editor_files(files: FileMap, checks: list[Check]) -> FileMap:
    wanted: list[str] = []
    for check in checks:
        wanted += [str(item) for item in check.get("related") or []]  # type: ignore[union-attr]
        wanted += _evidence_files(check)
    return {path: files[path] for path in dict.fromkeys(wanted) if path in files}


def run_editor_fix(files: FileMap, checks: list[Check]) -> tuple[FileMap, dict[str, object]]:
    from terrarium_agents.editor import EditorAgentError, run_editor  # noqa: PLC0415
    from terrarium_agents.llm import agents_mode, editor_model  # noqa: PLC0415
    from terrarium_contracts import AgentJob, ErrorContext, Intent  # noqa: PLC0415

    if agents_mode() == "stub":
        return {}, {"used": False, "error": "Coding models are off (TERRARIUM_AGENTS=stub)."}
    subset = _editor_files(files, checks)
    if not subset:
        return {}, {"used": False, "error": "No files to send to the editor."}
    prompt = _editor_prompt(checks)
    job = AgentJob(
        sessionId="trust-fix",
        intent=Intent(kind="modify", stack="fullstack", summary="Fix failing trust card checks"),
        prompt=prompt,
        files=subset,
        errorContext=ErrorContext(logs=prompt, health="unhealthy", healAttempt=1),
    )
    try:
        result = run_editor(job)
    except EditorAgentError as error:
        logger.warning("Trust fix editor failed: %s", error)
        return {}, {"used": True, "model": editor_model(), "error": str(error)[:300]}
    changed = {
        path: body
        for path, body in result.files.items()
        if path in subset and "/test/" not in f"/{path}" and body != files.get(path)
    }
    return changed, {"used": True, "model": editor_model(), "commitMessage": result.commitMessage}


# --- Orchestration --------------------------------------------------------------------------

Codemod = Callable[[FileMap, Check], "tuple[str, list[str]] | None"]


def fix_all(
    files: Mapping[str, str],
    failed: list[Check],
    *,
    advisories: Mapping[str, str] | None = None,
    editor: Callable[[FileMap, list[Check]], tuple[FileMap, dict[str, object]]] | None = None,
) -> FixOutcome:
    """Apply codemods first, then one Editor Agent pass for whatever is left."""
    current: FileMap = dict(files)
    outcome = FixOutcome(files=current)
    codemods: dict[str, Codemod] = {
        "cap-authorization": _cap_auth,
        "string-queries": _string_query,
        "secrets": _secrets,
        "payload-logging": _payload_logging,
        "dependencies": lambda target, check: _dependencies(target, check, advisories or {}),
    }
    for_editor: list[Check] = []
    for check in failed:
        if not check.get("fix"):
            continue
        codemod = codemods.get(str(check.get("id")))
        result = codemod(current, check) if codemod else None
        if result is None:
            for_editor.append(check)
            continue
        summary, touched = result
        outcome.changes.append(Change(str(check["id"]), str(check["name"]), "codemod", summary, touched))
    if for_editor:
        patched, meta = (editor or run_editor_fix)(current, for_editor)
        patched = {path: body for path, body in patched.items() if path in current and "/test/" not in f"/{path}"}
        outcome.editor = meta
        if patched:
            current.update(patched)
            for check in for_editor:
                touched = [path for path in patched if path in (check.get("related") or []) or path in _evidence_files(check)]
                outcome.changes.append(
                    Change(
                        str(check["id"]),
                        str(check["name"]),
                        "editor",
                        f"Editor Agent ({meta.get('model')}) patched the code under test.",
                        touched or sorted(patched),
                    )
                )
    return outcome


def file_diffs(before: Mapping[str, str], after: Mapping[str, str], limit: int = 80) -> list[dict[str, object]]:
    diffs: list[dict[str, object]] = []
    for path in sorted(set(before) | set(after)):
        old, new = before.get(path), after.get(path)
        if old == new:
            continue
        lines = list(
            difflib.unified_diff(
                (old or "").splitlines(),
                (new or "").splitlines(),
                fromfile=f"a/{path}" if old is not None else "/dev/null",
                tofile=f"b/{path}" if new is not None else "/dev/null",
                lineterm="",
                n=2,
            )
        )
        diffs.append(
            {
                "path": path,
                "status": "added" if old is None else "deleted" if new is None else "modified",
                "diff": "\n".join(lines[:limit]) + ("\n…" if len(lines) > limit else ""),
            }
        )
    return diffs
