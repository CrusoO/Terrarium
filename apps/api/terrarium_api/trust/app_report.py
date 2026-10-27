"""Trust card for a published app: tests, security checks, findings, and a health score.

Functional and security checks read the app's own files. Unit tests in the app
(``*.test.js`` under a ``test`` folder) run for real with ``node --test`` in the
sandbox Node image, without network access. Scanner findings come from the
same scanner the publish gate uses. Every failed check names the file and line,
the root problem it belongs to, and whether Terrarium can fix it.
"""

from __future__ import annotations

import io
import json
import logging
import posixpath
import re
import shlex
import tarfile
import time
from collections import OrderedDict
from collections.abc import Callable, Mapping
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone

from terrarium_contracts import VulnerabilityFinding
from terrarium_sandbox import config as sandbox_config
from terrarium_sandbox.trust import scan, vuln_db_version
from terrarium_sandbox.trust.scanners import _CODE_RULES, _CREDENTIAL_FILES, _CREDENTIAL_VALUE, _SECRET_PATTERNS

from terrarium_api.trust.file_hash import file_map_hash

logger = logging.getLogger(__name__)

FileMap = Mapping[str, str]

ROOT_PROBLEMS: dict[str, dict[str, str]] = {
    "duplicate-custom-code": {
        "title": "The same custom code is rebuilt in every project",
        "detail": "Approval routing, status colours, and audit trails are written again for each Fiori app, so a fix lands in one copy and not the others. Brownie reuses the published module instead.",
    },
    "late-authorization": {
        "title": "Authorization is added at the end, or not at all",
        "detail": "CAP services go live without @requires or @restrict, so anyone who reaches the URL can read or change data.",
    },
    "credentials-in-config": {
        "title": "System credentials sit in config files",
        "detail": "S/4HANA destination users and passwords are kept in default-env.json and end up in the repository.",
    },
    "string-built-queries": {
        "title": "Queries are built from strings",
        "detail": "CQL or SQL text with request values pasted in lets a caller change what the query does.",
    },
    "segregation-of-duties": {
        "title": "The same person can request and approve",
        "detail": "Approval rules that do not stop a requester from approving their own request fail an audit.",
    },
    "unpatched-dependencies": {
        "title": "SAP libraries stay on versions with known advisories",
        "detail": "Security notes for @sap/xssec and similar packages are published, but the version in package.json is never raised.",
    },
    "untested-business-rules": {
        "title": "Business rules ship without tests",
        "detail": "Tolerances and thresholds are changed by hand, and nobody notices when an edge case breaks.",
    },
    "data-in-logs": {
        "title": "Request data is written to logs",
        "detail": "Whole request payloads, which can hold personal or financial data, are printed to application logs.",
    },
}

_PENALTY = {"critical": 35, "high": 20, "medium": 8, "low": 3, "info": 0}
_FUNCTIONAL_PENALTY = 10
_SEVERITY_ORDER = ("critical", "high", "medium", "low", "info")


@dataclass
class Evidence:
    file: str
    line: int | None = None
    snippet: str = ""


@dataclass
class Check:
    id: str
    kind: str
    name: str
    status: str
    severity: str
    detail: str
    source: str
    rootProblem: str | None = None
    evidence: list[Evidence] = field(default_factory=list)
    related: list[str] = field(default_factory=list)
    fix: str | None = None
    fixSummary: str = ""


@dataclass
class TestCase:
    name: str
    ok: bool
    skipped: bool = False
    error: str = ""
    line: int | None = None
    duration_ms: float | None = None


@dataclass
class TestRun:
    status: str
    detail: str = ""
    duration_ms: int = 0
    results: dict[str, list[TestCase]] = field(default_factory=dict)


TestRunner = Callable[[FileMap, list[str]], TestRun]


def _line_at(content: str, index: int) -> int:
    return content.count("\n", 0, max(0, index)) + 1


def _line_text(content: str, line: int) -> str:
    lines = content.splitlines()
    return lines[line - 1].strip()[:160] if 0 < line <= len(lines) else ""


def _mask(snippet: str) -> str:
    return re.sub(r'(:\s*")[^"]{2,}(")', r"\1••••••\2", snippet)


def _check(id: str, kind: str, name: str, *, source: str, root: str | None = None, severity: str = "medium") -> Check:
    return Check(id=id, kind=kind, name=name, status="passed", severity=severity, detail="", source=source, rootProblem=root)


# --- Static functional checks --------------------------------------------------------------

_ENTRY_PAGES = (
    "index.html",
    "src/index.html",
    "webapp/index.html",
    "frontend/index.html",
    "frontend/src/index.html",
    "frontend/webapp/index.html",
)
_IMPORT_RE = re.compile(
    r"""(?:import\s[^'"]*?from\s*|import\s*|export\s[^'"]*?from\s*|require\(\s*)(['"])(\.{1,2}/[^'"]+)\1"""
)
_RESOLVE_SUFFIXES = ("", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", "/index.js", "/index.jsx", "/index.ts")


def _json_check(files: FileMap) -> Check:
    check = _check("json-valid", "functional", "Config and manifest files parse", source="static")
    for path, body in files.items():
        name = posixpath.basename(path)
        if not path.endswith(".json") or name.startswith("tsconfig"):
            continue
        try:
            json.loads(body)
        except json.JSONDecodeError as exc:
            check.evidence.append(Evidence(path, exc.lineno, exc.msg))
    if check.evidence:
        check.status, check.severity, check.fix = "failed", "high", "editor"
        check.detail = f"{len(check.evidence)} JSON file(s) do not parse, so the app cannot start."
        check.fixSummary = "Repair the JSON so the file parses."
    else:
        check.detail = "Every JSON file parses."
    return check


def _entry_check(files: FileMap) -> Check:
    check = _check("entry-page", "functional", "The app has an entry page", source="static")
    found = next((path for path in _ENTRY_PAGES if path in files), None)
    if found:
        check.detail = f"Starts from {found}."
    else:
        check.status, check.severity = "failed", "high"
        check.detail = "No index.html was found, so there is nothing to open."
    return check


def _resolves(base: str, target: str, files: FileMap) -> bool:
    joined = posixpath.normpath(posixpath.join(base, target))
    return any(f"{joined}{suffix}" in files for suffix in _RESOLVE_SUFFIXES)


def _imports_check(files: FileMap) -> Check:
    check = _check("imports-resolve", "functional", "Local imports point at files that exist", source="static")
    for path, body in files.items():
        if posixpath.splitext(path)[1] not in {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}:
            continue
        base = posixpath.dirname(path)
        for match in _IMPORT_RE.finditer(body):
            target = match.group(2)
            if not _resolves(base, target, files):
                line = _line_at(body, match.start())
                check.evidence.append(Evidence(path, line, f"{target} is missing"))
    if check.evidence:
        check.status, check.severity, check.fix = "failed", "high", "editor"
        check.detail = f"{len(check.evidence)} import(s) point at files that are not in the app."
        check.fixSummary = "Point the import at the right file or add the missing module."
        check.related = sorted({item.file for item in check.evidence})
    else:
        check.detail = "Every relative import and require resolves."
    return check


def _manifest_checks(files: FileMap) -> list[Check]:
    checks: list[Check] = []
    for path, body in files.items():
        if not path.endswith("webapp/manifest.json"):
            continue
        check = _check("ui5-root-view", "functional", "The Fiori manifest opens a view that exists", source="static")
        try:
            manifest = json.loads(body)
            app_id = str(manifest["sap.app"]["id"])
            view = str(manifest["sap.ui5"]["rootView"]["viewName"])
        except (json.JSONDecodeError, KeyError, TypeError):
            check.status, check.severity = "failed", "high"
            check.detail = "The manifest has no sap.app id or sap.ui5 rootView."
            check.evidence.append(Evidence(path))
            checks.append(check)
            continue
        webapp = posixpath.dirname(path)
        rel = view[len(app_id) + 1 :] if view.startswith(app_id + ".") else view
        target = posixpath.join(webapp, rel.replace(".", "/") + ".view.xml")
        if target in files:
            check.detail = f"Root view {view} is {target}."
        else:
            check.status, check.severity = "failed", "high"
            check.detail = f"Root view {view} should be {target}, which is missing."
            check.evidence.append(Evidence(path))
        checks.append(check)
    return checks


_SERVICE_RE = re.compile(r"^\s*service\s+(\w+)", re.M)


def _cds_files(files: FileMap) -> list[str]:
    return sorted(path for path in files if path.endswith(".cds") and "/srv/" in f"/{path}")


def _cap_impl_check(files: FileMap) -> Check | None:
    services = [path for path in _cds_files(files) if _SERVICE_RE.search(files[path])]
    if not services:
        return None
    check = _check("cap-handlers", "functional", "Every CAP service has a handler file", source="static")
    for path in services:
        handler = path[: -len(".cds")] + ".js"
        if handler not in files:
            check.evidence.append(Evidence(path, None, f"{posixpath.basename(handler)} is missing"))
    if check.evidence:
        check.status, check.severity = "failed", "medium"
        check.detail = "A service has no handler, so it serves empty entities."
    else:
        check.detail = f"{len(services)} service(s), each with its handler."
    return check


# --- Static security checks ----------------------------------------------------------------


def _cap_auth_check(files: FileMap) -> Check | None:
    paths = _cds_files(files)
    if not any(_SERVICE_RE.search(files[path]) for path in paths):
        return None
    check = _check(
        "cap-authorization",
        "security",
        "Every CAP service requires a signed-in user",
        source="static",
        root="late-authorization",
        severity="high",
    )
    for path in paths:
        body = files[path]
        for match in _SERVICE_RE.finditer(body):
            preamble = body[: match.start()]
            preamble = preamble[preamble.rfind("}") + 1 :]
            if "@requires" in preamble or "@restrict" in preamble:
                continue
            line = _line_at(body, match.start(1))
            check.evidence.append(Evidence(path, line, _line_text(body, line)))
    if check.evidence:
        check.status, check.fix = "failed", "codemod"
        check.detail = (
            f"{len(check.evidence)} CAP service(s) have no @requires or @restrict, "
            "so anyone who can reach the URL reads and changes data."
        )
        check.fixSummary = "Add @requires: 'authenticated-user' and turn on dummy auth for local runs, XSUAA in production."
    else:
        check.detail = "Every CAP service declares who may call it."
    return check


_PAYLOAD_LOG = re.compile(r"console\.(?:log|info|debug|warn)\([^\n]*\breq\.(?:data|body|headers)\b[^\n]*")


def _payload_log_check(files: FileMap) -> Check:
    check = _check(
        "payload-logging",
        "security",
        "Request payloads are not written to logs",
        source="static",
        root="data-in-logs",
        severity="medium",
    )
    for path, body in files.items():
        if posixpath.splitext(path)[1] not in {".js", ".ts", ".mjs", ".cjs"} or "/test/" in f"/{path}":
            continue
        for match in _PAYLOAD_LOG.finditer(body):
            line = _line_at(body, match.start())
            check.evidence.append(Evidence(path, line, _line_text(body, line)))
    if check.evidence:
        check.status, check.fix = "failed", "codemod"
        check.detail = "Whole request payloads are printed, which can leak personal or financial data into logs."
        check.fixSummary = "Remove the payload logging."
    else:
        check.detail = "No handler prints request payloads."
    return check


@dataclass(frozen=True)
class _ScannerCheck:
    id: str
    name: str
    root: str | None
    matches: Callable[[VulnerabilityFinding], bool]
    fix: str
    fix_summary: str


_SCANNER_CHECKS = (
    _ScannerCheck(
        "secrets",
        "No passwords or keys in the code",
        "credentials-in-config",
        lambda finding: finding.source == "gitleaks",
        "codemod",
        "Move the credentials to the environment (the destinations variable) and stop committing the config file.",
    ),
    _ScannerCheck(
        "string-queries",
        "Queries use parameters, not pasted strings",
        "string-built-queries",
        lambda finding: finding.rule == "string-sql",
        "codemod",
        "Rewrite the query with the CQL builder so values are passed as parameters.",
    ),
    _ScannerCheck(
        "dependencies",
        "Dependencies have no published advisories",
        "unpatched-dependencies",
        lambda finding: finding.source == "osv",
        "codemod",
        "Raise the package to the first fixed version.",
    ),
    _ScannerCheck(
        "dynamic-code",
        "No dynamic code execution",
        None,
        lambda finding: finding.rule == "eval-new-function",
        "editor",
        "Replace eval or new Function with ordinary code.",
    ),
    _ScannerCheck(
        "html-injection",
        "No unescaped HTML from data",
        None,
        lambda finding: finding.rule in {"dangerous-inner-html", "inner-html-from-input"},
        "editor",
        "Render text instead of raw HTML.",
    ),
    _ScannerCheck(
        "outside-calls",
        "No calls to outside servers from the app",
        None,
        lambda finding: finding.rule == "external-fetch",
        "editor",
        "Call the app's own API instead of an outside server.",
    ),
)

_RULE_PATTERNS = {rule_id: pattern for rule_id, pattern, _severity, _title in _CODE_RULES}


def _locate_finding(finding: VulnerabilityFinding, files: FileMap) -> Evidence:
    if finding.source == "osv" and finding.packageName:
        for path in ("package.json", "frontend/package.json", "backend/package.json"):
            body = files.get(path, "")
            index = body.find(f'"{finding.packageName}"')
            if index >= 0:
                line = _line_at(body, index)
                return Evidence(path, line, _line_text(body, line))
        return Evidence("package.json")
    path = finding.file or ""
    body = files.get(path, "")
    match = None
    if finding.rule in _RULE_PATTERNS:
        match = _RULE_PATTERNS[finding.rule].search(body)  # type: ignore[union-attr]
    elif finding.source == "gitleaks":
        match = _CREDENTIAL_VALUE.search(body) or next(
            (hit for pattern in _SECRET_PATTERNS if (hit := pattern.search(body))), None
        )
    if match is None:
        return Evidence(path)
    line = _line_at(body, match.start())
    snippet = _line_text(body, line)
    return Evidence(path, line, _mask(snippet) if finding.source == "gitleaks" else snippet)


def _scanner_checks(findings: list[VulnerabilityFinding], files: FileMap) -> list[Check]:
    checks: list[Check] = []
    for spec in _SCANNER_CHECKS:
        hits = [finding for finding in findings if spec.matches(finding)]
        check = _check(spec.id, "security", spec.name, source="scanner", root=spec.root, severity="high")
        if hits:
            check.status = "failed"
            check.severity = min((hit.severity for hit in hits), key=_SEVERITY_ORDER.index)
            check.evidence = [_locate_finding(hit, files) for hit in hits]
            titles = sorted({hit.title + (f" ({hit.advisoryId})" if hit.advisoryId else "") for hit in hits})
            check.detail = "; ".join(titles)
            check.fix, check.fixSummary = spec.fix, spec.fix_summary
            related = {item.file for item in check.evidence if item.file}
            for name in {posixpath.basename(path) for path in related} & set(_CREDENTIAL_FILES):
                related |= {
                    path for path, body in files.items() if path.endswith((".js", ".ts", ".cjs", ".mjs")) and name in body
                }
            check.related = sorted(related)
        else:
            check.detail = "Nothing found."
        checks.append(check)
    return checks


# --- Unit tests in the app -------------------------------------------------------------------

_TEST_FILE = re.compile(r"(?:^|/)(?:test|tests|__tests__)/[^/]+\.test\.(?:c?js|mjs)$")
_META = re.compile(r"//\s*terrarium:\s*(.+)")
_TAP_LINE = re.compile(r"^(not ok|ok) \d+ - (.+?)(?: # (SKIP|TODO)\b.*)?$")
_FILE_MARK = "### TERRARIUM FILE "


def test_files(files: FileMap) -> list[str]:
    return sorted(path for path in files if _TEST_FILE.search(path) and "node_modules/" not in path)[:20]


def _test_meta(body: str) -> dict[str, str]:
    match = _META.search(body)
    if not match:
        return {}
    return dict(part.split("=", 1) for part in match.group(1).split() if "=" in part)


def parse_tap(output: str) -> dict[str, list[TestCase]]:
    results: dict[str, list[TestCase]] = {}
    current: list[TestCase] | None = None
    lines = output.splitlines()
    for index, line in enumerate(lines):
        if line.startswith(_FILE_MARK):
            current = results.setdefault(line[len(_FILE_MARK) :].strip(), [])
            continue
        match = _TAP_LINE.match(line)
        if current is None or not match:
            continue
        case = TestCase(name=match.group(2), ok=match.group(1) == "ok", skipped=match.group(3) == "SKIP")
        block: list[str] = []
        for follow in lines[index + 1 :]:
            if _TAP_LINE.match(follow) or follow.startswith("# Subtest") or follow.startswith(_FILE_MARK):
                break
            block.append(follow)
        fields: dict[str, str] = {}
        for position, text in enumerate(block):
            stripped = text.strip()
            for name in ("expected", "actual"):
                if stripped.startswith(f"{name}:"):
                    fields[name] = stripped[len(name) + 1 :].strip()
            if stripped.startswith("duration_ms:"):
                try:
                    case.duration_ms = float(stripped.split(":", 1)[1])
                except ValueError:
                    pass
            elif stripped.startswith("location:"):
                found = re.search(r":(\d+):\d+'?$", stripped)
                case.line = int(found.group(1)) if found else None
            elif stripped.startswith("error:") and not case.ok:
                value = stripped[len("error:") :].strip()
                if value in {"|-", "|", ">-"}:
                    first = next((extra.strip() for extra in block[position + 1 :] if extra.strip()), "")
                    value = first
                case.error = value.strip("'\"")[:400]
        if not case.ok and "expected" in fields and "actual" in fields:
            lead = case.error.rstrip(":") if case.error else "Assertion failed"
            case.error = f"{lead}: expected {fields['expected']}, got {fields['actual']}"[:400]
        current.append(case)
    return results


def docker_test_runner(files: FileMap, paths: list[str]) -> TestRun:
    """Run each test file with node --test inside the sandbox image, without network."""
    started = time.monotonic()
    try:
        import docker  # noqa: PLC0415

        client = docker.from_env()
    except Exception as error:  # noqa: BLE001
        return TestRun(status="unavailable", detail=f"Docker is not reachable: {error}")
    script = "ln -sfn /opt/terrarium/node_modules /work/node_modules; cd /work; " + " ".join(
        f"echo {shlex.quote(_FILE_MARK + path)}; node --test --test-reporter=tap {shlex.quote(path)};" for path in paths
    )
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w") as archive:
        for path, body in files.items():
            if not path.endswith((".js", ".cjs", ".mjs", ".json")) or path.startswith("/") or ".." in path:
                continue
            data = body.encode("utf-8")
            info = tarfile.TarInfo(f"work/{path}")
            info.size = len(data)
            info.mode = 0o644
            archive.addfile(info, io.BytesIO(data))
    container = None
    try:
        container = client.containers.create(
            sandbox_config.NODE_IMAGE,
            entrypoint=["sh", "-lc"],
            command=[script],
            working_dir="/",
            network_disabled=True,
            mem_limit="384m",
            nano_cpus=1_000_000_000,
            labels={"terrarium.role": "trust-tests"},
        )
        container.put_archive("/", buffer.getvalue())
        container.start()
        container.wait(timeout=90)
        output = container.logs().decode("utf-8", errors="replace")
    except Exception as error:  # noqa: BLE001
        logger.warning("Trust test run failed to start: %s", error)
        return TestRun(status="unavailable", detail=f"The test container could not run: {error}")
    finally:
        if container is not None:
            try:
                container.remove(force=True)
            except Exception:  # noqa: BLE001
                pass
    return TestRun(
        status="ran",
        detail=f"node --test in {sandbox_config.NODE_IMAGE}, no network",
        duration_ms=int((time.monotonic() - started) * 1000),
        results=parse_tap(output),
    )


def _required_files(path: str, files: FileMap) -> list[str]:
    body = files.get(path, "")
    base = posixpath.dirname(path)
    found = []
    for match in _IMPORT_RE.finditer(body):
        joined = posixpath.normpath(posixpath.join(base, match.group(2)))
        target = next((f"{joined}{suffix}" for suffix in _RESOLVE_SUFFIXES if f"{joined}{suffix}" in files), None)
        if target:
            found.append(target)
    return found


def _test_checks(files: FileMap, run: TestRun, paths: list[str]) -> list[Check]:
    if not paths:
        check = _check("unit-tests", "functional", "Business rules have automated tests", source="node:test", root="untested-business-rules")
        check.status = "skipped"
        check.detail = "This app has no automated tests yet."
        return [check]
    if run.status != "ran":
        check = _check("unit-tests", "functional", f"{len(paths)} test file(s) found", source="node:test", root="untested-business-rules")
        check.status, check.detail = "skipped", run.detail or "The test runner is not available."
        return [check]
    checks: list[Check] = []
    for path in paths:
        meta = _test_meta(files.get(path, ""))
        kind = "security" if meta.get("kind") == "security" else "functional"
        root = meta.get("root") or "untested-business-rules"
        cases = run.results.get(path, [])
        related = [path, *_required_files(path, files)]
        if not cases:
            check = _check(f"test:{path}", kind, f"{posixpath.basename(path)} runs", source="node:test", root=root)
            check.status, check.severity, check.fix = "failed", "high", "editor"
            check.detail = "The test file did not report any results. It may not load."
            check.evidence, check.related = [Evidence(path)], related
            checks.append(check)
            continue
        for case in cases:
            check = _check(
                f"test:{path}:{case.name}",
                kind,
                case.name,
                source="node:test",
                root=root,
                severity=meta.get("severity") or ("high" if kind == "security" else "medium"),
            )
            check.related = related
            if case.skipped:
                check.status, check.detail = "skipped", "Marked as skipped in the test file."
            elif case.ok:
                check.detail = f"Passed in {case.duration_ms:.1f} ms." if case.duration_ms is not None else "Passed."
            else:
                check.status, check.fix = "failed", "editor"
                check.detail = case.error or "The assertion failed."
                check.evidence = [Evidence(path, case.line, _line_text(files.get(path, ""), case.line or 0))]
                check.fixSummary = "Fix the code under test so the rule holds. The test is left unchanged."
            checks.append(check)
    return checks


# --- Report -------------------------------------------------------------------------------------


def score_checks(checks: list[Check]) -> tuple[int, str, str]:
    penalty = 0
    for check in checks:
        if check.status != "failed":
            continue
        penalty += _PENALTY.get(check.severity, 8) if check.kind == "security" else _FUNCTIONAL_PENALTY
    score = max(0, 100 - penalty)
    grade = "A" if score >= 90 else "B" if score >= 75 else "C" if score >= 60 else "D" if score >= 40 else "F"
    failed = [check for check in checks if check.status == "failed"]
    if any(check.kind == "security" and check.severity in {"critical", "high"} for check in failed):
        status = "unsafe"
    elif failed:
        status = "attention"
    else:
        status = "healthy"
    return score, grade, status


def _counts(checks: list[Check], kind: str) -> dict[str, int]:
    scoped = [check for check in checks if check.kind == kind]
    return {
        "passed": sum(check.status == "passed" for check in scoped),
        "failed": sum(check.status == "failed" for check in scoped),
        "skipped": sum(check.status == "skipped" for check in scoped),
        "total": len(scoped),
    }


def _headline(status: str, checks: list[Check], fixable: int) -> str:
    failed = [check for check in checks if check.status == "failed"]
    if not failed:
        return "Every test and security check passes."
    security = sum(check.kind == "security" for check in failed)
    tests = len(failed) - security
    parts = []
    if security:
        parts.append(f"{security} security check{'s' if security != 1 else ''} fail{'s' if security == 1 else ''}")
    if tests:
        parts.append(f"{tests} test{'s' if tests != 1 else ''} fail{'s' if tests == 1 else ''}")
    lead = " and ".join(parts)
    if fixable == len(failed):
        return f"{lead[0].upper()}{lead[1:]}. Terrarium can fix all of them."
    return f"{lead[0].upper()}{lead[1:]}. Terrarium can fix {fixable} of {len(failed)}."


_CACHE: OrderedDict[str, dict[str, object]] = OrderedDict()
_CACHE_SIZE = 64


def build_report(
    files: FileMap,
    *,
    tool_id: str,
    version_id: str,
    version_number: int,
    runner: TestRunner | None = None,
    use_cache: bool = True,
) -> dict[str, object]:
    key = f"{file_map_hash(dict(files))}:{vuln_db_version()}"
    if use_cache and key in _CACHE:
        _CACHE.move_to_end(key)
        return {**_CACHE[key], "toolId": tool_id, "versionId": version_id, "versionNumber": version_number}

    findings, _secrets, _code = scan(dict(files), tool_id=tool_id, version_id=version_id)
    paths = test_files(files)
    run = (runner or docker_test_runner)(files, paths) if paths else TestRun(status="none", detail="No test files")

    checks: list[Check] = []
    checks += _test_checks(files, run, paths)
    checks += [_json_check(files), _entry_check(files), _imports_check(files), *_manifest_checks(files)]
    impl = _cap_impl_check(files)
    if impl:
        checks.append(impl)
    auth = _cap_auth_check(files)
    if auth:
        checks.append(auth)
    checks += _scanner_checks(findings, files)
    checks.append(_payload_log_check(files))

    score, grade, status = score_checks(checks)
    failed = [check for check in checks if check.status == "failed"]
    fixable = sum(1 for check in failed if check.fix)
    vulnerabilities = {severity: 0 for severity in ("critical", "high", "medium", "low")}
    for check in failed:
        if check.kind == "security" and check.severity in vulnerabilities:
            vulnerabilities[check.severity] += 1
    failing_roots = {check.rootProblem for check in failed if check.rootProblem}
    covered_roots = {check.rootProblem for check in checks if check.rootProblem}
    report: dict[str, object] = {
        "toolId": tool_id,
        "versionId": version_id,
        "versionNumber": version_number,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "score": score,
        "grade": grade,
        "status": status,
        "headline": _headline(status, checks, fixable),
        "tests": _counts(checks, "functional"),
        "security": _counts(checks, "security"),
        "vulnerabilities": vulnerabilities,
        "fixable": fixable,
        "testRunner": {"status": run.status, "detail": run.detail, "durationMs": run.duration_ms, "files": paths},
        "rootProblems": [
            {"id": root_id, **ROOT_PROBLEMS[root_id], "status": "failing" if root_id in failing_roots else "covered"}
            for root_id in ROOT_PROBLEMS
            if root_id in covered_roots
        ],
        "checks": [asdict(check) for check in sorted(checks, key=_check_order)],
    }
    _CACHE[key] = report
    while len(_CACHE) > _CACHE_SIZE:
        _CACHE.popitem(last=False)
    return report


def _check_order(check: Check) -> tuple[int, int, int]:
    status = {"failed": 0, "passed": 1, "skipped": 2}.get(check.status, 3)
    kind = 0 if check.kind == "security" else 1
    return status, kind, _SEVERITY_ORDER.index(check.severity) if check.severity in _SEVERITY_ORDER else 9


def failed_checks(report: Mapping[str, object]) -> list[dict[str, object]]:
    return [check for check in report.get("checks", []) if isinstance(check, dict) and check.get("status") == "failed"]  # type: ignore[union-attr]


def blocked_files(report: Mapping[str, object]) -> dict[str, dict[str, object]]:
    """Source files touched by a failing check, mapped to the first such check. Test files are not listed."""
    blocked: dict[str, dict[str, object]] = {}
    for check in failed_checks(report):
        paths = [item.get("file") for item in check.get("evidence") or [] if isinstance(item, dict)]  # type: ignore[union-attr]
        paths += list(check.get("related") or [])  # type: ignore[arg-type]
        for path in paths:
            if isinstance(path, str) and path and "/test/" not in f"/{path}":
                blocked.setdefault(path, check)
    return blocked
