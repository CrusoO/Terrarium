"""Self-Healing Agent — read sandbox logs, pick Editor vs Code Generator, cap 3."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

from terrarium_contracts import AgentJob, ErrorContext, IntentAgentInput

from terrarium_agents.intent import classify_intent
from terrarium_agents.llm import agents_mode, complete_json

logger = logging.getLogger(__name__)

MAX_HEAL_ATTEMPTS = 3
HealRoute = Literal["editor", "codegen"]


class HealAgentError(ValueError):
    pass


@dataclass(frozen=True)
class HealDecision:
    route: HealRoute
    reason: str


def next_heal_attempt(failed: int) -> int | None:
    """Return the next attempt number (1–3), or None once the cap is hit."""
    nxt = failed + 1
    if nxt > MAX_HEAL_ATTEMPTS:
        return None
    return nxt


def run_heal(job: AgentJob) -> HealDecision:
    """Decide Editor vs regenerate. Never talks to Docker. Never writes a FileMap."""
    ctx = job.errorContext
    if ctx is None:
        raise HealAgentError("Self-Healing needs errorContext with logs")
    attempt = ctx.healAttempt if ctx.healAttempt is not None else 0
    if attempt < 1 or attempt > MAX_HEAL_ATTEMPTS:
        raise HealAgentError(
            f"healAttempt must be 1–{MAX_HEAL_ATTEMPTS}, got {attempt}"
        )

    routed = _route_through_intent(job, ctx, attempt)
    if agents_mode() == "live":
        override = _maybe_llm_route(job, ctx, attempt)
        if override:
            if override.route == "editor" and not job.files:
                return HealDecision(route="codegen", reason="no FileMap; regenerate")
            return override
    return routed


def _route_through_intent(
    job: AgentJob, ctx: ErrorContext, attempt: int
) -> HealDecision:
    prompt = (
        f"{job.prompt}\n\nThe sandbox preview failed "
        f"(heal attempt {attempt}/{MAX_HEAL_ATTEMPTS}). "
        f"Health={ctx.health}. Logs:\n{ctx.logs[:4000]}"
    )
    intent = classify_intent(
        IntentAgentInput(
            prompt=prompt,
            sessionId=job.sessionId,
            files=job.files,
            toolId=job.intent.toolId,
        )
    )
    if intent.kind == "modify" and job.files:
        return HealDecision(route="editor", reason="intent kind=modify")
    return HealDecision(route="codegen", reason="intent kind=new or no FileMap")


def _maybe_llm_route(
    job: AgentJob, ctx: ErrorContext, attempt: int
) -> HealDecision | None:
    payload = complete_json(
        (
            "You are Terrarium's self-healing router. Return JSON only: "
            '{"route":"editor"|"codegen","reason":"one line"}. '
            "editor = patch the current FileMap. codegen = regenerate. "
            "No Docker. No file contents."
        ),
        (
            f"attempt={attempt}/{MAX_HEAL_ATTEMPTS}\n"
            f"health={ctx.health}\n"
            f"hasFiles={bool(job.files)}\n"
            f"summary={job.intent.summary}\n"
            f"prompt={job.prompt}\n"
            f"logs={ctx.logs[:3000]}"
        ),
        purpose="codegen",
    )
    if not payload:
        return None
    route = payload.get("route")
    if route not in {"editor", "codegen"}:
        return None
    reason = str(payload.get("reason") or f"llm chose {route}")[:200]
    return HealDecision(route=route, reason=reason)
