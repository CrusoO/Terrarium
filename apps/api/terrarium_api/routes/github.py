from __future__ import annotations

import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from terrarium_contracts import GitHubPushRequest, GitHubPushResponse, GitHubStatusResponse

from terrarium_api.auth.deps import get_current_user
from terrarium_api.github_sync import (
    GitHubError,
    default_repo_name,
    ensure_repo,
    github_user,
    push_files,
    repo_ready,
    repo_slug,
)
from terrarium_api.session_log import SessionEventLog
from terrarium_api.settings import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_OAUTH_REDIRECT,
    GITHUB_UI_ORIGIN,
    ssl_verify,
)

class GitHubConnectRequest(BaseModel):
    token: str = Field(min_length=8)
    sessionId: str = ""
    setDefault: bool = True
    replaceRepo: bool = False


router = APIRouter()
_STATE_PREFIX = "terrarium:github:oauth:"
_DEVICE_PREFIX = "terrarium:github:device:"


def _is_github_app_client() -> bool:
    prefix = GITHUB_CLIENT_ID.lower()
    return prefix.startswith("ov23") or prefix.startswith("iv1.")


def _device_key(user_id: str) -> str:
    return f"{_DEVICE_PREFIX}{user_id}"


def _log(request: Request) -> SessionEventLog:
    redis = getattr(request.app.state, "redis", None)
    if redis is None:
        raise HTTPException(status_code=503, detail="Redis pool is not ready.")
    return SessionEventLog(redis)


def _configured() -> bool:
    return bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)


@router.get("/github/status", response_model=GitHubStatusResponse)
async def github_status(
    request: Request,
    sessionId: str = "",
    user: dict[str, str] = Depends(get_current_user),
) -> GitHubStatusResponse:
    log = _log(request)
    token = await log.resolve_github_token(user["id"], sessionId)
    login = None
    if token:
        try:
            login = github_user(token)["login"]
        except GitHubError:
            login = None
    repo = await log.load_github_repo(sessionId) if sessionId else None
    return GitHubStatusResponse(
        configured=_configured(),
        connected=bool(login),
        login=login,
        repo=repo.get("repo") if repo else None,
        htmlUrl=repo.get("htmlUrl") if repo else None,
    )


@router.get("/github/login")
async def github_login(
    request: Request,
    sessionId: str = "",
    user: dict[str, str] = Depends(get_current_user),
) -> RedirectResponse:
    if not _configured():
        raise HTTPException(
            status_code=503,
            detail="Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env, then create a GitHub OAuth App.",
        )
    state = secrets.token_urlsafe(24)
    await _log(request).redis.set(
        f"{_STATE_PREFIX}{state}",
        f"{user['id']}|{sessionId}",
        ex=600,
    )
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "state": state,
        "redirect_uri": GITHUB_OAUTH_REDIRECT,
    }
    # GitHub Apps (Ov23li / Iv1) 404 if the OAuth-app `scope` parameter is sent.
    if not _is_github_app_client():
        params["scope"] = "repo"
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{urlencode(params)}")


@router.post("/github/device/start")
async def github_device_start(
    request: Request,
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, str | int]:
    if not _configured():
        raise HTTPException(status_code=503, detail="GitHub OAuth is not configured.")
    data: dict[str, str] = {"client_id": GITHUB_CLIENT_ID}
    if not _is_github_app_client():
        data["scope"] = "repo"
    async with httpx.AsyncClient(timeout=20.0, verify=ssl_verify()) as client:
        response = await client.post(
            "https://github.com/login/device/code",
            headers={"Accept": "application/json"},
            data=data,
        )
    body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
    device_code = str(body.get("device_code") or "").strip()
    user_code = str(body.get("user_code") or "").strip()
    if response.status_code >= 400 or not device_code or not user_code:
        raise HTTPException(
            status_code=400,
            detail=(
                "Enable Device Flow on the GitHub app (checkbox on the app settings page), save, then try again."
            ),
        )
    await _log(request).redis.set(
        _device_key(user["id"]),
        device_code,
        ex=int(body.get("expires_in") or 900),
    )
    return {
        "userCode": user_code,
        "verificationUri": str(body.get("verification_uri") or "https://github.com/login/device"),
        "interval": int(body.get("interval") or 5),
    }


@router.post("/github/device/poll")
async def github_device_poll(
    request: Request,
    sessionId: str = "",
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, bool]:
    log = _log(request)
    raw = await log.redis.get(_device_key(user["id"]))
    if not raw:
        raise HTTPException(status_code=400, detail="GitHub login expired. Click the GitHub button again.")
    device_code = raw.decode() if isinstance(raw, bytes) else str(raw)
    async with httpx.AsyncClient(timeout=20.0, verify=ssl_verify()) as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "device_code": device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            },
        )
    body = response.json()
    error = str(body.get("error") or "")
    if error in {"authorization_pending", "slow_down"}:
        return {"connected": False, "pending": True}
    token = str(body.get("access_token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="GitHub login was denied or expired.")
    await log.redis.delete(_device_key(user["id"]))
    await log.save_github_token(user["id"], token)
    if sessionId:
        existing = await log.load_github_repo(sessionId)
        if not repo_ready(existing):
            stub = dict(existing or {})
            stub["userId"] = user["id"]
            await log.save_github_repo(sessionId, stub)
    return {"connected": True, "pending": False}


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str = "",
    state: str = "",
) -> RedirectResponse:
    log = _log(request)
    raw = await log.redis.get(f"{_STATE_PREFIX}{state}") if state else None
    if not raw or not code:
        return RedirectResponse(f"{GITHUB_UI_ORIGIN}/?github=error")
    packed = raw.decode() if isinstance(raw, bytes) else str(raw)
    user_id, _, session_id = packed.partition("|")
    await log.redis.delete(f"{_STATE_PREFIX}{state}")
    async with httpx.AsyncClient(timeout=20.0, verify=ssl_verify()) as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_OAUTH_REDIRECT,
            },
        )
    body = token_res.json()
    token = str(body.get("access_token") or "").strip()
    if not token:
        return RedirectResponse(f"{GITHUB_UI_ORIGIN}/?github=error")
    await log.save_github_token(user_id, token)
    if session_id:
        existing = await log.load_github_repo(session_id)
        if not repo_ready(existing):
            stub = dict(existing or {})
            stub["userId"] = user_id
            await log.save_github_repo(session_id, stub)
    query = urlencode({"github": "connected", "session": session_id})
    return RedirectResponse(f"{GITHUB_UI_ORIGIN}/?{query}")


@router.post("/github/connect")
async def github_connect(
    body: GitHubConnectRequest,
    request: Request,
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, str | bool]:
    token = body.token.strip()
    try:
        login = github_user(token)["login"]
    except GitHubError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    log = _log(request)
    if body.setDefault:
        await log.save_github_token(user["id"], token)
    if body.sessionId:
        await log.save_github_session_token(body.sessionId, token)
        if body.replaceRepo or not repo_ready(await log.load_github_repo(body.sessionId)):
            await log.save_github_repo(body.sessionId, {"userId": user["id"]})
    return {"connected": True, "login": login}


@router.post("/github/push", response_model=GitHubPushResponse)
async def github_push(
    body: GitHubPushRequest,
    request: Request,
    user: dict[str, str] = Depends(get_current_user),
) -> GitHubPushResponse:
    log = _log(request)
    token = await log.resolve_github_token(user["id"], body.sessionId)
    if not token:
        raise HTTPException(status_code=401, detail="Connect GitHub first.")
    if not await log.load_github_session_token(body.sessionId):
        await log.save_github_session_token(body.sessionId, token)
    files = await log.load_files(body.sessionId)
    if not files:
        raise HTTPException(status_code=409, detail="No generated files to push yet.")
    try:
        binding = await log.load_github_repo(body.sessionId)
        created = not repo_ready(binding)
        if created:
            name = repo_slug(body.repoName or default_repo_name(body.sessionId), body.sessionId)
            binding = ensure_repo(
                token,
                name,
                body.description or "Generated with Terrarium",
                private=True if body.private is None else body.private,
            )
            binding["userId"] = user["id"]
            await log.save_github_repo(body.sessionId, binding)
        push_files(token, binding, files, body.message or "Update generated app from Terrarium")
        await log.save_github_repo(body.sessionId, binding)
    except GitHubError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return GitHubPushResponse(
        htmlUrl=binding.get("htmlUrl") or "",
        repo=f"{binding.get('owner')}/{binding.get('repo')}",
        created=created,
    )
