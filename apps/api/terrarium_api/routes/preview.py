from __future__ import annotations

import re

import httpx
from fastapi import APIRouter, HTTPException, Request, Response

from terrarium_sandbox import config, session_slug

router = APIRouter()

_SLUG = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-encoding",
    "content-length",
}


def _upstream(slug: str, path: str, query: str) -> str:
    target = f"http://{config.CONTAINER_PREFIX}{slug}:80/{path.lstrip('/')}"
    if query:
        return f"{target}?{query}"
    return target


@router.api_route("/preview/{slug}", methods=["GET", "HEAD"])
@router.api_route("/preview/{slug}/{path:path}", methods=["GET", "HEAD"])
async def preview_proxy(slug: str, request: Request, path: str = "") -> Response:
    """Same-origin iframe proxy. Avoids Zscaler eating *.nip.io Host routes."""
    try:
        clean = session_slug(slug)
    except Exception as error:
        raise HTTPException(status_code=400, detail="invalid preview session") from error
    if clean != slug.lower() or not _SLUG.match(clean):
        raise HTTPException(status_code=400, detail="invalid preview session")

    url = _upstream(clean, path, request.url.query)
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            upstream = await client.request(request.method, url)
    except httpx.RequestError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Preview container is not reachable ({clean}).",
        ) from error

    headers = {
        key: value
        for key, value in upstream.headers.items()
        if key.lower() not in _HOP
    }
    body = upstream.content
    content_type = upstream.headers.get("content-type", "")
    if "text/html" in content_type and b"<head>" in body[:4000]:
        base = f'<head><base href="/preview/{clean}/">'.encode()
        body = body.replace(b"<head>", base, 1)
        headers.pop("etag", None)
    return Response(content=body, status_code=upstream.status_code, headers=headers)
