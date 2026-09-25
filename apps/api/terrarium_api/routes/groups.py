"""Group management and edit-access requests (Postgres)."""
from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from terrarium_api.auth.deps import get_current_user
from terrarium_api.db import get_db
from terrarium_api.group_access import claim_memberships
from terrarium_api.models import GroupMemberRecord, GroupRecord, PreviewAccessRequestRecord, utc_now

router = APIRouter(tags=["groups"])


class GroupCreate(BaseModel):
    name: str


class MemberCreate(BaseModel):
    email: str
    role: str = "member"


class AccessRequestCreate(BaseModel):
    tool_id: str
    tool_name: str
    owner_id: str


class GroupOut(BaseModel):
    id: str
    name: str
    createdBy: str
    memberCount: int


class MemberOut(BaseModel):
    user_id: str
    email: str
    role: str


class AccessRequestOut(BaseModel):
    id: str
    tool_id: str
    tool_name: str
    requester_id: str
    requester_email: str
    owner_id: str
    status: str


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


@router.post("/groups", response_model=GroupOut, status_code=201)
def create_group(
    body: GroupCreate,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupOut:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")
    group = GroupRecord(id=uuid4().hex, name=name, created_by=user["id"])
    db.add(group)
    db.add(
        GroupMemberRecord(
            id=uuid4().hex,
            group_id=group.id,
            user_id=user["id"],
            email=_norm(user.get("email")) or user["id"],
            role="admin",
        )
    )
    db.commit()
    db.refresh(group)
    return GroupOut(id=group.id, name=group.name, createdBy=group.created_by, memberCount=len(group.members))


@router.get("/groups", response_model=list[GroupOut])
def list_groups(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GroupOut]:
    claim_memberships(db, user)
    db.commit()
    email = _norm(user.get("email"))
    filters = [GroupMemberRecord.user_id == user["id"]]
    if email:
        filters.append(GroupMemberRecord.email == email)
    memberships = db.query(GroupMemberRecord).filter(or_(*filters)).all()
    seen: set[str] = set()
    result: list[GroupOut] = []
    for membership in memberships:
        if membership.group_id in seen:
            continue
        seen.add(membership.group_id)
        result.append(
            GroupOut(
                id=membership.group.id,
                name=membership.group.name,
                createdBy=membership.group.created_by,
                memberCount=len(membership.group.members),
            )
        )
    return result


@router.get("/groups/{group_id}/members", response_model=list[MemberOut])
def list_members(
    group_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MemberOut]:
    _require_member(db, group_id, user)
    members = db.query(GroupMemberRecord).filter(GroupMemberRecord.group_id == group_id).all()
    return [MemberOut(user_id=m.user_id, email=m.email, role=m.role) for m in members]


@router.post("/groups/{group_id}/members", response_model=MemberOut, status_code=201)
def add_member(
    group_id: str,
    body: MemberCreate,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberOut:
    _require_admin(db, group_id, user)
    email = _norm(body.email)
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="email is required")
    role = body.role if body.role in {"admin", "member"} else "member"
    existing = (
        db.query(GroupMemberRecord)
        .filter(GroupMemberRecord.group_id == group_id, GroupMemberRecord.email == email)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="User is already a member")
    member = GroupMemberRecord(
        id=uuid4().hex,
        group_id=group_id,
        user_id=email,
        email=email,
        role=role,
    )
    db.add(member)
    db.commit()
    return MemberOut(user_id=member.user_id, email=member.email, role=member.role)


@router.delete("/groups/{group_id}/members/{member_id}", status_code=204)
def remove_member(
    group_id: str,
    member_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    _require_admin(db, group_id, user)
    identity = _norm(member_id) or member_id
    member = (
        db.query(GroupMemberRecord)
        .filter(
            GroupMemberRecord.group_id == group_id,
            or_(GroupMemberRecord.user_id == member_id, GroupMemberRecord.email == identity),
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()


@router.post("/access-requests", response_model=AccessRequestOut, status_code=201)
def request_access(
    body: AccessRequestCreate,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccessRequestOut:
    tool_id = body.tool_id.strip()
    owner_id = body.owner_id.strip()
    if not tool_id or not owner_id:
        raise HTTPException(status_code=422, detail="tool_id and owner_id are required")
    if owner_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot request access to your own app")
    existing = (
        db.query(PreviewAccessRequestRecord)
        .filter(
            PreviewAccessRequestRecord.tool_id == tool_id,
            PreviewAccessRequestRecord.requester_id == user["id"],
        )
        .first()
    )
    if existing and existing.status in {"pending", "approved"}:
        return _req_out(existing)
    if existing:
        existing.status = "pending"
        existing.tool_name = body.tool_name.strip() or existing.tool_name
        existing.updated_at = utc_now()
        db.commit()
        db.refresh(existing)
        return _req_out(existing)
    req = PreviewAccessRequestRecord(
        id=uuid4().hex,
        session_id=None,
        tool_id=tool_id,
        tool_name=body.tool_name.strip() or "Untitled app",
        requester_id=user["id"],
        requester_email=_norm(user.get("email")) or user["id"],
        owner_id=owner_id,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _req_out(req)


@router.get("/access-requests/pending", response_model=list[AccessRequestOut])
def pending_requests(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AccessRequestOut]:
    reqs = (
        db.query(PreviewAccessRequestRecord)
        .filter(
            PreviewAccessRequestRecord.owner_id == user["id"],
            PreviewAccessRequestRecord.status == "pending",
        )
        .order_by(PreviewAccessRequestRecord.created_at)
        .all()
    )
    return [_req_out(r) for r in reqs]


@router.get("/access-requests/mine", response_model=list[AccessRequestOut])
def my_requests(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AccessRequestOut]:
    reqs = (
        db.query(PreviewAccessRequestRecord)
        .filter(PreviewAccessRequestRecord.requester_id == user["id"])
        .order_by(PreviewAccessRequestRecord.created_at.desc())
        .all()
    )
    return [_req_out(r) for r in reqs]


@router.post("/access-requests/{request_id}/approve", response_model=AccessRequestOut)
def approve_request(
    request_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccessRequestOut:
    req = _get_request_as_owner(db, request_id, user["id"])
    req.status = "approved"
    req.updated_at = utc_now()
    db.commit()
    db.refresh(req)
    return _req_out(req)


@router.post("/access-requests/{request_id}/deny", response_model=AccessRequestOut)
def deny_request(
    request_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccessRequestOut:
    req = _get_request_as_owner(db, request_id, user["id"])
    req.status = "denied"
    req.updated_at = utc_now()
    db.commit()
    db.refresh(req)
    return _req_out(req)


def _require_member(db: Session, group_id: str, user: dict[str, str]) -> GroupMemberRecord:
    email = _norm(user.get("email"))
    filters = [GroupMemberRecord.user_id == user["id"]]
    if email:
        filters.append(GroupMemberRecord.email == email)
    member = (
        db.query(GroupMemberRecord)
        .filter(GroupMemberRecord.group_id == group_id, or_(*filters))
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return member


def _require_admin(db: Session, group_id: str, user: dict[str, str]) -> GroupMemberRecord:
    member = _require_member(db, group_id, user)
    if member.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return member


def _get_request_as_owner(db: Session, request_id: str, owner_id: str) -> PreviewAccessRequestRecord:
    req = db.query(PreviewAccessRequestRecord).filter(PreviewAccessRequestRecord.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Not the owner of this app")
    if req.status != "pending":
        raise HTTPException(status_code=409, detail=f"Request already {req.status}")
    return req


def _req_out(req: PreviewAccessRequestRecord) -> AccessRequestOut:
    return AccessRequestOut(
        id=req.id,
        tool_id=req.tool_id or "",
        tool_name=req.tool_name or "Untitled app",
        requester_id=req.requester_id,
        requester_email=req.requester_email,
        owner_id=req.owner_id,
        status=req.status,
    )
