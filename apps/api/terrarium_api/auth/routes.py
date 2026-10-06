"""Auth routes (P6-S1 Firebase). Signup/login stay on the Firebase SDK."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response

from terrarium_contracts import AuthResponse, User

from terrarium_api.auth.deps import extract_token, get_current_user
from terrarium_api.settings import AUTH_COOKIE

router = APIRouter(prefix="/auth", tags=["auth"])

_SESSION_MAX_AGE = 24 * 60 * 60


def _set_session_cookie(request: Request, response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE,
        value=token,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
        max_age=_SESSION_MAX_AGE,
    )


@router.get("/me", response_model=AuthResponse)
def me(user: dict[str, str] = Depends(get_current_user)) -> AuthResponse:
    return AuthResponse(user=User(id=user["id"], email=user["email"]))


@router.post("/session", response_model=AuthResponse)
def start_session(
    request: Request,
    response: Response,
    user: dict[str, str] = Depends(get_current_user),
) -> AuthResponse:
    token = extract_token(request)
    if token:
        _set_session_cookie(request, response, token)
    return AuthResponse(user=User(id=user["id"], email=user["email"]))


@router.delete("/session")
def end_session(response: Response) -> dict[str, bool]:
    response.delete_cookie(AUTH_COOKIE, path="/")
    return {"ok": True}
