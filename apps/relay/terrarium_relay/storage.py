from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from terrarium_contracts import ChangeRequest, ChangeRequestStatus

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RelayStore:
    def __init__(self) -> None:
        self._path = Path(os.environ.get("RELAY_SQLITE_PATH", "relay.db"))
        self._init_db()

    @property
    def db_path(self) -> Path:
        return self._path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._path, timeout=30)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS change_requests (
                    id TEXT PRIMARY KEY,
                    channel TEXT,
                    external_message_id TEXT UNIQUE,
                    actor_id TEXT,
                    text TEXT,
                    status TEXT,
                    lease_owner TEXT,
                    lease_expires_at TEXT,
                    created_at TEXT,
                    updated_at TEXT
                );
                CREATE TABLE IF NOT EXISTS channel_links (
                    actor_id TEXT,
                    channel TEXT,
                    address TEXT UNIQUE,
                    verified_at TEXT
                );
                CREATE TABLE IF NOT EXISTS worker_heartbeats (
                    worker_id TEXT PRIMARY KEY,
                    at TEXT
                );
                CREATE TABLE IF NOT EXISTS pending_commands (
                    request_id TEXT,
                    command TEXT
                );
                CREATE TABLE IF NOT EXISTS link_codes (
                    code TEXT PRIMARY KEY,
                    actor_id TEXT,
                    expires_at TEXT
                );
                CREATE TABLE IF NOT EXISTS outbound_replies (
                    address TEXT,
                    text TEXT
                );
                """
            )
            self._ensure_column(conn, "change_requests", "tool_id", "TEXT")
            self._ensure_column(conn, "change_requests", "draft_version_id", "TEXT")
            self._ensure_column(conn, "change_requests", "proposed_checks", "TEXT")
            self._ensure_column(conn, "change_requests", "reply_address", "TEXT")

    def _ensure_column(self, conn: sqlite3.Connection, table: str, column: str, ddl: str) -> None:
        cols = {str(row[1]) for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        if column not in cols:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")

    def _row_to_request(self, row: sqlite3.Row) -> ChangeRequest:
        proposed = None
        raw_checks = row["proposed_checks"] if "proposed_checks" in row.keys() else None
        if raw_checks:
            try:
                proposed = json.loads(str(raw_checks))
            except json.JSONDecodeError:
                proposed = None
        tool_id = row["tool_id"] if "tool_id" in row.keys() else None
        draft_version_id = row["draft_version_id"] if "draft_version_id" in row.keys() else None
        return ChangeRequest(
            id=row["id"],
            channel=row["channel"],  # type: ignore[arg-type]
            externalMessageId=row["external_message_id"],
            actorId=row["actor_id"],
            toolId=str(tool_id) if tool_id else None,
            text=row["text"],
            status=row["status"],  # type: ignore[arg-type]
            draftVersionId=str(draft_version_id) if draft_version_id else None,
            proposedChecks=proposed,
            leaseOwner=row["lease_owner"],
            leaseExpiresAt=row["lease_expires_at"],
            createdAt=row["created_at"],
            updatedAt=row["updated_at"],
        )

    def is_duplicate(self, external_id: str) -> bool:
        if not external_id:
            return False
        with self._connect() as conn:
            row = conn.execute(
                "SELECT 1 FROM change_requests WHERE external_message_id = ?",
                (external_id,),
            ).fetchone()
        return row is not None

    def resolve_actor(self, address: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT actor_id FROM channel_links WHERE address = ?",
                (address,),
            ).fetchone()
        return str(row["actor_id"]) if row else None

    def create_request(self, *, actor_id: str, external_message_id: str, text: str) -> ChangeRequest:
        now = utc_now().isoformat()
        item = ChangeRequest(
            id=uuid4().hex,
            channel="whatsapp",
            externalMessageId=external_message_id,
            actorId=actor_id,
            text=text,
            status="queued",
            createdAt=now,
            updatedAt=now,
        )
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO change_requests
                (id, channel, external_message_id, actor_id, text, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.id,
                    item.channel,
                    item.externalMessageId,
                    item.actorId,
                    item.text,
                    item.status,
                    item.createdAt,
                    item.updatedAt,
                ),
            )
        return item

    def enqueue_reply(self, address: str, text: str) -> None:
        with self._connect() as conn:
            conn.execute("INSERT INTO outbound_replies (address, text) VALUES (?, ?)", (address, text))

    def worker_online(self) -> bool:
        with self._connect() as conn:
            row = conn.execute("SELECT at FROM worker_heartbeats ORDER BY at DESC LIMIT 1").fetchone()
        if not row:
            return False
        last = datetime.fromisoformat(str(row["at"]))
        return (utc_now() - last) < timedelta(minutes=2)

    def claim_next(self, worker_id: str) -> ChangeRequest | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM change_requests WHERE status = 'queued' ORDER BY created_at LIMIT 1"
            ).fetchone()
            if not row:
                return None
            lease = (utc_now() + timedelta(minutes=10)).isoformat()
            conn.execute(
                """
                UPDATE change_requests
                SET status = 'claimed', lease_owner = ?, lease_expires_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (worker_id, lease, utc_now().isoformat(), row["id"]),
            )
            conn.execute(
                "INSERT OR REPLACE INTO worker_heartbeats (worker_id, at) VALUES (?, ?)",
                (worker_id, utc_now().isoformat()),
            )
        refreshed = conn.execute("SELECT * FROM change_requests WHERE id = ?", (row["id"],)).fetchone()
        item = self._row_to_request(refreshed)
        return item.model_copy(
            update={
                "status": "claimed",
                "leaseOwner": worker_id,
                "leaseExpiresAt": lease,
                "updatedAt": utc_now().isoformat(),
            }
        )

    def release_expired_leases(self) -> None:
        now = utc_now().isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE change_requests
                SET status = 'queued', lease_owner = NULL, lease_expires_at = NULL, updated_at = ?
                WHERE status = 'claimed' AND lease_expires_at IS NOT NULL AND lease_expires_at < ?
                """,
                (now, now),
            )

    def heartbeat(self, request_id: str, worker_id: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO worker_heartbeats (worker_id, at) VALUES (?, ?)",
                (worker_id, utc_now().isoformat()),
            )
            conn.execute(
                "UPDATE change_requests SET updated_at = ? WHERE id = ? AND lease_owner = ?",
                (utc_now().isoformat(), request_id, worker_id),
            )

    def update_status(self, request_id: str, payload: dict) -> None:
        status = str(payload.get("status") or "building")
        tool_id = payload.get("toolId")
        draft_version_id = payload.get("draftVersionId")
        proposed = payload.get("proposedChecks")
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE change_requests
                SET status = ?, updated_at = ?, tool_id = COALESCE(?, tool_id),
                    draft_version_id = COALESCE(?, draft_version_id),
                    proposed_checks = COALESCE(?, proposed_checks)
                WHERE id = ?
                """,
                (
                    status,
                    utc_now().isoformat(),
                    str(tool_id) if tool_id else None,
                    str(draft_version_id) if draft_version_id else None,
                    json.dumps(proposed) if proposed is not None else None,
                    request_id,
                ),
            )

    def get_request(self, request_id: str) -> ChangeRequest | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM change_requests WHERE id = ?", (request_id,)).fetchone()
        return self._row_to_request(row) if row else None

    def find_active_for_actor(self, actor_id: str) -> ChangeRequest | None:
        active = (
            "awaiting_test_approval",
            "ready_for_review",
            "claimed",
            "building",
        )
        placeholders = ",".join("?" for _ in active)
        with self._connect() as conn:
            row = conn.execute(
                f"""
                SELECT * FROM change_requests
                WHERE actor_id = ? AND status IN ({placeholders})
                ORDER BY updated_at DESC LIMIT 1
                """,
                (actor_id, *active),
            ).fetchone()
        return self._row_to_request(row) if row else None

    def record_command(self, request_id: str, command: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO pending_commands (request_id, command) VALUES (?, ?)",
                (request_id, command.strip()),
            )

    def drain_pending_commands(self) -> list[tuple[str, str]]:
        """Returns (request_id, command) and removes them from the queue."""
        with self._connect() as conn:
            rows = conn.execute("SELECT rowid, request_id, command FROM pending_commands ORDER BY rowid").fetchall()
            for row in rows:
                conn.execute("DELETE FROM pending_commands WHERE rowid = ?", (row["rowid"],))
        return [(str(row["request_id"]), str(row["command"])) for row in rows]

    def actor_address(self, actor_id: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT address FROM channel_links WHERE actor_id = ? ORDER BY verified_at DESC LIMIT 1",
                (actor_id,),
            ).fetchone()
        return str(row["address"]) if row else None

    def send_whatsapp_reply(self, request_id: str, text: str) -> None:
        if not text.strip():
            return
        with self._connect() as conn:
            row = conn.execute("SELECT actor_id FROM change_requests WHERE id = ?", (request_id,)).fetchone()
        if not row:
            return
        address = self.actor_address(str(row["actor_id"]))
        if address:
            self.enqueue_reply(address, text)

    def store_link_code(self, actor_id: str, code: str, expires_at: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO link_codes (code, actor_id, expires_at) VALUES (?, ?, ?)",
                (code, actor_id, expires_at),
            )

    def consume_link_code(self, code: str, address: str) -> bool:
        now = utc_now().isoformat()
        with self._connect() as conn:
            row = conn.execute(
                "SELECT actor_id, expires_at FROM link_codes WHERE code = ?",
                (code,),
            ).fetchone()
            if not row or str(row["expires_at"]) < now:
                return False
            conn.execute(
                "INSERT OR REPLACE INTO channel_links (actor_id, channel, address, verified_at) VALUES (?, ?, ?, ?)",
                (row["actor_id"], "whatsapp", address, now),
            )
            conn.execute("DELETE FROM link_codes WHERE code = ?", (code,))
        return True

    def rate_limit_exceeded(self, address: str, *, limit: int = 20) -> bool:
        # Simple daily counter stored in change_requests rows
        day = utc_now().date().isoformat()
        with self._connect() as conn:
            count = conn.execute(
                """
                SELECT COUNT(*) AS c FROM change_requests
                WHERE created_at LIKE ? AND actor_id IN (
                    SELECT actor_id FROM channel_links WHERE address = ?
                )
                """,
                (f"{day}%", address),
            ).fetchone()
        return int(count["c"] if count else 0) >= limit

    def pending_commands(self, request_id: str) -> list[str]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT command FROM pending_commands WHERE request_id = ?",
                (request_id,),
            ).fetchall()
        return [str(row["command"]) for row in rows]
