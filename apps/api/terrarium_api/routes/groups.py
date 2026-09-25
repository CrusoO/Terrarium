"""Group management and preview access request routes."""
from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from terrarium_api.auth.deps import get_current_user
from terrarium_api.db import get_db
from terrarium_api.models import (
    GroupMemberRecord,
    GroupRecord,
    PreviewAccessRequestRecord,
)

router = APIRouter(tags=["groups"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class GroupOut(BaseModel):
    id: str
    name: str
    created_by: str
    member_count: int

class MemberOut(BaseModel):
    user_id: str
    email: str
    role: str

class AccessRequestOut(BaseModel):
    id: str
    session_id: str
    requester_id: str
    requester_email: str
    owner_id: str
    status: str


# ── Groups ────────────────────────────────────────────────────────────────────

@router.post("/groups", response_model=GroupOut, status_code=201)
def create_group(
    body: dict,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupOut:
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="name is required")
    group = GroupRecord(id=uuid4().hex, name=name, created_by=user["id"])
    db.add(group)
    db.add(GroupMemberRecord(
        id=uuid4().hex, group_id=group.id,
        user_id=user["id"], email=user["email"], role="admin",
    ))
    db.commit()
    db.refresh(group)
    return GroupOut(id=group.id, name=group.name, created_by=group.created_by, member_count=len(group.members))


@router.get("/groups", response_model=list[GroupOut])
def list_groups(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GroupOut]:
    memberships = db.query(GroupMemberRecord).filter(GroupMemberRecord.user_id == user["id"]).all()
    return [
        GroupOut(id=m.group.id, name=m.group.name, created_by=m.group.created_by, member_count=len(m.group.members))
        for m in memberships
    ]


@router.get("/groups/{group_id}/members", response_model=list[MemberOut])
def list_members(
    group_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MemberOut]:
    _require_member(db, group_id, user["id"])
    members = db.query(GroupMemberRecord).filter(GroupMemberRecord.group_id == group_id).all()
    return [MemberOut(user_id=m.user_id, email=m.email, role=m.role) for m in members]


@router.post("/groups/{group_id}/members", response_model=MemberOut, status_code=201)
def add_member(
    group_id: str,
    body: dict,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberOut:
    _require_admin(db, group_id, user["id"])
    member_user_id = (body.get("user_id") or "").strip()
    member_email = (body.get("email") or "").strip()
    if not member_user_id or not member_email:
        raise HTTPException(status_code=422, detail="user_id and email are required")
    existing = db.query(GroupMemberRecord).filter(
        GroupMemberRecord.group_id == group_id, GroupMemberRecord.user_id == member_user_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User is already a member")
    m = GroupMemberRecord(
        id=uuid4().hex, group_id=group_id,
        user_id=member_user_id, email=member_email, role=body.get("role", "member"),
    )
    db.add(m)
    db.commit()
    return MemberOut(user_id=m.user_id, email=m.email, role=m.role)


@router.delete("/groups/{group_id}/members/{member_user_id}", status_code=204)
def remove_member(
    group_id: str,
    member_user_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    _require_admin(db, group_id, user["id"])
    m = db.query(GroupMemberRecord).filter(
        GroupMemberRecord.group_id == group_id, GroupMemberRecord.user_id == member_user_id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(m)
    db.commit()


# ── Access Requests ───────────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/request-access", response_model=AccessRequestOut, status_code=201)
def request_access(
    session_id: str,
    body: dict,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccessRequestOut:
    owner_id = (body.get("owner_id") or "").strip()
    if not owner_id:
        raise HTTPException(status_code=422, detail="owner_id is required")
    if owner_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot request access to your own session")
    if not _share_group(db, user["id"], owner_id):
        raise HTTPException(status_code=403, detail="You must be in the same group as the owner")
    existing = db.query(PreviewAccessRequestRecord).filter(
        PreviewAccessRequestRecord.session_id == session_id,
        PreviewAccessRequestRecord.requester_id == user["id"],
    ).first()
    if existing:
        return _req_out(existing)
    req = PreviewAccessRequestRecord(
        id=uuid4().hex, session_id=session_id,
        requester_id=user["id"], requester_email=user["email"],
        owner_id=owner_id, status="pending",
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
    reqs = db.query(PreviewAccessRequestRecord).filter(
        PreviewAccessRequestRecord.owner_id == user["id"],
        PreviewAccessRequestRecord.status == "pending",
    ).order_by(PreviewAccessRequestRecord.created_at).all()
    return [_req_out(r) for r in reqs]


@router.get("/access-requests/mine", response_model=list[AccessRequestOut])
def my_requests(
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AccessRequestOut]:
    reqs = db.query(PreviewAccessRequestRecord).filter(
        PreviewAccessRequestRecord.requester_id == user["id"]
    ).order_by(PreviewAccessRequestRecord.created_at.desc()).all()
    return [_req_out(r) for r in reqs]


@router.get("/sessions/{session_id}/my-access")
def my_access(
    session_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    req = db.query(PreviewAccessRequestRecord).filter(
        PreviewAccessRequestRecord.session_id == session_id,
        PreviewAccessRequestRecord.requester_id == user["id"],
    ).first()
    return {"status": req.status if req else "none"}


@router.post("/access-requests/{request_id}/approve", response_model=AccessRequestOut)
def approve_request(
    request_id: str,
    user: dict[str, str] = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccessRequestOut:
    req = _get_request_as_owner(db, request_id, user["id"])
    req.status = "approved"
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
    db.commit()
    db.refresh(req)
    return _req_out(req)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_member(db: Session, group_id: str, user_id: str) -> GroupMemberRecord:
    m = db.query(GroupMemberRecord).filter(
        GroupMemberRecord.group_id == group_id, GroupMemberRecord.user_id == user_id
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    return m


def _require_admin(db: Session, group_id: str, user_id: str) -> GroupMemberRecord:
    m = _require_member(db, group_id, user_id)
    if m.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return m


def _share_group(db: Session, user_a: str, user_b: str) -> bool:
    a_groups = {m.group_id for m in db.query(GroupMemberRecord).filter(GroupMemberRecord.user_id == user_a).all()}
    b_groups = {m.group_id for m in db.query(GroupMemberRecord).filter(GroupMemberRecord.user_id == user_b).all()}
    return bool(a_groups & b_groups)


def _get_request_as_owner(db: Session, request_id: str, owner_id: str) -> PreviewAccessRequestRecord:
    req = db.query(PreviewAccessRequestRecord).filter(PreviewAccessRequestRecord.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Not the owner of this session")
    if req.status != "pending":
        raise HTTPException(status_code=409, detail=f"Request already {req.status}")
    return req


def _req_out(r: PreviewAccessRequestRecord) -> AccessRequestOut:
    return AccessRequestOut(
        id=r.id, session_id=r.session_id,
        requester_id=r.requester_id, requester_email=r.requester_email,
        owner_id=r.owner_id, status=r.status,
    )
