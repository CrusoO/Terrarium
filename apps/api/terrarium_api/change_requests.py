from __future__ import annotations

import logging
import os

import httpx
from sqlalchemy.orm import Session
from terrarium_contracts import AcceptanceCheck, ChangeRequest

from terrarium_agents.acceptance import propose_acceptance_checks
from terrarium_api.models import ToolRecord
from terrarium_api.tool_access import can_edit_tool, member_role
from terrarium_api.trust.drafts import upsert_draft_version
from terrarium_api.trust.gate import run_publish_check
from terrarium_api.trust.publish import discard_draft, promote_draft_version

logger = logging.getLogger(__name__)


def _relay_client() -> tuple[str, str]:
    base = os.environ.get("RELAY_URL", "").rstrip("/")
    token = next((t.strip() for t in os.environ.get("WORKER_TOKENS", "").split(",") if t.strip()), "")
    return base, token


def _parse_command(text: str) -> tuple[str, str]:
    stripped = text.strip()
    upper = stripped.upper()
    if upper == "YES":
        return "YES", ""
    if upper == "PUBLISH":
        return "PUBLISH", ""
    if upper == "UNDO":
        return "UNDO", ""
    if upper.startswith("APPROVE "):
        return "APPROVE", stripped.split(maxsplit=1)[1].strip()
    if upper.startswith("EDIT "):
        return "EDIT", stripped[5:].strip()
    return "UNKNOWN", stripped


async def poll_relay_once(worker_id: str) -> None:
    base, token = _relay_client()
    if not base or not token:
        return
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=60) as client:
        drained = await client.post(f"{base}/worker/commands/drain", headers=headers)
        drained.raise_for_status()
        for item in drained.json().get("items", []):
            await process_whatsapp_command(
                client,
                base,
                headers,
                str(item["requestId"]),
                str(item["command"]),
            )
        response = await client.post(f"{base}/worker/requests/claim", headers=headers)
        if response.status_code == 204:
            return
        response.raise_for_status()
        request = ChangeRequest.model_validate(response.json())
        await process_change_request(client, base, headers, worker_id, request)


async def process_whatsapp_command(
    client: httpx.AsyncClient,
    base: str,
    headers: dict[str, str],
    request_id: str,
    command_line: str,
) -> None:
    cmd, arg = _parse_command(command_line)
    loaded = await client.get(f"{base}/worker/requests/{request_id}", headers=headers)
    if loaded.status_code == 404:
        return
    request = ChangeRequest.model_validate(loaded.json())
    from terrarium_api.db import SessionLocal

    with SessionLocal() as db:
        tool = _resolve_tool(db, request)
        if tool is None:
            await _status(client, base, headers, request.id, "failed", "Could not resolve tool.")
            return
        role = member_role(db, tool, {"id": request.actorId})
        if role == "viewer":
            await _status(
                client,
                base,
                headers,
                request.id,
                "failed",
                "Viewers cannot build or publish. Ask the owner for edit access.",
            )
            return
        if cmd == "YES" and request.status == "awaiting_test_approval":
            checks = _load_checks(request)
            await _build_and_gate(client, base, headers, db, request, tool, checks)
            return
        if cmd == "EDIT" and request.status == "awaiting_test_approval":
            checks = propose_acceptance_checks(arg or request.text, kind="modify")
            await _status(
                client,
                base,
                headers,
                request.id,
                "awaiting_test_approval",
                "Updated tests:\n"
                + "\n".join(f"- {c.description}" for c in checks)
                + "\nReply YES to build or EDIT <text> to revise tests.",
                proposed_checks=checks,
                tool_id=tool.id,
            )
            return
        if cmd == "PUBLISH" and request.status == "ready_for_review":
            if not can_edit_tool(tool, {"id": request.actorId}, db):
                await _status(client, base, headers, request.id, "failed", "Not allowed to publish.")
                return
            try:
                await promote_draft_version(db, tool, acknowledge_warnings=True)
            except Exception as exc:
                await _status(client, base, headers, request.id, "failed", f"Publish blocked: {exc}")
                return
            await _status(client, base, headers, request.id, "published", "Published to live.")
            return
        if cmd == "UNDO" and request.status in ("ready_for_review", "published"):
            discard_draft(db, tool)
            await _status(client, base, headers, request.id, "cancelled", "Draft discarded.")
            return
        if cmd == "APPROVE" and arg.strip().isdigit():
            from terrarium_api.trust.campaigns import approve_campaign_by_index

            ok, message = await approve_campaign_by_index(db, tool.owner_id, int(arg.strip()))
            await _status(
                client,
                base,
                headers,
                request.id,
                "published" if ok else "failed",
                message,
            )
            return
        await _status(
            client,
            base,
            headers,
            request.id,
            request.status,
            f"Command {cmd} ignored in status {request.status}.",
        )


async def process_change_request(
    client: httpx.AsyncClient,
    base: str,
    headers: dict[str, str],
    worker_id: str,
    request: ChangeRequest,
) -> None:
    from terrarium_api.db import SessionLocal

    _ = worker_id
    with SessionLocal() as db:
        tool = _resolve_tool(db, request)
        if tool is None:
            await _status(client, base, headers, request.id, "failed", "Could not resolve tool.")
            return
        role = member_role(db, tool, {"id": request.actorId})
        if role == "viewer":
            await _status(
                client,
                base,
                headers,
                request.id,
                "queued",
                "Your request was sent to the owner for approval.",
            )
            return
        checks = propose_acceptance_checks(request.text, kind="modify")
        if not tool.auto_approve_tests:
            await _status(
                client,
                base,
                headers,
                request.id,
                "awaiting_test_approval",
                "Proposed tests:\n"
                + "\n".join(f"- {c.description}" for c in checks)
                + "\nReply YES to build or EDIT <text> to revise tests.",
                proposed_checks=checks,
                tool_id=tool.id,
            )
            return
        await _build_and_gate(client, base, headers, db, request, tool, checks)


def _load_checks(request: ChangeRequest) -> list[AcceptanceCheck]:
    if request.proposedChecks:
        return [AcceptanceCheck.model_validate(item) for item in request.proposedChecks]
    return propose_acceptance_checks(request.text, kind="modify")


def _apply_change_files(base_files: dict[str, str], prompt: str) -> dict[str, str]:
    files = dict(base_files)
    marker = f"<!-- terrarium-change: {prompt[:120]} -->"
    html_key = next((k for k in files if k.endswith("index.html")), None)
    if html_key:
        files[html_key] = files[html_key].replace("</body>", f"{marker}\n</body>")
    else:
        files["change.txt"] = prompt
    return files


async def _build_and_gate(
    client: httpx.AsyncClient,
    base: str,
    headers: dict[str, str],
    db: Session,
    request: ChangeRequest,
    tool: ToolRecord,
    checks: list[AcceptanceCheck],
) -> None:
    live_files = tool.versions[-1].files if tool.versions else {}
    files = _apply_change_files(live_files, request.text)
    draft = upsert_draft_version(
        db,
        tool,
        files,
        prompt=request.text,
        summary=request.text[:200],
        new_checks=checks,
    )
    await _status(
        client,
        base,
        headers,
        request.id,
        "building",
        "Building draft…",
        tool_id=tool.id,
        draft_version_id=draft.id,
        proposed_checks=checks,
    )
    health = await run_publish_check(db, tool, draft, checks=checks, regression_checks=checks)
    if health.status == "unsafe":
        from terrarium_api.trust.remediation import run_ladder
        from terrarium_sandbox.trust import scan

        findings, _, _ = scan(draft.files, tool_id=tool.id, version_id=draft.id)
        run_ladder(db, tool, draft, findings)
        health = await run_publish_check(db, tool, draft, checks=checks, skip_cache=True)
    if health.status == "unsafe":
        await _status(
            client,
            base,
            headers,
            request.id,
            "failed",
            "Still unsafe: " + "; ".join(health.blockingReasons[:3]),
            health=health,
            tool_id=tool.id,
            draft_version_id=draft.id,
        )
        return
    await _status(
        client,
        base,
        headers,
        request.id,
        "ready_for_review",
        f"Ready — {health.status}. Reply PUBLISH to go live or UNDO to discard.",
        health=health,
        tool_id=tool.id,
        draft_version_id=draft.id,
        proposed_checks=checks,
    )


def _resolve_tool(db: Session, request: ChangeRequest) -> ToolRecord | None:
    if request.toolId:
        return db.get(ToolRecord, request.toolId)
    if not request.text:
        return None
    from sqlalchemy import select

    tools = db.scalars(select(ToolRecord)).all()
    matches = [t for t in tools if t.name.lower() in request.text.lower()]
    return matches[0] if len(matches) == 1 else None


async def _status(
    client: httpx.AsyncClient,
    base: str,
    headers: dict[str, str],
    request_id: str,
    status: str,
    reply: str,
    *,
    proposed_checks: list[AcceptanceCheck] | None = None,
    health=None,
    tool_id: str | None = None,
    draft_version_id: str | None = None,
) -> None:
    payload: dict = {"status": status, "replyText": reply}
    if proposed_checks:
        payload["proposedChecks"] = [c.model_dump() for c in proposed_checks]
    if health is not None:
        payload["health"] = health.model_dump()
    if tool_id:
        payload["toolId"] = tool_id
    if draft_version_id:
        payload["draftVersionId"] = draft_version_id
    await client.post(f"{base}/worker/requests/{request_id}/status", json=payload, headers=headers)
