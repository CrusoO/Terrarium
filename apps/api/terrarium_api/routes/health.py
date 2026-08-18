from fastapi import APIRouter
from terrarium_contracts import DEV_USER

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, bool | str]:
    return {"ok": True, "actor": DEV_USER}
