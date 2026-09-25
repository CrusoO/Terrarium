"""Resolve group member emails from Firestore using the caller's Firebase token."""
from __future__ import annotations

import logging

import httpx

from terrarium_api.settings import FIREBASE_PROJECT_ID

logger = logging.getLogger(__name__)

_QUERY_URL = (
    f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}"
    "/databases/(default)/documents:runQuery"
)


def group_member_emails(token: str, user_email: str) -> set[str]:
    """Emails of every member in any group the user belongs to, including themselves."""
    if not token or not user_email:
        return set()
    body = {
        "structuredQuery": {
            "from": [{"collectionId": "groups"}],
            "where": {
                "fieldFilter": {
                    "field": {"fieldPath": "memberEmails"},
                    "op": "ARRAY_CONTAINS",
                    "value": {"stringValue": user_email},
                }
            },
        }
    }
    try:
        response = httpx.post(
            _QUERY_URL,
            json=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=8,
            verify=False,
        )
        response.raise_for_status()
    except Exception:
        logger.exception("Firestore group lookup failed")
        return set()

    emails: set[str] = {user_email.strip().lower()}
    for row in response.json():
        fields = (row.get("document") or {}).get("fields") or {}
        values = (fields.get("memberEmails") or {}).get("arrayValue", {}).get("values") or []
        for value in values:
            email = value.get("stringValue")
            if email:
                emails.add(email.strip().lower())
    return emails


def user_group_ids(token: str, user_email: str) -> set[str]:
    """Firestore group document IDs the user belongs to."""
    if not token or not user_email:
        return set()
    body = {
        "structuredQuery": {
            "from": [{"collectionId": "groups"}],
            "where": {
                "fieldFilter": {
                    "field": {"fieldPath": "memberEmails"},
                    "op": "ARRAY_CONTAINS",
                    "value": {"stringValue": user_email.strip().lower()},
                }
            },
        }
    }
    try:
        response = httpx.post(
            _QUERY_URL,
            json=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=8,
            verify=False,
        )
        response.raise_for_status()
    except Exception:
        logger.exception("Firestore group-id lookup failed")
        return set()

    ids: set[str] = set()
    for row in response.json():
        name = (row.get("document") or {}).get("name") or ""
        group_id = name.rsplit("/", 1)[-1]
        if group_id:
            ids.add(group_id)
    return ids


def email_in_group(token: str, group_id: str, user_email: str) -> bool:
    if not token or not group_id or not user_email:
        return False
    url = (
        f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}"
        f"/databases/(default)/documents/groups/{group_id}"
    )
    try:
        response = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
            verify=False,
        )
        if response.status_code == 404:
            return False
        response.raise_for_status()
    except Exception:
        logger.exception("Firestore group membership lookup failed")
        return False
    values = (
        (response.json().get("fields") or {})
        .get("memberEmails", {})
        .get("arrayValue", {})
        .get("values")
        or []
    )
    wanted = user_email.strip().lower()
    return any((value.get("stringValue") or "").strip().lower() == wanted for value in values)


def has_approved_access(token: str, tool_id: str, requester_id: str) -> bool:
    """True when the app owner has approved this user's request in Firestore."""
    if not token or not tool_id or not requester_id:
        return False
    url = (
        f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}"
        f"/databases/(default)/documents/access_requests/{tool_id}_{requester_id}"
    )
    try:
        response = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
            verify=False,
        )
        if response.status_code == 404:
            return False
        response.raise_for_status()
    except Exception:
        logger.exception("Firestore access-request lookup failed")
        return False
    status = (
        (response.json().get("fields") or {})
        .get("status", {})
        .get("stringValue", "")
    )
    return status == "approved"
