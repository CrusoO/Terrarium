"""Per-file codegen is a canary for allowlisted sessions.

The monolith stays the default. An unsupported archetype, or a low-confidence
classification, falls back to the monolith. TERRARIUM_PER_FILE_CODEGEN=1 forces
the canary path for supported, confident prompts. TERRARIUM_PER_FILE_CODEGEN=0
forces the monolith. Session-id prefixes do not opt in.
"""

from __future__ import annotations

import contextvars
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path

SUPPORTED_ARCHETYPES = frozenset({"crud", "dashboard", "booking", "landing", "charts", "multi-step-form"})
# Game, auth, and file-upload stay on the monolith. Landing, charts, and the
# wizard are packs. Confidence below this cutoff also stays on the monolith.
LOW_CONFIDENCE = 0.6
ARCHETYPES = (
    "crud",
    "dashboard",
    "booking",
    "landing",
    "multi-step-form",
    "charts",
    "auth",
    "file-upload",
    "game",
)

_RULES: tuple[tuple[str, str], ...] = (
    ("game", r"\b(game|puzzle|tetris|quiz bowl|play a round)\b"),
    ("file-upload", r"\b(upload|drop a file|attach a file|file picker)\b"),
    ("auth", r"\b(sign in|log in|login|password|create an account|register)\b"),
    ("charts", r"\b(chart|bar graph|line graph|sparkline|plot )\b"),
    ("multi-step-form", r"\b(multi-step|wizard|step 1 of|next step)\b"),
    ("landing", r"\b(landing page|marketing page|hero section|pricing section)\b"),
    ("booking", r"\b(book a|booking|appointment|reservation|reserve a)\b"),
    ("crud", r"\b(e-?commerce|online store|storefront)\b"),
    ("dashboard", r"\b(dashboard|analytics|overdue totals|kpi)\b"),
)

_CRUD_SIGNALS: tuple[str, ...] = (
    r"\bsearch\b",
    r"\bfilter\b",
    r"\badd (?:a|an)\b",
    r"\bdetail\b",
    r"\b(?:list|tracker|roster|inventory|checkout)\b",
)

_actor_email: contextvars.ContextVar[str] = contextvars.ContextVar("terrarium_actor_email", default="")


@dataclass(frozen=True)
class Classification:
    archetype: str
    confidence: float
    reason: str

    @property
    def low_confidence(self) -> bool:
        return self.confidence < LOW_CONFIDENCE

# Forty prompts that are not the original ten catalogue apps.
HOLDOUT: tuple[tuple[str, str], ...] = (
    ("crud", "Build a library checkout desk. Librarians search books, filter by status, add a book, and open its detail."),
    ("crud", "Build a kennel roster. Staff search dogs, filter by status, add a dog, and open its detail."),
    ("crud", "Build a parts bin. Mechanics search parts, filter by condition, add a part, and open its detail."),
    ("crud", "Build a volunteer list. Coordinators search volunteers, filter by status, add a volunteer, and open a detail."),
    ("crud", "Build a farm stand price list. Staff search produce, filter by status, add an item, and open its detail."),
    ("crud", "Build a clinic supply list. Nurses search supplies, filter by status, add a supply, and open its detail."),
    ("dashboard", "Build a bakery dashboard. Bakers search orders, filter by status, and see overdue totals."),
    ("dashboard", "Build a fleet dashboard. Dispatchers search vans, filter by status, and see mileage totals."),
    ("dashboard", "Build a studio dashboard. Producers search sessions, filter by status, and see hour totals."),
    ("dashboard", "Build a warehouse dashboard. Leads search pallets, filter by status, and see weight totals."),
    ("dashboard", "Build a cafe dashboard. Managers search shifts, filter by status, and see tip totals."),
    ("booking", "Build a desk booking board. People book a desk, search reservations, filter by status, and open a reservation."),
    ("booking", "Build a studio booking board. Musicians book a room, search appointments, and open a reservation."),
    ("booking", "Build a court booking board. Players book a court, filter reservations, and open a booking."),
    ("booking", "Build a tour booking board. Guides book a tour, search reservations, and open a booking."),
    ("landing", "Build a landing page for a pottery studio with a hero section, a pricing section, and a short about blurb."),
    ("landing", "Build a marketing page for a bike co-op with a hero section and a pricing section."),
    ("landing", "Build a landing page for a neighborhood bakery with a hero section and a menu teaser."),
    ("landing", "Build a marketing page for a dog walker with a hero section and testimonials."),
    ("landing", "Build a landing page for a plant shop with a hero section and a pricing section."),
    ("multi-step-form", "Build a permit wizard. Step 1 of 3 collects the address, the next step collects the work type, and the last step reviews it."),
    ("multi-step-form", "Build an onboarding wizard. Step 1 of 3 asks for a name, the next step asks for a team, and the last step confirms."),
    ("multi-step-form", "Build a claim wizard. Step 1 of 3 collects the date, the next step collects the amount, and the last step reviews."),
    ("multi-step-form", "Build a registration wizard. Step 1 of 4 collects contact info, then a course, then a waiver, then a review."),
    ("charts", "Build a sales chart page with a bar graph of monthly revenue and a line graph of orders."),
    ("charts", "Build a weather chart page with a line graph of temperature and a bar graph of rainfall."),
    ("charts", "Build a fitness chart page with a sparkline of steps and a bar graph of workouts."),
    ("charts", "Build a budget chart page with a bar graph of spending and a line graph of savings."),
    ("auth", "Build a sign in screen with email, password, and a create an account link."),
    ("auth", "Build a login page with password reset and a register form."),
    ("auth", "Build a member sign in page that asks for a password and shows an error on failure."),
    ("file-upload", "Build a receipt drop box where staff upload a photo of a receipt."),
    ("file-upload", "Build a homework drop box where students attach a file."),
    ("file-upload", "Build a gallery where editors drop a file onto the page."),
    ("game", "Build a memory puzzle game. The player flips cards and matches pairs."),
    ("game", "Build a trivia quiz bowl. The player answers questions and sees a score."),
    ("game", "Build a reaction game. The player taps when the square turns green."),
    ("crud", "Build a tool crib. Supervisors search tools, filter by status, add a tool, and open its detail."),
    ("dashboard", "Build a clinic dashboard. Leads search visits, filter by status, and see wait-time totals as a kpi list."),
    ("booking", "Build a table booking board. Hosts book a table, search reservations, and open a booking."),
)


NOT_SUPPORTED_MESSAGE = "not supported in this demo"
KILL_MESSAGE = "Generation stopped. The kill switch is on."
_SWITCH_ON = {"1", "true", "on", "yes"}


class DemoBlocked(RuntimeError):
    """Stop the session. Do not boot a preview."""

    def __init__(self, message: str, *, retry: bool = False) -> None:
        super().__init__(message)
        self.retry = retry


def demo_mode() -> bool:
    return os.environ.get("DEMO_MODE", "").strip().lower() in _SWITCH_ON


def kill_switch_on() -> bool:
    """Re-read each call so a running session can be stopped mid-generation."""
    if os.environ.get("TERRARIUM_KILL_SWITCH", "").strip().lower() in _SWITCH_ON:
        return True
    raw = os.environ.get("TERRARIUM_KILL_SWITCH_FILE", "").strip()
    if not raw:
        return False
    path = Path(raw)
    if not path.is_file():
        return False
    return path.read_text(encoding="utf-8", errors="ignore").strip().lower() in _SWITCH_ON


# Keyword "unknown" is not a reason to skip intent. Only these archetypes are out of the demo.
_DEMO_HARD_STOP = frozenset({"game", "auth", "file-upload"})


def demo_block_reason(session_id: str, prompt: str) -> str | None:
    """Stop before the model only for a hard out-of-scope prompt, another account, or the kill switch.

    A prompt the keyword router does not recognize still goes to intent, the plan, and codegen.
    """
    if kill_switch_on():
        return KILL_MESSAGE
    if not demo_mode():
        return None
    decision = classify(prompt)
    hard_stop = decision.archetype in _DEMO_HARD_STOP and not decision.low_confidence
    if hard_stop or not is_internal_session(session_id, ""):
        return NOT_SUPPORTED_MESSAGE
    return None


def set_canary_actor(email: str) -> None:
    _actor_email.set((email or "").strip().lower())


def actor_email() -> str:
    return _actor_email.get()


def classify(prompt: str) -> Classification:
    """Best archetype and a confidence. No keyword match is not crud."""
    text = (prompt or "").lower()
    for name, pattern in _RULES:
        if re.search(pattern, text):
            return Classification(name, 0.92, "keyword")
    signals = sum(1 for pattern in _CRUD_SIGNALS if re.search(pattern, text))
    if signals >= 2:
        return Classification("crud", 0.78, f"crud-signals:{signals}")
    if signals == 1:
        return Classification("crud", 0.42, "weak-crud")
    return Classification("unknown", 0.15, "no-match")


def archetype_of(prompt: str) -> str:
    return classify(prompt).archetype


def archetype_supported(prompt: str) -> bool:
    decision = classify(prompt)
    return decision.archetype in SUPPORTED_ARCHETYPES and not decision.low_confidence


def is_internal_session(session_id: str, email: str = "") -> bool:
    """Server-side allowlist only. A session id prefix is not an opt-in."""
    _ = session_id
    address = (email or actor_email()).strip().lower()
    if not address:
        return False
    allowed = {
        item.strip().lower()
        for item in (
            os.environ.get("TERRARIUM_CANARY_EMAILS")
            or "codegen.step0.terrarium@gmail.com,testadmin@gmail.com"
        ).split(",")
        if item.strip()
    }
    return address in allowed or address.endswith("@terrarium.test")


def canary_per_file(session_id: str, prompt: str, email: str = "") -> bool:
    mode = (os.environ.get("TERRARIUM_PER_FILE_CODEGEN") or "canary").strip().lower()
    if mode in {"0", "off", "false"}:
        return False
    if not archetype_supported(prompt):
        return False
    if mode in {"1", "on", "true"}:
        return True
    return is_internal_session(session_id, email)


def shadow_route(prompt: str) -> str:
    """What the router would do, ignoring who the caller is."""
    return "per-file" if archetype_supported(prompt) else "monolith"


def _shadow_path() -> Path | None:
    raw = (os.environ.get("TERRARIUM_ROUTE_LOG") or "").strip()
    if raw:
        return Path(raw)
    candidate = Path("/app/docs/codegen-metrics/route-shadow.jsonl")
    if candidate.parent.is_dir():
        return candidate
    return None


def record_shadow(session_id: str, prompt: str, email: str = "") -> Classification:
    """Log archetype and confidence for every session. Does not change the route."""
    decision = classify(prompt)
    row = {
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sessionId": session_id,
        "archetype": decision.archetype,
        "confidence": decision.confidence,
        "reason": decision.reason,
        "shadowRoute": shadow_route(prompt),
        "served": "per-file" if canary_per_file(session_id, prompt, email) else "monolith",
    }
    path = _shadow_path()
    if path is not None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(row) + "\n")
    return decision
