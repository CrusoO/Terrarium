"""Auth routes (P6-S1 Firebase). Signup/login handled by Firebase SDK on the frontend.
Backend exposes only GET /auth/me to confirm the token and return the actor info."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from terrarium_contracts import AuthResponse, User

from terrarium_api.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthResponse)
def me(user: dict[str, str] = Depends(get_current_user)) -> AuthResponse:
    return AuthResponse(user=User(id=user["id"], email=user["email"]))
