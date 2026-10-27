from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from terrarium_contracts import ChangeRequest

from terrarium_relay.commands import parse_command
from terrarium_relay.storage import RelayStore, utc_now
from terrarium_relay.webhook import verify_meta_signature, verify_twilio_signature

_store: RelayStore | None = None


def get_store() -> RelayStore:
    global _store
    if _store is None:
        _store = RelayStore()
    return _store


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(_lease_sweeper())
    yield
    task.cancel()


app = FastAPI(title="Terrarium Relay", version="0.0.0", lifespan=lifespan)


async def _lease_sweeper() -> None:
    while True:
        get_store().release_expired_leases()
        await asyncio.sleep(30)


def _worker_auth(authorization: str | None = Header(default=None)) -> str:
    tokens = {t.strip() for t in os.environ.get("WORKER_TOKENS", "").split(",") if t.strip()}
    if not tokens:
        raise HTTPException(status_code=503, detail="WORKER_TOKENS not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if token not in tokens:
        raise HTTPException(status_code=403, detail="Invalid worker token")
    return token


@app.post("/channels/whatsapp/webhook")
async def whatsapp_webhook(request: Request) -> dict[str, str]:
    body = await request.body()
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    provider = os.environ.get("WHATSAPP_PROVIDER", "twilio").lower()
    if provider == "twilio":
        if not verify_twilio_signature(url, body, signature):
            raise HTTPException(status_code=403, detail="Invalid signature")
    elif provider == "meta":
        meta_sig = request.headers.get("X-Hub-Signature-256", "")
        if not verify_meta_signature(body, meta_sig):
            raise HTTPException(status_code=403, detail="Invalid signature")
    form = await request.form()
    external_id = str(form.get("MessageSid") or form.get("id") or "")
    from_addr = str(form.get("From") or form.get("from") or "")
    text = str(form.get("Body") or form.get("text") or "").strip()
    store = get_store()
    if store.is_duplicate(external_id):
        return {"status": "ignored"}
    cmd, arg = parse_command(text)
    if cmd == "LINK":
        if store.consume_link_code(arg, from_addr):
            store.enqueue_reply(from_addr, "WhatsApp linked. Send your change request anytime.")
            return {"status": "linked"}
        store.enqueue_reply(from_addr, "Invalid or expired code. Generate a new code in Terrarium settings.")
        return {"status": "link_failed"}

    if store.rate_limit_exceeded(from_addr):
        raise HTTPException(status_code=429, detail="Daily limit exceeded")

    actor = store.resolve_actor(from_addr)
    if actor is None:
        store.enqueue_reply(from_addr, "Link WhatsApp in Terrarium settings with your 6-digit code.")
        return {"status": "link_required"}

    if cmd != "CHANGE":
        active = store.find_active_for_actor(actor)
        if active is None:
            store.enqueue_reply(from_addr, "No active change request for that command.")
            return {"status": "no_active_request", "command": cmd}
        store.record_command(active.id, f"{cmd} {arg}".strip())
        store.enqueue_reply(from_addr, f"Received {cmd}.")
        return {"status": "command", "command": cmd, "requestId": active.id}

    change = store.create_request(actor_id=actor, external_message_id=external_id, text=arg or text)
    worker_online = store.worker_online()
    reply = (
        "Starting now"
        if worker_online
        else "Queued — your workstation is offline, I'll start when it's back"
    )
    store.enqueue_reply(from_addr, reply)
    return {"status": "ok", "requestId": change.id}


@app.post("/worker/requests/claim", response_model=None)
def claim_request(_token: str = Depends(_worker_auth)):
    from fastapi import Response

    item = get_store().claim_next(_token)
    if item is None:
        return Response(status_code=204)
    return item


@app.post("/worker/requests/{request_id}/heartbeat")
def heartbeat(request_id: str, _token: str = Depends(_worker_auth)) -> dict[str, str]:
    get_store().heartbeat(request_id, _token)
    return {"status": "ok"}


@app.post("/worker/requests/{request_id}/status")
def update_status(
    request_id: str,
    payload: dict,
    _token: str = Depends(_worker_auth),
) -> dict[str, str]:
    store = get_store()
    store.update_status(request_id, payload)
    reply = str(payload.get("replyText") or "")
    if reply:
        store.send_whatsapp_reply(request_id, reply)
    return {"status": "ok"}


@app.get("/worker/requests/{request_id}/commands")
def pending_commands(request_id: str, _token: str = Depends(_worker_auth)) -> dict[str, list[str]]:
    return {"commands": get_store().pending_commands(request_id)}


@app.get("/worker/requests/{request_id}")
def get_request(request_id: str, _token: str = Depends(_worker_auth)) -> ChangeRequest:
    item = get_store().get_request(request_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Unknown request")
    return item


@app.post("/worker/commands/drain")
def drain_commands(_token: str = Depends(_worker_auth)) -> dict[str, list[dict[str, str]]]:
    store = get_store()
    items = []
    for request_id, command in store.drain_pending_commands():
        items.append({"requestId": request_id, "command": command})
    return {"items": items}


@app.get("/admin/actors/{actor_id}/address")
def actor_address(actor_id: str, _token: str = Depends(_worker_auth)) -> dict[str, str | None]:
    address = get_store().actor_address(actor_id)
    return {"address": address}


@app.post("/admin/outbound")
def admin_outbound(payload: dict, _token: str = Depends(_worker_auth)) -> dict[str, str]:
    address = str(payload.get("address") or "")
    text = str(payload.get("text") or "")
    if not address or not text:
        raise HTTPException(status_code=400, detail="address and text required")
    get_store().enqueue_reply(address, text)
    return {"status": "queued"}


@app.get("/admin/outbound/pending")
def outbound_pending(_token: str = Depends(_worker_auth)) -> dict[str, list[dict[str, str]]]:
    store = get_store()
    with store._connect() as conn:
        rows = conn.execute("SELECT rowid, address, text FROM outbound_replies ORDER BY rowid").fetchall()
        conn.execute("DELETE FROM outbound_replies")
    return {"messages": [{"address": str(r["address"]), "text": str(r["text"])} for r in rows]}


@app.post("/admin/link-codes")
def create_link_code(payload: dict, authorization: str | None = Header(default=None)) -> dict[str, str]:
    _worker_auth(authorization)
    actor_id = str(payload.get("actorId") or "")
    code = str(payload.get("code") or "")
    expires = str(payload.get("expiresAt") or "")
    if not actor_id or not code:
        raise HTTPException(status_code=400, detail="actorId and code required")
    get_store().store_link_code(actor_id, code, expires)
    return {"status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "at": utc_now().isoformat()}
