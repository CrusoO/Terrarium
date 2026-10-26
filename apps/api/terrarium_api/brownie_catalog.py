"""Publish the three fictional Brownie source projects to a user's dashboard and read them back.

The projects are ordinary dashboard tools owned by the user, so they open and
run like any other published app. Brownie reuse reads the latest stored
version of each tool, never the in-code copy, so what is reused is exactly what
the dashboard shows.
"""

from __future__ import annotations

import hashlib
import re
from uuid import uuid4

from sqlalchemy.orm import Session

from terrarium_agents.brownie_projects import ASSETS, PROJECTS, BrownieProject
from terrarium_agents.brownie_reuse import PublishedProject, ReusePlan, resolve_reuse, sha256_text
from terrarium_api.models import ToolRecord, ToolVersionRecord, utc_now
from terrarium_api.tool_access import ensure_owner_member

DEMO_PROMPT = "Brownie demo source project (fictional organization, mock data)."
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
    """Create or refresh the three demo tools. Re-running is safe and adds a version only when files change."""
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
        if latest is not None and latest.files == project.files:
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


def catalog(db: Session, owner_id: str) -> dict[str, object]:
    published = published_projects(db, owner_id)

    def project_dto(project: BrownieProject) -> dict[str, object]:
        source = published.get(project.key)
        return {
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
                "reusable": asset.reusable and source is not None and all(item["sha256"] for item in files),
                "gateReason": asset.gate_reason or ("" if source else "Source project is not published."),
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
    recommended: list[dict[str, object]] = []
    reusable_by_id: dict[str, dict[str, object]] = {}
    held_back: list[dict[str, object]] = []
    for raw in data["assets"]:
        asset = ASSETS[str(raw["id"])]
        project = projects[asset.project_key]
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
        if bool(raw["reusable"]) and frontend_stack == "react":
            reusable_by_id[asset.asset_id] = entry
        if bool(raw["reusable"]) and frontend_stack == "react" and score:
            recommended.append(entry)
        elif score:
            held_back.append(
                {
                    **entry,
                    "reason": _PLAIN_HELD_BACK.get(
                        asset.asset_id,
                        "This part is not ready to reuse.",
                    ),
                }
            )
    recommended.sort(key=lambda entry: (-int(entry["score"]), str(entry["name"])))
    held_back.sort(key=lambda entry: (-int(entry["score"]), str(entry["name"])))
    best: list[dict[str, object]] = []
    seen: set[str] = set()
    for entry in recommended:
        if len(best) >= 3:
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
            if project["published"]
        ],
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
    return resolve_reuse(asset_ids, published=published_projects(db, owner_id), backend_stack=backend_stack)
