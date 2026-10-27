from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from terrarium_api.auth.deps import get_current_user
from terrarium_api.brownie_catalog import catalog, sync_projects
from terrarium_api.db import get_db

router = APIRouter()


@router.get("/brownie/catalog")
async def get_brownie_catalog(
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, object]:
    return catalog(db, user["id"])


@router.post("/brownie/catalog/sync")
async def sync_brownie_catalog(
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, object]:
    """Publish the three fictional source projects to the caller's dashboard, then return the catalog."""
    sync_projects(db, user)
    return catalog(db, user["id"])
