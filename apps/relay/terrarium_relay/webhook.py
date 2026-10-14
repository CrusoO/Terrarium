from __future__ import annotations

import base64
import hashlib
import hmac
import os
from urllib.parse import parse_qsl


def verify_meta_signature(body: bytes, signature: str) -> bool:
    if os.environ.get("RELAY_SKIP_SIGNATURE") == "1":
        return True
    secret = os.environ.get("META_APP_SECRET", "")
    if not secret or not signature.startswith("sha256="):
        return False
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={digest}", signature)


def verify_twilio_signature(url: str, body: bytes, signature: str) -> bool:
    if os.environ.get("RELAY_SKIP_SIGNATURE") == "1":
        return True
    token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    if not token or not signature:
        return False
    params = parse_qsl(body.decode("utf-8"), keep_blank_values=True)
    data = url + "".join(k + v for k, v in sorted(params))
    digest = hmac.new(token.encode("utf-8"), data.encode("utf-8"), hashlib.sha1).digest()
    expected = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(expected, signature)
