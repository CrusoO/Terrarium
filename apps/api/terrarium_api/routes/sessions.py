from fastapi import APIRouter, HTTPException
from terrarium_contracts import CreateSessionRequest, CreateSessionResponse

router = APIRouter()


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session(_body: CreateSessionRequest) -> CreateSessionResponse:
    """Wired in P1-S4: enqueue ARQ job and return sessionId."""
    raise HTTPException(
        status_code=501,
        detail="POST /sessions is implemented in P1-S4.",
    )
