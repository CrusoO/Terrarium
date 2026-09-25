"""Verify Firebase ID tokens (Bearer header or ?token= query param for SSE)."""
from __future__ import annotations

import time

import httpx
import jwt
from cryptography.x509 import load_pem_x509_certificate
from fastapi import HTTPException, Request

from terrarium_api.settings import FIREBASE_PROJECT_ID

_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)
_cache: dict[str, object] = {}


def _get_public_keys() -> dict[str, str]:
    now = time.monotonic()
    if _cache.get("expires_at", 0) > now:
        return _cache["keys"]  # type: ignore[return-value]
    # Disable SSL verify to work behind Zscaler corporate proxy.
    response = httpx.get(_CERTS_URL, timeout=5, verify=False)
    response.raise_for_status()
    _cache["keys"] = response.json()
    _cache["expires_at"] = now + 3600
    return _cache["keys"]  # type: ignore[return-value]


def _cert_to_public_key(cert_pem: str):
    """Extract RSA public key object from a PEM-encoded X.509 certificate."""
    cert = load_pem_x509_certificate(cert_pem.encode("utf-8"))
    return cert.public_key()


def _verify(token: str) -> dict[str, str]:
    keys = _get_public_keys()
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as exc:
        raise HTTPException(status_code=401, detail="Malformed token") from exc

    kid = header.get("kid")
    cert_pem = keys.get(str(kid))
    if not cert_pem:
        # Key rotated — clear cache and retry once.
        _cache.clear()
        keys = _get_public_keys()
        cert_pem = keys.get(str(kid))
    if not cert_pem:
        raise HTTPException(status_code=401, detail="Unknown token key ID")

    public_key = _cert_to_public_key(cert_pem)

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    uid: str = payload.get("sub", "")
    email: str = payload.get("email", "")
    if not uid:
        raise HTTPException(status_code=401, detail="Token missing sub claim")
    return {"id": uid, "email": email}


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    # SSE fallback: token passed as query param
    return request.query_params.get("token")


def get_current_user(request: Request) -> dict[str, str]:
    """Require a valid Firebase ID token; raise 401 otherwise."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _verify(token)


def get_optional_user(request: Request) -> dict[str, str] | None:
    """Return user dict if token present, else None."""
    token = _extract_token(request)
    if not token:
        return None
    try:
        return _verify(token)
    except HTTPException:
        return None
