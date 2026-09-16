from __future__ import annotations

import asyncio
import html
import logging

from terrarium_agents import (
    CodeGeneratorError,
    EditorAgentError,
    HealAgentError,
    IntentError,
    build_session_plan,
    classify_intent,
    generate,
    next_heal_attempt,
    run_editor,
    run_heal,
)
from terrarium_agents.llm import (
    agents_mode,
    bedrock_model,
    bedrock_ready,
    codegen_model,
    drain_llm_calls,
    intent_model,
    nvidia_api_key,
    plan_model,
)
from terrarium_contracts import (
    AgentJob,
    ConversationTurn,
    ErrorContext,
    Intent,
    IntentAgentInput,
    IntentAgentOutput,
    PreviewReadyPayload,
    PreviewStreamFilePayload,
    RuntimeStatus,
    RuntimeErrorRequest,
    SandboxReadyPayload,
)
from terrarium_sandbox import SandboxRunner

from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog
from terrarium_api.session_lock import acquire_session_lock, release_session_lock
from terrarium_api.settings import redis_settings

logger = logging.getLogger(__name__)

PREVIEW_STAGE_DELAY_SECONDS = 1.15


def _ordered_file_paths(files: dict[str, str]) -> list[str]:
    priority = ["index.html", "styles.css", "app.js"]
    return [
        *[path for path in priority if path in files],
        *sorted(path for path in files if path not in priority),
    ]


def _list_field(plan_payload: dict[str, object], key: str) -> list[str]:
    value = plan_payload.get(key)
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _plan_preview_title(plan_payload: dict[str, object]) -> str:
    blob = " ".join(
        [
            str(plan_payload.get("notes") or ""),
            " ".join(_list_field(plan_payload, "screens")),
            " ".join(_list_field(plan_payload, "structure")),
        ]
    ).lower()
    if "calculator" in blob:
        return "Calculator layout"
    if "portfolio" in blob:
        return "Portfolio layout"
    if "website" in blob or "landing" in blob:
        return "Website layout"
    if "dashboard" in blob:
        return "Dashboard layout"
    if "todo" in blob or "task" in blob or "list" in blob:
        return "List layout"
    notes = str(plan_payload.get("notes") or "").strip()
    if notes:
        return notes.split(" for: ", 1)[-1].split(".", 1)[0][:36].strip() or "App layout"
    screens = _list_field(plan_payload, "screens")
    return (screens[0] if screens else "App layout")[:36]


def _plan_preview_body(layout: str, screens: list[str], structure: list[str], stage: int = 3) -> str:
    names = screens or [item.split(" — ", 1)[0] for item in structure[:5]] or ["Main"]
    safe_names = [html.escape(name[:42]) for name in names[:6]]
    lower = " ".join([layout, *names, *structure]).lower()
    if stage <= 0:
        return (
            "<section class=\"wireframe-preview\">"
            "<div class=\"wireframe-hero\"></div>"
            "<div class=\"wireframe-row\"><span></span><span></span><span></span></div>"
            "</section>"
        )
    if stage == 1:
        return (
            "<section class=\"wireframe-preview stage-one\">"
            "<div class=\"wireframe-hero\"></div>"
            "<div class=\"wireframe-stack\"><span></span><span></span><span></span></div>"
            "</section>"
        )
    if "calculator" in lower:
        if stage == 2:
            return (
                "<section class=\"calculator-preview building\">"
                "<div class=\"calc-display skeleton-text\"></div>"
                "<div class=\"calc-keys ghost\">"
                f"{''.join('<button type=\"button\" aria-hidden=\"true\"></button>' for _ in range(16))}"
                "</div>"
                "</section>"
            )
        return (
            "<section class=\"calculator-preview building\">"
            "<div class=\"calc-display skeleton-text\"></div>"
            "<div class=\"calc-keys ghost detailed\">"
            f"{''.join('<button type=\"button\" aria-hidden=\"true\"></button>' for _ in range(16))}"
            "</div>"
            "</section>"
        )
    if layout == "board" or "game" in lower:
        if stage == 2:
            return f"<section class=\"board-preview building\">{''.join('<div></div>' for _ in range(9))}</section>"
        return f"<section class=\"board-preview\">{''.join('<div></div>' for _ in range(9))}</section>"
    if layout in {"list", "split"}:
        if stage == 2:
            items = "".join("<article><span></span><p></p><p class=\"short\"></p></article>" for _ in safe_names)
            return f"<section class=\"list-preview building\">{items}</section>"
        items = "".join("<article><span></span><p></p><p class=\"short\"></p></article>" for _ in safe_names)
        return f"<section class=\"list-preview\">{items}</section>"
    if stage == 2:
        cards = "".join("<article><p></p><p class=\"short\"></p><p></p></article>" for _ in safe_names[:4])
        return f"<section class=\"card-preview building\">{cards}</section>"
    cards = "".join("<article><p></p><p class=\"short\"></p><p></p></article>" for _ in safe_names[:4])
    return f"<section class=\"card-preview\">{cards}</section>"


def _skeleton_html(plan_payload: dict[str, object], stage: int = 3) -> str:
    layout = str(plan_payload.get("layout") or "form")
    theme = str(plan_payload.get("theme") or "light")
    screens = _list_field(plan_payload, "screens")
    structure = _list_field(plan_payload, "structure")
    title = html.escape(_plan_preview_title(plan_payload))
    subtitle = html.escape("Building the first visual structure from the model plan.")
    _ = title, subtitle
    nav_count = min(max(len(screens), 2), 4)
    nav = "" if stage <= 0 else "".join("<span aria-hidden=\"true\"></span>" for _ in range(nav_count))
    header_copy = "<div class=\"title-block\"><i></i><b></b></div>"
    body = _plan_preview_body(layout, screens, structure, stage)
    dark = theme == "dark"
    return (
        "<!doctype html>\n"
        "<html lang=\"en\">\n"
        "<head>\n"
        "  <meta charset=\"utf-8\" />\n"
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"  <title>{title}</title>\n"
        "  <style>\n"
        f"    :root {{ color-scheme: {'dark' if dark else 'light'}; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; --bg:{'#f8fafc' if not dark else '#151827'}; --panel:{'#ffffff' if not dark else '#20233a'}; --line:{'#e5e7eb' if not dark else '#3a3f61'}; --soft:{'#eef2ff' if not dark else '#2d3358'}; --fill:{'#f8fafc' if not dark else '#252a46'}; --ink:{'#172033' if not dark else '#f8fafc'}; --muted:{'#64748b' if not dark else '#b8c0d9'}; --accent:#8a1238; --accent2:#7c3aed; --accent3:#0ea5e9; --accent4:#f97316; }}\n"
        "    * { box-sizing: border-box; }\n"
        "    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 12% 10%, rgba(124,58,237,.20), transparent 28%), radial-gradient(circle at 88% 18%, rgba(14,165,233,.18), transparent 26%), radial-gradient(circle at 50% 100%, rgba(249,115,22,.14), transparent 30%), var(--bg); color: var(--ink); padding: clamp(20px, 4vw, 48px); }\n"
        "    .preview { width: min(1040px, 100%); min-height: calc(100vh - clamp(40px, 8vw, 96px)); margin: 0 auto; border: 1px solid var(--line); border-radius: 28px; background: rgba(255,255,255,.86); box-shadow: 0 24px 70px rgba(15,23,42,.12); overflow: hidden; backdrop-filter: blur(18px); animation: preview-reveal .55s cubic-bezier(.16,1,.3,1) both; }\n"
        "    body[data-build-stage='0'] .preview { filter: blur(5px); opacity: .78; }\n"
        "    header { min-height: 86px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 32px; }\n"
        "    h1 { margin: 0 0 8px; font-size: clamp(20px, 2.5vw, 30px); letter-spacing: -.03em; filter: blur(1.4px); opacity: .78; animation: clarify .9s ease .25s both; }\n"
        "    p { margin: 0; color: var(--muted); line-height: 1.6; font-size: 13px; }\n"
        "    .title-block i, .title-block b, .wireframe-preview span, .wireframe-hero, article p, article span, .calc-display.skeleton-text, .calc-keys.ghost button, .board-preview div { display: block; border-radius: 999px; background: linear-gradient(90deg, rgba(138,18,56,.10), rgba(124,58,237,.18), rgba(14,165,233,.12)); background-size: 220% 100%; animation: shimmer 1.6s ease-in-out infinite; }\n"
        "    .title-block i { width: min(260px, 45vw); height: 28px; margin-bottom: 12px; } .title-block b { width: min(360px, 55vw); height: 12px; }\n"
        "    nav { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }\n"
        "    nav span, button { width: 120px; height: 34px; border: 1px solid var(--line); border-radius: 999px; padding: 9px 13px; background: linear-gradient(90deg, rgba(138,18,56,.10), rgba(124,58,237,.18), rgba(14,165,233,.12)); background-size: 220% 100%; color: transparent; font-weight: 700; font-size: 12px; animation: shimmer 1.6s ease-in-out infinite; }\n"
        "    nav span { opacity: 0; filter: blur(5px); animation: pop-in .72s cubic-bezier(.34,1.56,.64,1) both; }\n"
        "    nav span:nth-child(1) { animation-delay: .18s; } nav span:nth-child(2) { animation-delay: .42s; } nav span:nth-child(3) { animation-delay: .66s; } nav span:nth-child(4) { animation-delay: .9s; }\n"
        "    main { padding: 32px; }\n"
        "    .wireframe-preview { display: grid; gap: 22px; max-width: 760px; margin: 0 auto; padding-top: 36px; }\n"
        "    .wireframe-hero { height: 170px; border-radius: 32px; opacity: .62; filter: blur(3px); }\n"
        "    .wireframe-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; } .wireframe-row span { height: 84px; border-radius: 22px; opacity: .42; }\n"
        "    .wireframe-stack { display: grid; gap: 14px; } .wireframe-stack span { height: 42px; opacity: .5; }\n"
        "    .card-preview, .list-preview { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }\n"
        "    article, .calculator-preview, .board-preview { background: linear-gradient(135deg, rgba(255,255,255,.70), rgba(238,242,255,.82)); border: 1px solid var(--line); border-radius: 24px; padding: 22px; box-shadow: 0 18px 42px rgba(15,23,42,.08); }\n"
        "    article { opacity: 0; filter: blur(8px); transform: translateY(22px) scale(.97); animation: card-reveal .8s cubic-bezier(.16,1,.3,1) both; } article:nth-child(1) { animation-delay: .1s; } article:nth-child(2) { animation-delay: .35s; } article:nth-child(3) { animation-delay: .6s; } article:nth-child(4) { animation-delay: .85s; }\n"
        "    article strong { display: block; margin-bottom: 14px; font-size: 13px; color: var(--muted); filter: blur(2px); opacity: .38; animation: clarify .9s ease .45s both; }\n"
        "    article p { height: 12px; margin-top: 10px; } article .short { width: 62%; }\n"
        "    .list-preview article { display: grid; grid-template-columns: 42px 1fr; align-items: center; column-gap: 14px; } .list-preview span { width: 42px; height: 42px; border-radius: 14px; grid-row: span 2; }\n"
        "    .calculator-preview { max-width: 420px; margin: 0 auto; background: linear-gradient(160deg,#4f46e5,#8a1238 58%,#f97316); transform-origin: center; opacity: 0; filter: blur(10px); animation: card-reveal .9s cubic-bezier(.16,1,.3,1) .15s both; }\n"
        "    .calculator-preview.building { opacity: .7; filter: blur(4px); }\n"
        "    .calc-display { height: 76px; display:flex; align-items:center; justify-content:flex-end; padding: 0 22px; color: white; font-size: 32px; font-weight: 800; background: rgba(255,255,255,.14); border-radius: 999px; filter: blur(2px); animation: clarify 1.1s ease .5s both; }\n"
        "    .calc-keys { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 16px; }\n"
        "    .calc-keys button { min-height: 52px; font-size: 18px; opacity: 0; filter: blur(5px); transform: scale(.84); animation: pop-in .52s cubic-bezier(.34,1.56,.64,1) both; }\n"
        "    .calc-keys.ghost button { border-color: rgba(255,255,255,.26); color: transparent; box-shadow: none; }\n"
        "    .calc-keys button:nth-child(1) { animation-delay: .8s; } .calc-keys button:nth-child(2) { animation-delay: .95s; } .calc-keys button:nth-child(3) { animation-delay: 1.1s; } .calc-keys button:nth-child(4) { animation-delay: 1.25s; }\n"
        "    .calc-keys button:nth-child(5) { animation-delay: 1.4s; } .calc-keys button:nth-child(6) { animation-delay: 1.55s; } .calc-keys button:nth-child(7) { animation-delay: 1.7s; } .calc-keys button:nth-child(8) { animation-delay: 1.85s; }\n"
        "    .calc-keys button:nth-child(9) { animation-delay: 2s; } .calc-keys button:nth-child(10) { animation-delay: 2.15s; } .calc-keys button:nth-child(11) { animation-delay: 2.3s; } .calc-keys button:nth-child(12) { animation-delay: 2.45s; }\n"
        "    .calc-keys button:nth-child(13) { animation-delay: 2.6s; } .calc-keys button:nth-child(14) { animation-delay: 2.75s; } .calc-keys button:nth-child(15) { animation-delay: 2.9s; } .calc-keys button:nth-child(16) { animation-delay: 3.05s; }\n"
        "    .board-preview { display:grid; grid-template-columns: repeat(3, minmax(70px, 1fr)); gap: 14px; max-width: 420px; margin: 0 auto; } .board-preview div { aspect-ratio: 1; border-radius: 18px; }\n"
        "    @keyframes preview-reveal { from { opacity: 0; transform: scale(.985); filter: blur(12px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }\n"
        "    @keyframes shimmer { from { background-position: 100% 50%; } to { background-position: 0 50%; } }\n"
        "    @keyframes card-reveal { from { opacity: 0; transform: translateY(20px) scale(.95); filter: blur(10px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }\n"
        "    @keyframes pop-in { from { opacity: 0; transform: scale(.84); filter: blur(5px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }\n"
        "    @keyframes clarify { from { filter: blur(4px); opacity: .35; } to { filter: blur(0); opacity: 1; } }\n"
        "    @media (max-width: 760px) { body { padding: 14px; } header { align-items: flex-start; flex-direction: column; } main { padding: 20px; } }\n"
        "  </style>\n"
        "</head>\n"
        f"<body data-build-stage=\"{stage}\">\n"
        "  <section class=\"preview\" aria-label=\"Model generated preview loading\">\n"
        f"    <header>{header_copy}<nav>{nav}</nav></header>\n"
        f"    <main>{body}</main>\n"
        "  </section>\n"
        "</body>\n"
        "</html>\n"
    )


async def _emit_preview_stream_started(
    log: SessionEventLog, session_id: str, plan_payload: dict[str, object]
) -> None:
    await log.append(
        make_event(
            "preview.stream.started",
            session_id,
            {
                "message": "Rendering a live preview while files are generated.",
                "plan": plan_payload,
            },
        )
    )
    # Stream several increasingly detailed skeleton frames so the preview visibly
    # builds instead of appearing as one finished static mock.
    for stage in range(4):
        await log.append(
            make_event(
                "preview.stream.file",
                session_id,
                PreviewStreamFilePayload(
                    path="index.html",
                    content=_skeleton_html(plan_payload, stage=stage),
                    complete=False,
                ).model_dump(exclude_none=True),
            )
        )
        if stage < 3:
            await asyncio.sleep(PREVIEW_STAGE_DELAY_SECONDS)


async def _emit_preview_stream_files(
    log: SessionEventLog,
    session_id: str,
    files: dict[str, str],
    *,
    paths: list[str] | None = None,
) -> None:
    selected = paths or _ordered_file_paths(files)
    for index, path in enumerate(selected):
        if path not in files:
            continue
        await log.append(
            make_event(
                "preview.stream.file",
                session_id,
                PreviewStreamFilePayload(
                    path=path,
                    content=files[path],
                    complete=index == len(selected) - 1,
                ).model_dump(exclude_none=True),
            )
        )
    await log.append(
        make_event(
            "preview.stream.completed",
            session_id,
            {
                "files": _ordered_file_paths(files),
                "message": "Live preview files are ready; verifying in Docker.",
            },
        )
    )


def _validate_filemap_structure(files: dict[str, str]) -> tuple[bool, str | None]:
    """
    Static validation of generated FileMap (Gemini approach).
    Replaces runtime DOM smoke testing with fast structural checks.
    """
    # 1. Must have index.html
    entry_path = "index.html" if "index.html" in files else "frontend/index.html"
    if entry_path not in files:
        return False, "Missing index.html - every app needs an entry point"
    
    # 2. Check HTML structure basics
    html = files[entry_path]
    html_lower = html.lower().strip()
    if not (html_lower.startswith("<!doctype") or html_lower.startswith("<html")):
        return False, "index.html must start with DOCTYPE or <html> tag"
    
    # 3. Verify HTML has body
    if "<body" not in html_lower:
        return False, "index.html missing <body> tag"
    
    # 4. No external CDN dependencies (already checked elsewhere, but double-check)
    banned_domains = ["cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com", "cdn.skypack.dev"]
    for path, content in files.items():
        content_lower = content.lower()
        for domain in banned_domains:
            if domain in content_lower:
                return False, f"{path} contains external CDN link: {domain}"
    
    # 5. Validate file paths (no absolute paths, no parent traversal)
    for path in files.keys():
        if path.startswith("/"):
            return False, f"Invalid absolute file path: {path}"
        if ".." in path:
            return False, f"Invalid file path (parent traversal): {path}"
        if path.endswith("/"):
            return False, f"Invalid file path (directory): {path}"
    
    # 6. Check for script or style tags/files
    has_scripts = "<script" in html_lower or any(p.endswith(".js") or p.endswith(".jsx") or p.endswith(".ts") or p.endswith(".tsx") for p in files)
    has_styles = "<style" in html_lower or any(p.endswith(".css") for p in files)
    if not has_scripts and not has_styles:
        return False, "App has no scripts or styles - likely incomplete generation"
    
    # All checks passed
    logger.info("FileMap validation passed: %d files, %d KB total", 
                len(files), sum(len(c) for c in files.values()) // 1024)
    return True, None


def _llm_fields(purpose: str) -> dict[str, object]:
    calls = drain_llm_calls()
    live = agents_mode() == "live"
    provider, model, reason = _configured_llm_choice(purpose)
    payload: dict[str, object] = {
        "llmPurpose": purpose,
        "llmMode": agents_mode(),
        "llmModel": model if live else "stub",
        "llmProvider": provider if live else "stub",
        "llmReason": reason if live else "Local deterministic mode; no remote model is used.",
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


def _configured_llm_choice(purpose: str) -> tuple[str, str, str]:
    if purpose == "intent":
        return (
            "gemini",
            intent_model(),
            "Chosen for fast, low-cost intent classification and clarification questions.",
        )
    if purpose == "plan":
        if bedrock_ready():
            return (
                "bedrock",
                bedrock_model(),
                "Chosen for architecture planning because Claude handles multi-step design reasoning well.",
            )
        if nvidia_api_key():
            return (
                "nvidia",
                plan_model(),
                "Chosen as the available NVIDIA planning fallback for architecture reasoning.",
            )
        return (
            "gemini",
            plan_model(),
            "Chosen as the default planning fallback when Bedrock is unavailable.",
        )
    if nvidia_api_key():
        return (
            "nvidia",
            codegen_model(),
            "Chosen for code generation because Codestral is a coding-specialized model available through NVIDIA.",
        )
    if bedrock_ready():
        return (
            "bedrock",
            bedrock_model(),
            "Chosen for code generation because Claude is strong at larger structured code tasks.",
        )
    return (
        "gemini",
        codegen_model(),
        "Chosen as the default code generation fallback.",
    )


async def _unhealthy(log: SessionEventLog, session_id: str, error: object) -> None:
    await log.append(make_event("sandbox.unhealthy", session_id, {"logs": str(error)}))


def classify_session_intent(
    session_id: str,
    prompt: str,
    *,
    files: dict[str, str] | None = None,
    tool_id: str | None = None,
    conversation: list[ConversationTurn] | None = None,
    frontend_stack: str | None = None,
    backend_need: str | None = None,
    backend_stack: str | None = None,
) -> IntentAgentOutput:
    """Intent Agent only — no FileMap writes, no Docker."""
    return classify_intent(
        IntentAgentInput(
            prompt=prompt,
            sessionId=session_id,
            files=files,
            toolId=tool_id,
            conversation=conversation,
            frontendStack=frontend_stack,  # type: ignore[arg-type]
            backendNeed=backend_need,  # type: ignore[arg-type]
            backendStack=backend_stack,  # type: ignore[arg-type]
        )
    )


async def run_stub_session(
    ctx: dict,
    session_id: str,
    prompt: str,
    lock_token: str | None = None,
    frontend_stack: str | None = None,
    backend_need: str | None = None,
    backend_stack: str | None = None,
) -> None:
    """Intent → (if new+ready) Code Generator FileMap → sandbox. Agents never call Docker."""
    redis = ctx["redis"]
    token = lock_token or await acquire_session_lock(redis, session_id)
    if token is None:
        logger.info("Session %s already has a running build; dropping duplicate job", session_id)
        return
    try:
        await _run_stub_session_locked(
            redis,
            session_id,
            prompt,
            frontend_stack=frontend_stack,
            backend_need=backend_need,
            backend_stack=backend_stack,
        )
    finally:
        await release_session_lock(redis, session_id, token)


async def run_runtime_error_heal(
    ctx: dict, session_id: str, error_payload: dict[str, object], lock_token: str | None = None
) -> None:
    """Runtime errors reported by the preview use the normal self-heal path."""
    redis = ctx["redis"]
    token = lock_token or await acquire_session_lock(redis, session_id)
    if token is None:
        logger.info("Session %s already healing; dropping duplicate runtime error", session_id)
        return
    try:
        log = SessionEventLog(redis)
        current_files = await log.load_files(session_id)
        error = RuntimeErrorRequest.model_validate(error_payload)
        location = ":".join(
            str(part)
            for part in (error.filename, error.lineno, error.colno)
            if part is not None
        )
        logs = "\n".join(
            part
            for part in (
                f"Runtime error source={error.source}",
                f"Message: {error.message}",
                f"Location: {location}" if location else "",
                f"Stack:\n{error.stack}" if error.stack else "",
                f"Recent change: {error.recentChange}" if error.recentChange else "",
            )
            if part
        )
        await _unhealthy(log, session_id, logs)
        await _heal_loop(
            log,
            session_id,
            "Fix the runtime error in the generated preview without rewriting unrelated files.",
            current_files,
            logs,
            intent=Intent(kind="modify", stack="react", summary="Runtime error repair"),
        )
    finally:
        await release_session_lock(redis, session_id, token)


async def _run_stub_session_locked(
    redis: object,
    session_id: str,
    prompt: str,
    *,
    frontend_stack: str | None = None,
    backend_need: str | None = None,
    backend_stack: str | None = None,
) -> None:
    log = SessionEventLog(redis)
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
            frontend_stack=frontend_stack,
            backend_need=backend_need,
            backend_stack=backend_stack,
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
            failed = await _run_editor_step(log, session_id, prompt, intent, files)
            if failed:
                await _heal_loop(
                    log,
                    session_id,
                    prompt,
                    files,
                    failed,
                    intent=intent.as_intent(),
                )
        else:
            logger.info("Session %s is kind=modify; Editor needs a ready FileMap", session_id)
        return

    job = AgentJob(
        sessionId=session_id,
        intent=intent.as_intent(),
        prompt=prompt,
        frontendStack=frontend_stack,  # type: ignore[arg-type]
        backendNeed=backend_need,  # type: ignore[arg-type]
        backendStack=backend_stack,  # type: ignore[arg-type]
    )
    if intent.phase == "clarify":
        logger.info("Session %s clarifying — no template preview", session_id)
        return
    if intent.phase != "ready":
        logger.info("Session %s phase=%s — no codegen yet", session_id, intent.phase)
        return
    try:
        plan = await asyncio.to_thread(build_session_plan, job)
    except CodeGeneratorError as error:
        logger.warning("Code generation rejected for %s: %s", session_id, error)
        await _unhealthy(log, session_id, error)
        await _heal_loop(
            log, session_id, prompt, files, str(error), intent=intent.as_intent()
        )
        return

    plan_payload = plan.to_payload()
    codegen_provider, selected_codegen_model, codegen_reason = _configured_llm_choice("codegen")
    started_payload: dict[str, object] = {
        "message": (
            "Architecture ready. Generating the application FileMap from the plan "
            f"with {codegen_provider}/{selected_codegen_model}. Reason: {codegen_reason}"
        ),
        "stage": "generating",
        "stack": plan.stack,
        "layout": plan.layout,
        "theme": plan.theme,
        "summary": intent.summary,
        "complexity": plan.complexity,
        "codegenProvider": codegen_provider,
        "codegenModel": selected_codegen_model,
        "codegenReason": codegen_reason,
        "plan": plan_payload,
        **_llm_fields("plan"),
    }
    await log.append(make_event("codegen.started", session_id, started_payload))
    await _emit_preview_stream_started(log, session_id, plan_payload)
    logger.info(
        "Codegen %s complexity=%s stack=%s layout=%s theme=%s — overlay starting",
        session_id,
        plan.complexity,
        plan.stack,
        plan.layout,
        plan.theme,
    )
    try:
        result = await asyncio.to_thread(generate, job, plan)
    except CodeGeneratorError as error:
        logger.warning("Code generation rejected for %s: %s", session_id, error)
        await _unhealthy(log, session_id, error)
        await _heal_loop(
            log, session_id, prompt, files, str(error), intent=intent.as_intent()
        )
        return
    except Exception as error:
        logger.exception("Code generation failed for %s", session_id)
        await _unhealthy(log, session_id, error)
        await _heal_loop(
            log, session_id, prompt, files, str(error), intent=intent.as_intent()
        )
        return

    await log.save_files(session_id, result.files)
    await _emit_preview_stream_files(log, session_id, result.files)
    llm = _llm_fields("codegen")
    used_provider = str(llm.get("llmProvider") or codegen_provider)
    used_model = str(llm.get("llmModel") or selected_codegen_model)
    llm_ok = llm.get("llmOk")
    codegen_message = (
        f"Model FileMap ready ({len(result.files)} files) via {used_provider}/{used_model}. "
        "Starting Docker preview."
        if llm_ok
        else f"FileMap ready ({len(result.files)} files) using deterministic fallback after {used_provider}/{used_model} did not return JSON. Starting Docker preview."
    )
    await log.append(
        make_event(
            "codegen.completed",
            session_id,
            {
                "files": list(result.files.keys()),
                "commitMessage": result.commitMessage,
                "message": codegen_message,
                **llm,
            },
        )
    )
    failed = await _boot_preview(log, session_id, job, files=result.files, draft=False)
    if failed:
        await _heal_loop(
            log,
            session_id,
            prompt,
            result.files,
            failed,
            intent=intent.as_intent(),
        )


async def _run_editor_step(
    log: SessionEventLog,
    session_id: str,
    prompt: str,
    intent: IntentAgentOutput,
    files: dict[str, str],
) -> str | None:
    """Emit editor.started, run the editor agent, boot preview. Logs if unhealthy."""
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
        return str(error)

    merged = {**files, **result.files}
    await log.save_files(session_id, merged)
    await _emit_preview_stream_files(
        log, session_id, merged, paths=sorted(result.files.keys())
    )
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
    job = AgentJob(sessionId=session_id, intent=intent.as_intent(), prompt=prompt)
    return await _boot_preview(log, session_id, job, files=merged, draft=False)


async def _boot_preview(
    log: SessionEventLog,
    session_id: str,
    job: AgentJob,
    *,
    files: dict[str, str] | None = None,
    draft: bool,
) -> str | None:
    """API starts Docker. Agents never do. Never invents a layout-recipe FileMap.

    Returns error logs when a final preview is unhealthy; None on success.
    """
    if not files:
        logger.info("Session %s has no FileMap — not booting a template", session_id)
        if draft:
            return None
        await _unhealthy(log, session_id, "No FileMap to preview")
        return "No FileMap to preview"
    
    # Static validation (replaces runtime smoke test - Gemini approach)
    is_valid, validation_error = _validate_filemap_structure(files)
    if not is_valid:
        logger.warning("Session %s failed static validation: %s", session_id, validation_error)
        if draft:
            return None
        await _unhealthy(log, session_id, f"File structure validation failed: {validation_error}")
        return f"File structure validation failed: {validation_error}"
    
    filemap = files
    await log.save_files(session_id, filemap)
    await log.append(
        make_event(
            "sandbox.booting",
            session_id,
            {
                "files": list(filemap.keys()),
                "draft": draft,
                "message": "Starting preview container...",
                "stage": "sandbox",
            },
        )
    )
    try:
        runner = SandboxRunner()
        handle = await asyncio.to_thread(
            lambda: runner.start(session_id, files=filemap)
        )
        report = await asyncio.to_thread(runner.wait_until_healthy, session_id)
    except Exception as error:
        logger.exception("Sandbox start failed for %s", session_id)
        if draft:
            return None
        await _unhealthy(log, session_id, error)
        return str(error)
    if report.status in {"unhealthy", "stopped"}:
        logger.warning("Sandbox %s health=%s", session_id, report.status)
        if draft:
            return None
        await _unhealthy(log, session_id, report.logs or report.status)
        return report.logs or report.status
    
    # Skip DOM smoke test entirely - following Gemini's approach
    # Static validation above is sufficient
    ready = SandboxReadyPayload(
        previewUrl=handle.previewUrl, containerId=handle.containerId
    )
    await log.append(make_event("sandbox.ready", session_id, ready.model_dump()))
    preview = PreviewReadyPayload(previewUrl=handle.previewUrl)
    await log.append(make_event("preview.ready", session_id, preview.model_dump()))
    return None


async def _heal_loop(
    log: SessionEventLog,
    session_id: str,
    prompt: str,
    files: dict[str, str] | None,
    logs: str,
    *,
    intent: Intent,
    health: RuntimeStatus = "unhealthy",
) -> None:
    """Retry Editor or Code Generator at most 3 times, then emit heal.exhausted."""
    failed = 0
    current_files = files
    current_logs = logs
    current_health = health
    while True:
        attempt = next_heal_attempt(failed)
        if attempt is None:
            await log.append(
                make_event(
                    "heal.exhausted",
                    session_id,
                    {
                        "logs": current_logs,
                        "attempts": failed,
                        "message": f"Gave up after {failed} heal retries.",
                    },
                )
            )
            logger.warning("Heal exhausted for %s after %s attempts", session_id, failed)
            return
        failed = attempt
        ctx = ErrorContext(
            logs=current_logs,
            health=current_health,
            healAttempt=attempt,
        )
        job = AgentJob(
            sessionId=session_id,
            intent=intent,
            prompt=prompt,
            files=current_files,
            errorContext=ctx,
        )
        await log.append(
            make_event(
                "heal.attempt",
                session_id,
                {
                    "attempt": attempt,
                    "maxAttempts": 3,
                    "message": f"Retry {attempt}/3",
                },
            )
        )
        logger.info("Heal attempt %s/3 for %s", attempt, session_id)
        try:
            decision = await asyncio.to_thread(run_heal, job)
        except HealAgentError as error:
            current_logs = str(error)
            continue
        try:
            if decision.route == "editor" and current_files:
                result = await asyncio.to_thread(
                    run_editor,
                    AgentJob(
                        sessionId=session_id,
                        intent=Intent(
                            kind="modify",
                            stack=intent.stack,
                            summary=intent.summary,
                            toolId=intent.toolId,
                        ),
                        prompt=f"{prompt}\n\nFix the preview. Logs:\n{current_logs[:2000]}",
                        files=current_files,
                        errorContext=ctx,
                    ),
                )
                current_files = {**current_files, **result.files}
            else:
                result = await asyncio.to_thread(
                    generate,
                    AgentJob(
                        sessionId=session_id,
                        intent=Intent(
                            kind="new",
                            stack=intent.stack,
                            summary=intent.summary,
                        ),
                        prompt=prompt,
                        files=current_files,
                        errorContext=ctx,
                    ),
                )
                current_files = result.files
        except Exception as error:
            logger.exception("Heal %s/%s agent failed for %s", attempt, 3, session_id)
            current_logs = str(error)
            continue
        await log.save_files(session_id, current_files)
        await _emit_preview_stream_files(log, session_id, current_files)
        boot_job = AgentJob(sessionId=session_id, intent=intent, prompt=prompt)
        failed_logs = await _boot_preview(
            log, session_id, boot_job, files=current_files, draft=False
        )
        if failed_logs is None:
            logger.info("Heal %s recovered %s", attempt, session_id)
            return
        current_logs = failed_logs


async def on_startup(ctx: dict) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        force=True,
    )
    plan_provider, selected_plan_model, _ = _configured_llm_choice("plan")
    codegen_provider, selected_codegen_model, _ = _configured_llm_choice("codegen")
    logger.info(
        "Terrarium ARQ worker started (mode=%s intent=gemini/%s plan=%s/%s codegen=%s/%s bedrock=%s)",
        agents_mode(),
        intent_model(),
        plan_provider,
        selected_plan_model,
        codegen_provider,
        selected_codegen_model,
        bedrock_model() if bedrock_ready() else "off",
    )


class WorkerSettings:
    functions = [run_stub_session, run_runtime_error_heal]
    on_startup = on_startup
    redis_settings = redis_settings()
    job_timeout = 540
    max_jobs = 2
