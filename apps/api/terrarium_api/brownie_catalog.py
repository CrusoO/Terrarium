"""Publish the fictional Brownie source projects to a user's dashboard and read them back.

The projects are ordinary dashboard tools owned by the user, so they open and
run like any other published app. Brownie reuse reads the latest stored
version of each tool, never the in-code copy, so what is reused is exactly what
the dashboard shows. A part is only reusable while the trust card of its app
has no failing check on that part's files.
"""

from __future__ import annotations

import hashlib
import logging
import re
from uuid import uuid4

from sqlalchemy.orm import Session

from terrarium_agents.brownie_projects import ASSETS, PROJECTS, BrownieProject
from terrarium_agents.brownie_reuse import PublishedProject, ReusePlan, resolve_reuse, sha256_text
from terrarium_agents.sap_fiori import detect_domain, module_for_path
from terrarium_api.models import ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.tool_access import ensure_owner_member
from terrarium_api.trust.app_report import TestRunner, blocked_files, build_report

logger = logging.getLogger(__name__)

DEMO_PROMPT = "Published company app used as a Brownie source."
# Earlier publishes stored this prompt. Still treat them as ours so a file change can refresh them.
_OWNED_PROMPTS = {DEMO_PROMPT, "Brownie demo source project (fictional organization, mock data)."}
# Tests replace this to avoid starting containers.
trust_runner: TestRunner | None = None
_QUERY_WORDS = frozenset(
    {
        "a", "an", "and", "app", "application", "build", "for", "from", "in",
        "is", "me", "of", "portal", "system", "the", "to", "with",
    }
)


def _words(value: str) -> set[str]:
    return {
        word
        for word in re.findall(r"[a-z][a-z0-9]+", value.lower())
        if len(word) > 2 and word not in _QUERY_WORDS
    }


def tool_id_for(owner_id: str, project_key: str) -> str:
    digest = hashlib.sha256(owner_id.encode("utf-8")).hexdigest()[:12]
    return f"brownie-{project_key}-{digest}"


def _latest(tool: ToolRecord) -> ToolVersionRecord | None:
    return tool.versions[-1] if tool.versions else None


def sync_projects(db: Session, user: dict[str, str]) -> None:
    """Create or refresh the demo tools. Re-running is safe and adds a version only when files change.

    A tool whose latest version was made by someone else (a trust fix, an edit) is left alone.
    """
    owner_id = user["id"]
    email = (user.get("email") or "").strip().lower() or None
    for project in PROJECTS.values():
        tool = db.get(ToolRecord, tool_id_for(owner_id, project.key))
        if tool is None:
            tool = ToolRecord(
                id=tool_id_for(owner_id, project.key),
                owner_id=owner_id,
                owner_email=email,
                name=project.name,
                summary=project.summary,
                status="sleeping",
                visibility="private",
            )
            db.add(tool)
            db.flush()
        ensure_owner_member(db, tool)
        latest = _latest(tool)
        if latest is not None and (latest.files == project.files or latest.prompt not in _OWNED_PROMPTS):
            continue
        for version in tool.versions:
            version.is_live = False
        db.add(
            ToolVersionRecord(
                id=uuid4().hex,
                tool_id=tool.id,
                version_number=(latest.version_number + 1) if latest else 1,
                prompt=DEMO_PROMPT,
                summary=project.summary,
                files=dict(project.files),
                is_live=True,
            )
        )
        tool.name = project.name
        tool.summary = project.summary
        tool.updated_at = utc_now()
    db.commit()


def published_projects(db: Session, owner_id: str) -> dict[str, PublishedProject]:
    found: dict[str, PublishedProject] = {}
    for project in PROJECTS.values():
        tool = db.get(ToolRecord, tool_id_for(owner_id, project.key))
        latest = _latest(tool) if tool is not None else None
        if tool is None or latest is None:
            continue
        found[project.key] = PublishedProject(
            tool_id=tool.id,
            tool_name=tool.name,
            version_number=latest.version_number,
            files=dict(latest.files or {}),
        )
    return found


def restore_project(db: Session, tool: ToolRecord) -> ToolVersionRecord | None:
    """Put a demo tool back to its original files as a new live version, so the demo can run again."""
    project = next((item for item in PROJECTS.values() if tool_id_for(tool.owner_id, item.key) == tool.id), None)
    if project is None:
        return None
    latest = _latest(tool)
    for version in tool.versions:
        version.is_live = False
    version = ToolVersionRecord(
        id=uuid4().hex,
        tool_id=tool.id,
        version_number=(latest.version_number + 1) if latest else 1,
        prompt=DEMO_PROMPT,
        summary=project.summary,
        files=dict(project.files),
        is_live=True,
    )
    db.add(version)
    tool.updated_at = utc_now()
    db.commit()
    db.refresh(tool)
    return version


def trust_reports(published: dict[str, PublishedProject]) -> dict[str, dict[str, object]]:
    reports: dict[str, dict[str, object]] = {}
    for key, source in published.items():
        try:
            reports[key] = build_report(
                source.files,
                tool_id=source.tool_id,
                version_id=f"{source.tool_id}:v{source.version_number}",
                version_number=source.version_number,
                runner=trust_runner,
            )
        except Exception:  # noqa: BLE001
            logger.exception("Trust report failed for %s", source.tool_id)
    return reports


def trust_blocks(
    published: dict[str, PublishedProject],
    reports: dict[str, dict[str, object]] | None = None,
) -> dict[str, str]:
    """Asset id -> plain reason, for parts whose files fail a check on their app's trust card."""
    reports = trust_reports(published) if reports is None else reports
    blocks: dict[str, str] = {}
    for asset in ASSETS.values():
        report = reports.get(asset.project_key)
        source = published.get(asset.project_key)
        if report is None or source is None:
            continue
        failing = blocked_files(report)
        hit = next(((path, failing[path]) for path in asset.files if path in failing), None)
        if hit is None:
            continue
        path, check = hit
        blocks[asset.asset_id] = (
            f"The trust card for {source.tool_name} v{source.version_number} fails \u201c{check['name']}\u201d "
            f"on {path.rsplit('/', 1)[-1]}. Fix it from Published apps and it can be reused."
        )
    return blocks


def catalog(db: Session, owner_id: str) -> dict[str, object]:
    published = published_projects(db, owner_id)
    reports = trust_reports(published)
    blocks = trust_blocks(published, reports)

    def project_dto(project: BrownieProject) -> dict[str, object]:
        source = published.get(project.key)
        report = reports.get(project.key)
        return {
            "trust": (
                {"score": report["score"], "grade": report["grade"], "status": report["status"]}
                if report
                else None
            ),
            "key": project.key,
            "name": project.name,
            "organization": project.organization,
            "stack": project.stack,
            "version": project.version,
            "toolId": source.tool_id if source else None,
            "toolVersion": source.version_number if source else None,
            "fileCount": len(source.files) if source else 0,
            "published": source is not None,
        }

    assets = []
    for asset in ASSETS.values():
        source = published.get(asset.project_key)
        files = []
        for path in asset.files:
            body = source.files.get(path) if source else None
            files.append({"path": path, "sha256": sha256_text(body) if body is not None else None})
        assets.append(
            {
                "id": asset.asset_id,
                "name": asset.name,
                "version": asset.version,
                "projectKey": asset.project_key,
                "toolId": source.tool_id if source else None,
                "toolName": source.tool_name if source else PROJECTS[asset.project_key].name,
                "toolVersion": source.version_number if source else None,
                "files": files,
                "dependsOn": list(asset.depends_on),
                "stack": asset.stack,
                "reusable": asset.reusable
                and source is not None
                and all(item["sha256"] for item in files)
                and asset.asset_id not in blocks,
                "gateReason": asset.gate_reason
                or blocks.get(asset.asset_id)
                or ("" if source else "Source project is not published."),
                "trustBlocked": asset.asset_id in blocks,
            }
        )
    return {
        "simulated": True,
        "projects": [project_dto(project) for project in PROJECTS.values()],
        "assets": assets,
    }


_PLAIN_REASONS = {
    "pm-auth-context": "People can sign in with this.",
    "pm-role-guard": "Staff and customers can be given different access.",
    "pm-dashboard-shell": "This gives the app a home screen and a simple menu.",
    "commerce-product-card": "This shows a product, its price, and an add-to-cart button.",
    "commerce-notification-service": "This tells people when an order changes.",
    "sap-approval-rules": "Contoso's approval matrix already routes by amount and stops people approving their own requests.",
    "sap-audit-trail": "This keeps a tamper-proof record of who did what, which auditors ask for.",
    "sap-status-formatter": "This gives statuses the same Fiori colours as the other apps.",
    "sap-stock-variance": "Fabrikam's variance rule already sorts counts into OK, Review, and Critical, with tests.",
    "sap-stock-adjustment": "This posts a corrected count back to stock.",
    "sap-three-way-match": "This compares the order, the goods receipt, and the invoice.",
    "sap-s4-destination-client": "This reads purchase orders from S/4HANA through a destination.",
}
_PLAIN_HELD_BACK = {
    "pm-notification-banner-legacy": "This older notice banner is retired, so it should not be reused.",
    "commerce-webhook-verifier": "This is a server piece, and reuse currently covers the screens people see.",
    "commerce-payment-api-draft": "This payment piece is still a draft, so it needs a review first.",
    "support-ticket-workflow": "This belongs to a private app, so it cannot be copied.",
    "support-agent-assignment": "This belongs to a private app, so it cannot be copied.",
    "support-dashboard-angular": "This belongs to a private app, so it cannot be copied.",
    "support-ticket-card": "This belongs to a private app, so it cannot be copied.",
}


def recommend_from_dashboard(
    db: Session,
    owner_id: str,
    prompt: str,
    *,
    frontend_stack: str,
    architecture: str = "",
) -> dict[str, object]:
    """Rank published dashboard parts after the app shape is known.

    Catalog records are treated as data. The ranking is deterministic and does
    not wait on a model, so the choice is still shown when a provider is down.
    """
    data = catalog(db, owner_id)
    query = _words(f"{prompt}\n{architecture}")
    projects = {project.key: project for project in PROJECTS.values()}
    sap = frontend_stack == "sapui5"
    domain = detect_domain(prompt, architecture) if sap else None
    recommended: list[dict[str, object]] = []
    reusable_by_id: dict[str, dict[str, object]] = {}
    held_back: list[dict[str, object]] = []
    for raw in data["assets"]:
        asset = ASSETS[str(raw["id"])]
        project = projects[asset.project_key]
        if (asset.stack == "sapui5") != sap:
            continue
        metadata = " ".join(
            [
                asset.name,
                asset.api,
                project.name,
                project.summary,
                *asset.files,
            ]
        )
        matches = sorted(query & _words(metadata))
        score = len(matches)
        if "commerce" in query and asset.project_key == "northstar-commerce":
            score += 4
        if {"catalog", "product", "cart", "checkout", "order"} & query and asset.project_key == "northstar-commerce":
            score += 3
        if {"auth", "role", "permission", "dashboard"} & query and asset.project_key == "acme-internal-pm":
            score += 3
        if {"support", "ticket", "case"} & query and asset.project_key == "helio-support-desk":
            score += 3
        if domain is not None:
            module = next((found for path in asset.files if (found := module_for_path(path))), None)
            if module is None or module.role not in domain.roles:
                continue
            score += 4
        entry = {
            "assetId": asset.asset_id,
            "name": asset.name,
            "projectKey": asset.project_key,
            "toolName": raw["toolName"],
            "toolVersion": raw["toolVersion"],
            "files": raw["files"],
            "score": score,
            "matchedTerms": matches,
            "reason": _PLAIN_REASONS.get(
                asset.asset_id,
                f"This part from {project.name} looks close to what you described.",
            ),
        }
        supported = frontend_stack in {"react", "sapui5"}
        if bool(raw["reusable"]) and supported:
            reusable_by_id[asset.asset_id] = entry
        if bool(raw["reusable"]) and supported and score:
            recommended.append(entry)
        elif score:
            held_back.append(
                {
                    **entry,
                    "trustBlocked": bool(raw.get("trustBlocked")),
                    "reason": (
                        str(raw["gateReason"])
                        if raw.get("trustBlocked")
                        else _PLAIN_HELD_BACK.get(asset.asset_id, "This part is not ready to reuse.")
                    ),
                }
            )
    recommended.sort(key=lambda entry: (-int(entry["score"]), str(entry["name"])))
    held_back.sort(key=lambda entry: (-int(entry["score"]), str(entry["name"])))
    best: list[dict[str, object]] = []
    seen: set[str] = set()
    for entry in recommended:
        if len(best) >= (4 if sap else 3):
            break
        for dependency_id in ASSETS[str(entry["assetId"])].depends_on:
            dependency = reusable_by_id.get(dependency_id)
            if dependency is None or dependency_id in seen:
                continue
            best.append({**dependency, "reason": "Needed so the recommended part above can work."})
            seen.add(dependency_id)
        if str(entry["assetId"]) not in seen:
            best.append(entry)
            seen.add(str(entry["assetId"]))
    return {
        "source": "dashboard-catalog",
        "simulated": True,
        "checkedProjects": [
            {
                "name": project["name"],
                "toolVersion": project["toolVersion"],
                "stack": project["stack"],
                "fileCount": project["fileCount"],
            }
            for project in data["projects"]
            if project["published"] and ("SAP" in str(project["stack"])) == sap
        ],
        "domain": domain.label if domain else None,
        "recommended": best,
        "recommendedAssetIds": [str(entry["assetId"]) for entry in best],
        "heldBack": held_back[:3],
        "message": (
            f"Best option: reuse {len(best)} part{'s' if len(best) != 1 else ''} from the existing project repos, and build the rest new."
            if best
            else "I checked the existing project repos. Nothing is close enough to reuse, so this should be built new."
        ),
    }


def reuse_from_dashboard(db: Session, owner_id: str | None, asset_ids: list[str], backend_stack: str) -> ReusePlan:
    if not asset_ids:
        return ReusePlan()
    if not owner_id:
        return ReusePlan(ignored=tuple((asset_id, "Session owner unknown.") for asset_id in asset_ids))
    published = published_projects(db, owner_id)
    return resolve_reuse(
        asset_ids,
        published=published,
        backend_stack=backend_stack,
        blocked=trust_blocks(published),
    )
