from __future__ import annotations

import asyncio
import logging

from terrarium_agents import (
    CodeGeneratorError,
    EditorAgentError,
    IntentError,
    build_session_plan,
    classify_intent,
    draft_files,
    generate,
    run_editor,
)
from terrarium_agents.llm import agents_mode, codegen_model, drain_llm_calls, intent_model, plan_model
from terrarium_contracts import (
    AgentJob,
    ConversationTurn,
    IntentAgentInput,
    IntentAgentOutput,
    PreviewReadyPayload,
    SandboxReadyPayload,
)
from terrarium_sandbox import SandboxRunner

from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog
from terrarium_api.settings import redis_settings

logger = logging.getLogger(__name__)


def _llm_fields(purpose: str) -> dict[str, object]:
    calls = drain_llm_calls()
    live = agents_mode() == "live"
    model, provider = {
        "intent": (intent_model(), "gemini"),
        "plan": (plan_model(), "gemini"),
    }.get(purpose, (codegen_model(), "gemini"))
    payload: dict[str, object] = {
        "llmPurpose": purpose,
        "llmMode": agents_mode(),
        "llmModel": model if live else "stub",
        "llmProvider": provider if live else "stub",
    }
    if calls:
        last = calls[-1]
        payload["llmProvider"] = last.get("provider") or payload["llmProvider"]
        payload["llmModel"] = last.get("model") or payload["llmModel"]
        payload["llmDurationMs"] = last.get("durationMs")
        payload["llmOk"] = last.get("ok")
    elif purpose == "plan":
        payload["llmProvider"] = "heuristic"
        payload["llmModel"] = "none"
        payload["llmOk"] = False
    return payload


async def _unhealthy(log: SessionEventLog, session_id: str, error: object) -> None:
    await log.append(make_event("sandbox.unhealthy", session_id, {"logs": str(error)}))


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
    """Intent → (if new+ready) Code Generator FileMap → sandbox. Agents never call Docker."""
    log = SessionEventLog(ctx["redis"])
    history = [
        ConversationTurn.model_validate(item)
        for item in await log.load_conversation(session_id)
    ]
    files = await log.load_files(session_id)
    tool_id = await log.load_tool_id(session_id)
    drain_llm_calls()
    try:
        intent = await asyncio.to_thread(
            classify_session_intent,
            session_id,
            prompt,
            files=files if tool_id else None,
            tool_id=tool_id,
            conversation=history,
        )
    except IntentError as error:
        logger.exception("Intent classification failed for %s", session_id)
        await _unhealthy(log, session_id, error)
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

    if intent.kind == "modify" and not (intent.toolId or tool_id):
        logger.info(
            "Session %s coerced kind=modify without toolId to new (draft is not an edit)",
            session_id,
        )
        intent = intent.model_copy(update={"kind": "new", "toolId": None})

    await log.append(
        make_event(
            "intent.classified",
            session_id,
            {**intent.model_dump(exclude_none=True), **_llm_fields("intent")},
        )
    )

    if intent.kind == "modify":
        if intent.phase == "ready" and files:
            await _run_editor_step(log, session_id, prompt, intent, files)
        else:
            logger.info("Session %s is kind=modify; Editor needs a ready FileMap", session_id)
        return

    job = AgentJob(sessionId=session_id, intent=intent.as_intent(), prompt=prompt)
    if intent.phase == "clarify":
        await _boot_preview(log, session_id, job, draft=True)
        return
    if intent.phase != "ready":
        logger.info("Session %s phase=%s — no codegen yet", session_id, intent.phase)
        return
    try:
        plan = await asyncio.to_thread(build_session_plan, job)
    except CodeGeneratorError as error:
        logger.warning("Code generation rejected for %s: %s", session_id, error)
        await _unhealthy(log, session_id, error)
        return

    started_payload: dict[str, object] = {
        "message": (
            f"Architecture decided: {plan.complexity} {plan.stack} {plan.layout} layout. "
            "Calling the coding model to overlay HTML/CSS/JS on the layout recipe."
        ),
        "stage": "generating",
        "stack": plan.stack,
        "layout": plan.layout,
        "theme": plan.theme,
        "summary": intent.summary,
        "complexity": plan.complexity,
        **_llm_fields("plan"),
    }
    if plan.complexity == "complex":
        started_payload["plan"] = plan.to_payload()
    await log.append(make_event("codegen.started", session_id, started_payload))
    logger.info(
        "Codegen %s complexity=%s stack=%s layout=%s theme=%s — overlay starting",
        session_id,
        plan.complexity,
        plan.stack,
        plan.layout,
        plan.theme,
    )
    skeleton = await asyncio.to_thread(
        draft_files, job, stack=plan.stack, layout=plan.layout, theme=plan.theme
    )
    await _boot_preview(log, session_id, job, files=skeleton, draft=True)
    try:
        result = await asyncio.to_thread(generate, job, plan)
    except CodeGeneratorError as error:
        logger.warning("Code generation rejected for %s: %s", session_id, error)
        await _unhealthy(log, session_id, error)
        return
    except Exception as error:
        logger.exception("Code generation failed for %s", session_id)
        await _unhealthy(log, session_id, error)
        return

    await log.save_files(session_id, result.files)
    llm = _llm_fields("codegen")
    overlay = llm.get("llmOk") is True
    await log.append(
        make_event(
            "codegen.completed",
            session_id,
            {
                "files": list(result.files.keys()),
                "commitMessage": result.commitMessage,
                "message": (
                    f"FileMap ready ({len(result.files)} files, "
                    f"{'LLM overlay applied' if overlay else 'template fallback'}). Starting Docker preview."
                ),
                **llm,
            },
        )
    )
    await _boot_preview(log, session_id, job, files=result.files, draft=False)


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
        await _unhealthy(log, session_id, error)
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


async def _boot_preview(
    log: SessionEventLog,
    session_id: str,
    job: AgentJob,
    *,
    files: dict[str, str] | None = None,
    draft: bool,
) -> None:
    """API starts Docker. Agents never do. Draft = template while chat still clarifies."""
    try:
        filemap = files or await asyncio.to_thread(draft_files, job)
    except Exception as error:
        logger.exception("Draft FileMap failed for %s", session_id)
        if not draft:
            await _unhealthy(log, session_id, error)
        return
    await log.save_files(session_id, filemap)
    await log.append(
        make_event(
            "sandbox.booting",
            session_id,
            {
                "files": list(filemap.keys()),
                "draft": draft,
                "message": (
                    "Docker: starting DRAFT nginx sandbox from the template."
                    if draft
                    else "Docker: replacing the preview with generated files."
                ),
                "stage": "sandbox",
            },
        )
    )
    try:
        handle = await asyncio.to_thread(
            lambda: SandboxRunner().start(session_id, files=filemap)
        )
    except Exception as error:
        logger.exception("Sandbox start failed for %s", session_id)
        if draft:
            return
        await _unhealthy(log, session_id, error)
        return
    ready = SandboxReadyPayload(
        previewUrl=handle.previewUrl, containerId=handle.containerId
    )
    await log.append(make_event("sandbox.ready", session_id, ready.model_dump()))
    preview = PreviewReadyPayload(previewUrl=handle.previewUrl)
    await log.append(make_event("preview.ready", session_id, preview.model_dump()))


async def on_startup(ctx: dict) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        force=True,
    )
    logger.info(
        "Terrarium ARQ worker started (intent=%s/%s plan=%s codegen=%s)",
        agents_mode(),
        intent_model(),
        plan_model(),
        codegen_model(),
    )


class WorkerSettings:
    functions = [run_stub_session]
    on_startup = on_startup
    redis_settings = redis_settings()
    job_timeout = 360
    max_jobs = 2
