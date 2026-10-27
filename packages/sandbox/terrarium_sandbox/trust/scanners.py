from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from terrarium_contracts import FileMap, Severity, VulnerabilityFinding

from terrarium_sandbox.trust.finding_id import stable_finding_id

_SECRET_PATTERNS = (
    re.compile(r"sk_live_[A-Za-z0-9]{8,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
)

_SQL_KEYWORD = re.compile(r"\b(?:SELECT|INSERT|UPDATE|DELETE)\b", re.IGNORECASE)
# Long and multi-line template strings: the interpolation can sit well after the keyword.
_SQL_INTERPOLATION_WINDOW = 500
_SQL_CONCAT = re.compile(
    r"""(?P<q>['"])(?P<body>(?:\\.|(?!(?P=q)).){0,400})(?P=q)\s*\+""",
    re.DOTALL,
)


class _SqlStringRule:
    """Match SQL built with template interpolation or string concatenation.

    Ordinary JSX and helper templates do not contain a SQL keyword, so they
    do not match.
    """

    def search(self, content: str) -> re.Match[str] | None:
        for match in _SQL_KEYWORD.finditer(content):
            window = content[match.end() : match.end() + _SQL_INTERPOLATION_WINDOW]
            if "${" in window:
                return match
        for match in _SQL_CONCAT.finditer(content):
            if _SQL_KEYWORD.search(match.group("body")):
                return match
        return None


_CODE_RULES: list[tuple[str, object, Severity, str]] = [
    (
        "eval-new-function",
        re.compile(r"\b(eval|new\s+Function)\s*\("),
        "high",
        "Dynamic code execution",
    ),
    (
        "dangerous-inner-html",
        re.compile(r"dangerouslySetInnerHTML|\.innerHTML\s*="),
        "high",
        "Unescaped HTML injection surface",
    ),
    (
        "inner-html-from-input",
        re.compile(r"""\.innerHTML\s*=\s*(?!['"`])"""),
        "high",
        "innerHTML assigned from a value",
    ),
    (
        "external-fetch",
        re.compile(r"""\bfetch\s*\(\s*['"]https?://|new\s+XMLHttpRequest\b|\baxios\."""),
        "high",
        "External network fetch",
    ),
    (
        "string-sql",
        _SqlStringRule(),
        "high",
        "String-built SQL query",
    ),
]

# Fixture advisory for tests: lodash@4.17.20
_KNOWN_ADVISORIES: dict[str, dict[str, object]] = {
    "lodash@4.17.20": {
        "advisoryId": "GHSA-29mw-Wpgm-hmr9",
        "severity": "high",
        "title": "Prototype pollution in lodash",
        "fixedVersions": ["4.17.21"],
    }
}

# Advisories that cover every version below the fixed one.
_RANGE_ADVISORIES: dict[str, dict[str, object]] = {
    "@sap/xssec": {
        "advisoryId": "CVE-2023-49583",
        "severity": "critical",
        "title": "Privilege escalation in @sap/xssec (SAP Security Note 3411067)",
        "fixedVersions": ["3.6.0"],
    }
}

# CAP and Cloud Foundry local config that commonly ends up committed with real credentials.
_CREDENTIAL_FILES = ("default-env.json", ".cdsrc-private.json", "vcap-services.json")
_CREDENTIAL_VALUE = re.compile(
    r'"(?:password|clientsecret|client_secret|secret|apikey|api_key)"\s*:\s*"(?!\{\{)[^"\s]{6,}"',
    re.IGNORECASE,
)

_PACKAGE_FILES = ("package.json", "frontend/package.json", "backend/package.json")


def _version_tuple(value: str) -> tuple[int, ...] | None:
    match = re.match(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?", value)
    if not match:
        return None
    return tuple(int(part or 0) for part in match.groups())


def _range_advisory(name: str, version: str) -> dict[str, object] | None:
    advisory = _RANGE_ADVISORIES.get(name)
    if advisory is None:
        return None
    installed = _version_tuple(version)
    fixed = _version_tuple(str(advisory["fixedVersions"][0]))  # type: ignore[index]
    if installed is None or fixed is None or installed >= fixed:
        return None
    return advisory


def vuln_db_version() -> str:
    return os.environ.get("TERRARIUM_VULN_DB_VERSION", datetime.now(timezone.utc).strftime("%Y-%m-%d"))


def _parse_package_lock(files: FileMap) -> dict[str, str]:
    raw = files.get("package-lock.json") or files.get("frontend/package-lock.json") or ""
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    packages = data.get("packages") or {}
    out: dict[str, str] = {}
    for path, meta in packages.items():
        if not isinstance(meta, dict):
            continue
        name = path.replace("node_modules/", "") if path else ""
        version = meta.get("version")
        if name and version:
            out[name.split("node_modules/")[-1]] = str(version)
    return out


def _imported_packages(files: FileMap) -> set[str]:
    imported: set[str] = set()
    import_re = re.compile(r"""from\s+['"]([^./][^'"]*)['"]|require\s*\(\s*['"]([^./][^'"]*)['"]\s*\)""")
    for path, content in files.items():
        if not path.endswith((".js", ".jsx", ".ts", ".tsx")):
            continue
        for match in import_re.finditer(content):
            pkg = match.group(1) or match.group(2)
            if pkg:
                imported.add(pkg.split("/")[0])
    return imported


def _reachable(package: str, files: FileMap, lock: dict[str, str]) -> bool | None:
    if package not in lock:
        return None
    if package not in _imported_packages(files):
        # devDependency heuristic: listed only under devDependencies in package.json
        for pkg_path in ("package.json", "frontend/package.json"):
            raw = files.get(pkg_path)
            if not raw:
                continue
            try:
                manifest = json.loads(raw)
            except json.JSONDecodeError:
                continue
            dev = manifest.get("devDependencies") or {}
            if package in dev:
                return False
        return False
    return True


def scan(
    files: FileMap,
    *,
    tool_id: str,
    version_id: str,
    image: str | None = None,
) -> tuple[list[VulnerabilityFinding], int, int]:
    """Scan FileMap. Returns findings, secrets_found, code_issues. image reserved for Trivy."""
    _ = image
    now = datetime.now(timezone.utc).isoformat()
    findings: list[VulnerabilityFinding] = []
    secrets = 0
    code_issues = 0

    for path, content in files.items():
        for pattern in _SECRET_PATTERNS:
            if pattern.search(content):
                secrets += 1
                fid = stable_finding_id("gitleaks", rule="secret", file=path)
                findings.append(
                    VulnerabilityFinding(
                        id=fid,
                        toolId=tool_id,
                        versionId=version_id,
                        source="gitleaks",
                        severity="critical",
                        title="Secret material in repository",
                        file=path,
                        detectedAt=now,
                    )
                )
        if path.rsplit("/", 1)[-1] in _CREDENTIAL_FILES and _CREDENTIAL_VALUE.search(content):
            secrets += 1
            findings.append(
                VulnerabilityFinding(
                    id=stable_finding_id("gitleaks", rule="config-credential", file=path),
                    toolId=tool_id,
                    versionId=version_id,
                    source="gitleaks",
                    severity="critical",
                    title="System credentials committed in local config",
                    file=path,
                    rule="config-credential",
                    detectedAt=now,
                )
            )

    for path, content in files.items():
        for rule_id, pattern, severity, title in _CODE_RULES:
            if pattern.search(content):
                code_issues += 1
                fid = stable_finding_id("semgrep", rule=rule_id, file=path)
                findings.append(
                    VulnerabilityFinding(
                        id=fid,
                        toolId=tool_id,
                        versionId=version_id,
                        source="semgrep",
                        severity=severity,
                        title=title,
                        file=path,
                        rule=rule_id,
                        detectedAt=now,
                    )
                )

    if os.environ.get("TERRARIUM_TRUST_OFFLINE", "").strip() != "1":
        try:
            from terrarium_sandbox.trust.docker_scan import run_gitleaks

            for hit in run_gitleaks(files):
                path = str(hit.get("File") or hit.get("file") or "unknown")
                fid = stable_finding_id("gitleaks", rule="docker", file=path)
                findings.append(
                    VulnerabilityFinding(
                        id=fid,
                        toolId=tool_id,
                        versionId=version_id,
                        source="gitleaks",
                        severity="critical",
                        title=str(hit.get("Description") or "Secret detected by gitleaks"),
                        file=path,
                        detectedAt=now,
                    )
                )
                secrets += 1
        except Exception:
            pass

    lock = _parse_package_lock(files)
    for pkg_path in _PACKAGE_FILES:
        raw = files.get(pkg_path)
        if not raw:
            continue
        try:
            manifest = json.loads(raw)
        except json.JSONDecodeError:
            continue
        deps = {**(manifest.get("dependencies") or {}), **(manifest.get("devDependencies") or {})}
        for name, version in deps.items():
            version = str(version).lstrip("^~>=")
            key = f"{name}@{version}"
            adv = _KNOWN_ADVISORIES.get(key) or _range_advisory(name, version)
            if not adv:
                continue
            fid = stable_finding_id("osv", package_name=name)
            findings.append(
                VulnerabilityFinding(
                    id=fid,
                    toolId=tool_id,
                    versionId=version_id,
                    source="osv",
                    severity=adv["severity"],  # type: ignore[arg-type]
                    title=str(adv["title"]),
                    advisoryId=str(adv["advisoryId"]),
                    packageName=name,
                    installedVersion=version,
                    fixedVersions=list(adv["fixedVersions"]),  # type: ignore[arg-type]
                    reachable=_reachable(name, files, lock),
                    detectedAt=now,
                )
            )

    return findings, secrets, code_issues


def preboot_blocks_boot(findings: list[VulnerabilityFinding], secrets: int) -> bool:
    if secrets > 0:
        return True
    for item in findings:
        if item.source == "semgrep" and item.severity in ("high", "critical"):
            return True
        if item.source == "gitleaks":
            return True
    return False
