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


def _upstream(slug: str, port: int, path: str, query: str) -> str:
    if port == 5173:
        child_path = path.lstrip("/")
        target_path = f"preview/{slug}/{child_path}" if child_path else f"preview/{slug}/"
    else:
        target_path = path.lstrip("/")
    target = f"http://{config.CONTAINER_PREFIX}{slug}:{port}/{target_path}"
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

    errors: list[Exception] = []
    upstream = None
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            for port in (5173, 80):
                try:
                    headers = {"host": f"localhost:{port}"} if port == 5173 else None
                    upstream = await client.request(
                        request.method,
                        _upstream(clean, port, path, request.url.query),
                        headers=headers,
                    )
                    break
                except httpx.RequestError as error:
                    errors.append(error)
                    continue
    except httpx.RequestError as error:
        errors.append(error)
    if upstream is None:
        raise HTTPException(
            status_code=502,
            detail=f"Preview container is not reachable ({clean}).",
        ) from (errors[-1] if errors else None)

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
        prefix = f'/preview/{clean}/'.encode()
        body = re.sub(
            rb'((?:src|href)=["\'])/(?!/|preview/|https?:)([^"\']+)',
            rb"\1" + prefix + rb"\2",
            body,
        )
        headers.pop("etag", None)
    return Response(content=body, status_code=upstream.status_code, headers=headers)
