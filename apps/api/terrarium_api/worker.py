from __future__ import annotations

import asyncio
import logging

from terrarium_api.settings import redis_settings
from terrarium_agents import IntentError, classify_intent
from terrarium_agents.llm import agents_mode, intent_model
from terrarium_contracts import (
    ConversationTurn,
    Intent,
    IntentAgentInput,
    PreviewReadyPayload,
    SandboxReadyPayload,
)
from terrarium_sandbox import SandboxError, SandboxRunner

from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog
from terrarium_api.stub import echo_filemap

logger = logging.getLogger(__name__)


def classify_session_intent(
    session_id: str,
    prompt: str,
    *,
    files: dict[str, str] | None = None,
    tool_id: str | None = None,
    conversation: list[ConversationTurn] | None = None,
) -> Intent:
    """Intent Agent only — no FileMap writes, no Docker."""
    return classify_intent(
        IntentAgentInput(
            prompt=prompt,
            sessionId=session_id,
            files=files,
            toolId=tool_id,
            conversation=conversation,
        )
    )


async def run_stub_session(ctx: dict, session_id: str, prompt: str) -> None:
    """Classify intent. Boot Docker only when phase is ready."""
    log = SessionEventLog(ctx["redis"])
    history = [
        ConversationTurn.model_validate(item)
        for item in await log.load_conversation(session_id)
    ]
    try:
        intent = await asyncio.to_thread(
            classify_session_intent,
            session_id,
            prompt,
            conversation=history,
        )
    except IntentError as error:
        logger.exception("Intent classification failed for %s", session_id)
        await log.append(
            make_event("sandbox.unhealthy", session_id, {"logs": str(error)})
        )
        return

    logger.info(
        "Intent %s phase=%s kind=%s stack=%s questions=%s summary=%s",
        session_id,
        intent.phase,
        intent.kind,
        intent.stack,
        len(intent.questions or []),
        intent.summary,
    )

    history.append(ConversationTurn(role="user", text=prompt))
    assistant_text = (intent.reply or "").strip()
    if intent.questions:
        numbered = "\n".join(
            f"{index}. {question}"
            for index, question in enumerate(intent.questions, start=1)
        )
        assistant_text = f"{assistant_text}\n{numbered}".strip()
    if assistant_text:
        history.append(ConversationTurn(role="assistant", text=assistant_text))
    await log.save_conversation(
        session_id, [turn.model_dump() for turn in history]
    )

    await log.append(
        make_event(
            "intent.classified",
            session_id,
            intent.model_dump(exclude_none=True),
        )
    )

    if intent.phase != "ready":
        return

    files = echo_filemap(prompt)
    await log.save_files(session_id, files)
    await log.append(
        make_event(
            "sandbox.booting",
            session_id,
            {"files": list(files.keys())},
        )
    )
    try:
        handle = await asyncio.to_thread(SandboxRunner().start, session_id)
    except SandboxError as error:
        logger.exception("Sandbox start failed for %s", session_id)
        await log.append(
            make_event("sandbox.unhealthy", session_id, {"logs": str(error)})
        )
        return
    except Exception as error:
        logger.exception("Unexpected sandbox failure for %s", session_id)
        await log.append(
            make_event("sandbox.unhealthy", session_id, {"logs": str(error)})
        )
        return

    ready = SandboxReadyPayload(
        previewUrl=handle.previewUrl, containerId=handle.containerId
    )
    await log.append(make_event("sandbox.ready", session_id, ready.model_dump()))
    preview = PreviewReadyPayload(previewUrl=handle.previewUrl)
    await log.append(make_event("preview.ready", session_id, preview.model_dump()))


async def on_startup(ctx: dict) -> None:
    logger.info(
        "Terrarium ARQ worker started (intent mode=%s model=%s)",
        agents_mode(),
        intent_model(),
    )


class WorkerSettings:
    functions = [run_stub_session]
    on_startup = on_startup
    redis_settings = redis_settings()
    job_timeout = 180
    max_jobs = 2
