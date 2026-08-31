from __future__ import annotations

import asyncio
import logging

from terrarium_api.settings import redis_settings
from terrarium_agents import EditorAgentError, IntentError, classify_intent, run_editor
from terrarium_agents.llm import agents_mode, intent_model
from terrarium_contracts import AgentJob, ConversationTurn, IntentAgentInput, IntentAgentOutput

from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog

logger = logging.getLogger(__name__)


def classify_session_intent(
    session_id: str,
    prompt: str,
    *,
    files: dict[str, str] | None = None,
    tool_id: str | None = None,
    conversation: list[ConversationTurn] | None = None,
) -> IntentAgentOutput:
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
    """Classify intent and emit intent.classified. Does not write files or start Docker."""
    log = SessionEventLog(ctx["redis"])
    history = [
        ConversationTurn.model_validate(item)
        for item in await log.load_conversation(session_id)
    ]
    files = await log.load_files(session_id)
    tool_id = await log.load_tool_id(session_id)
    try:
        intent = await asyncio.to_thread(
            classify_session_intent,
            session_id,
            prompt,
            files=files,
            tool_id=tool_id,
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
    if intent.toolId:
        await log.save_tool_id(session_id, intent.toolId)

    await log.append(
        make_event(
            "intent.classified",
            session_id,
            intent.model_dump(exclude_none=True),
        )
    )

    if intent.kind == "modify" and intent.phase == "ready" and files:
        await _run_editor_step(log, session_id, prompt, intent, files)


async def _run_editor_step(
    log: SessionEventLog,
    session_id: str,
    prompt: str,
    intent: IntentAgentOutput,
    files: dict[str, str],
) -> None:
    """Emit editor.started, run the editor agent, emit editor.completed."""
    await log.append(make_event("editor.started", session_id))
    try:
        result = await asyncio.to_thread(
            run_editor,
            AgentJob(
                sessionId=session_id,
                intent=intent.as_intent(),
                prompt=prompt,
                files=files,
            ),
        )
    except EditorAgentError as error:
        logger.exception("Editor agent failed for %s", session_id)
        await log.append(
            make_event("sandbox.unhealthy", session_id, {"logs": str(error)})
        )
        return

    merged = {**files, **result.files}
    await log.save_files(session_id, merged)

    await log.append(
        make_event(
            "editor.completed",
            session_id,
            {
                "commitMessage": result.commitMessage,
                "filesChanged": sorted(result.files.keys()),
            },
        )
    )


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
