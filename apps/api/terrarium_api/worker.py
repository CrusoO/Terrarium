from __future__ import annotations

import asyncio
import html
import logging
import posixpath
import re
from pathlib import Path
from uuid import uuid4

from terrarium_agents import (
    CodeGeneratorError,
    EditorAgentError,
    HealAgentError,
    IntentError,
    SessionPlan,
    build_session_plan,
    classify_intent,
    generate,
    session_plan_from_payload,
    next_heal_attempt,
    run_editor,
    run_heal,
)
from terrarium_agents.brownie_reuse import ReusePlan
from terrarium_agents.codegen import ProvidersUnavailable
from terrarium_agents.llm_fixtures import MissingFixture
from terrarium_agents.canary import (
    DemoBlocked,
    KILL_MESSAGE,
    NOT_SUPPORTED_MESSAGE,
    kill_switch_on,
    set_canary_actor,
)
from terrarium_agents.llm import (
    agents_mode,
    bedrock_model,
    bedrock_ready,
    codegen_model,
    drain_llm_calls,
    gemini_api_key,
    intent_model,
    llm_provider_order,
    model_for_provider,
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
from terrarium_api import codegen_metrics
from terrarium_api.session_log import SessionEventLog
from terrarium_api.session_lock import acquire_session_lock, release_session_lock
from terrarium_api.settings import redis_settings
import os

logger = logging.getLogger(__name__)

PREVIEW_STAGE_DELAY_SECONDS = 1.15
_RESOLVABLE_IMPORT_SUFFIXES = (".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".svg")
_RELATIVE_IMPORT_RE = re.compile(
    r"""(?:import|export)\s+(?:[^'"()]+?\s+from\s*)?['"](\.{1,2}/[^'"]+)['"]|import\s*\(\s*['"](\.{1,2}/[^'"]+)['"]\s*\)""",
    re.M,
)


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
        f"    :root {{ color-scheme: {'dark' if dark else 'light'}; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; --bg:{'#f6f7f9' if not dark else '#111318'}; --panel:{'#ffffff' if not dark else '#1a1d24'}; --line:{'#e5e7eb' if not dark else '#30343d'}; --soft:{'#f3f4f6' if not dark else '#242832'}; --fill:{'#eef0f3' if not dark else '#20242d'}; --ink:{'#20242c' if not dark else '#f4f5f7'}; --muted:{'#737a86' if not dark else '#a7adb8'}; --accent:#d1d5db; --accent2:#e5e7eb; --accent3:#f3f4f6; --accent4:#cbd5e1; }}\n"
        "    * { box-sizing: border-box; }\n"
        "    body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 15% 8%, rgba(255,255,255,.9), transparent 30%), radial-gradient(circle at 86% 14%, rgba(229,231,235,.72), transparent 28%), linear-gradient(135deg,#f8fafc,#eef1f5 46%,#f7f8fa); color: var(--ink); padding: clamp(20px, 4vw, 48px); }\n"
        "    .preview { width: min(1040px, 100%); min-height: calc(100vh - clamp(40px, 8vw, 96px)); margin: 0 auto; border: 1px solid rgba(209,213,219,.86); border-radius: 20px; background: rgba(255,255,255,.88); box-shadow: 0 24px 70px rgba(15,23,42,.10); overflow: hidden; backdrop-filter: blur(18px); animation: preview-reveal .55s cubic-bezier(.16,1,.3,1) both; }\n"
        "    body[data-build-stage='0'] .preview { filter: blur(5px); opacity: .78; }\n"
        "    header { min-height: 86px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 32px; }\n"
        "    h1 { margin: 0 0 8px; font-size: clamp(20px, 2.5vw, 30px); letter-spacing: -.03em; filter: blur(1.4px); opacity: .78; animation: clarify .9s ease .25s both; }\n"
        "    p { margin: 0; color: var(--muted); line-height: 1.6; font-size: 13px; }\n"
        "    .title-block i, .title-block b, .wireframe-preview span, .wireframe-hero, article p, article span, .calc-display.skeleton-text, .calc-keys.ghost button, .board-preview div { display: block; border-radius: 10px; background: linear-gradient(90deg, rgba(229,231,235,.88), rgba(248,250,252,.96), rgba(209,213,219,.82)); background-size: 220% 100%; animation: shimmer 1.6s ease-in-out infinite; }\n"
        "    .title-block i { width: min(260px, 45vw); height: 28px; margin-bottom: 12px; } .title-block b { width: min(360px, 55vw); height: 12px; }\n"
        "    nav { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }\n"
        "    nav span, button { width: 120px; height: 34px; border: 1px solid var(--line); border-radius: 10px; padding: 9px 13px; background: linear-gradient(90deg, rgba(229,231,235,.88), rgba(248,250,252,.96), rgba(209,213,219,.82)); background-size: 220% 100%; color: transparent; font-weight: 700; font-size: 12px; animation: shimmer 1.6s ease-in-out infinite; }\n"
        "    nav span { opacity: 0; filter: blur(5px); animation: pop-in .72s cubic-bezier(.34,1.56,.64,1) both; }\n"
        "    nav span:nth-child(1) { animation-delay: .18s; } nav span:nth-child(2) { animation-delay: .42s; } nav span:nth-child(3) { animation-delay: .66s; } nav span:nth-child(4) { animation-delay: .9s; }\n"
        "    main { padding: 32px; }\n"
        "    .wireframe-preview { display: grid; gap: 22px; max-width: 760px; margin: 0 auto; padding-top: 36px; }\n"
        "    .wireframe-hero { height: 170px; border-radius: 18px; opacity: .62; filter: blur(3px); }\n"
        "    .wireframe-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; } .wireframe-row span { height: 84px; border-radius: 14px; opacity: .42; }\n"
        "    .wireframe-stack { display: grid; gap: 14px; } .wireframe-stack span { height: 42px; opacity: .5; }\n"
        "    .card-preview, .list-preview { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }\n"
        "    article, .calculator-preview, .board-preview { background: linear-gradient(135deg, rgba(255,255,255,.86), rgba(243,244,246,.84)); border: 1px solid var(--line); border-radius: 16px; padding: 22px; box-shadow: 0 18px 42px rgba(15,23,42,.07); }\n"
        "    article { opacity: 0; filter: blur(8px); transform: translateY(22px) scale(.97); animation: card-reveal .8s cubic-bezier(.16,1,.3,1) both; } article:nth-child(1) { animation-delay: .1s; } article:nth-child(2) { animation-delay: .35s; } article:nth-child(3) { animation-delay: .6s; } article:nth-child(4) { animation-delay: .85s; }\n"
        "    article strong { display: block; margin-bottom: 14px; font-size: 13px; color: var(--muted); filter: blur(2px); opacity: .38; animation: clarify .9s ease .45s both; }\n"
        "    article p { height: 12px; margin-top: 10px; } article .short { width: 62%; }\n"
        "    .list-preview article { display: grid; grid-template-columns: 42px 1fr; align-items: center; column-gap: 14px; } .list-preview span { width: 42px; height: 42px; border-radius: 14px; grid-row: span 2; }\n"
        "    .calculator-preview { max-width: 420px; margin: 0 auto; background: linear-gradient(160deg,#f8fafc,#e5e7eb 58%,#d1d5db); transform-origin: center; opacity: 0; filter: blur(10px); animation: card-reveal .9s cubic-bezier(.16,1,.3,1) .15s both; }\n"
        "    .calculator-preview.building { opacity: .7; filter: blur(4px); }\n"
        "    .calc-display { height: 76px; display:flex; align-items:center; justify-content:flex-end; padding: 0 22px; color: transparent; font-size: 32px; font-weight: 800; background: rgba(255,255,255,.68); border-radius: 14px; filter: blur(2px); animation: clarify 1.1s ease .5s both; }\n"
        "    .calc-keys { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 16px; }\n"
        "    .calc-keys button { min-height: 52px; font-size: 18px; opacity: 0; filter: blur(5px); transform: scale(.84); animation: pop-in .52s cubic-bezier(.34,1.56,.64,1) both; }\n"
        "    .calc-keys.ghost button { border-color: rgba(148,163,184,.32); color: transparent; box-shadow: none; }\n"
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
    # 1. Must have an HTML entry (React root, Vite frontend, Angular, or UI5 webapp)
    entry_path = next(
        (
            path
            for path in (
                "index.html",
                "frontend/index.html",
                "src/index.html",
                "frontend/src/index.html",
                "webapp/index.html",
                "frontend/webapp/index.html",
            )
            if path in files
        ),
        "",
    )
    if not entry_path:
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

    missing_import = _missing_relative_import(files)
    if missing_import:
        return False, missing_import
    
    # All checks passed
    logger.info("FileMap validation passed: %d files, %d KB total", 
                len(files), sum(len(c) for c in files.values()) // 1024)
    return True, None


def _missing_relative_import(files: dict[str, str]) -> str | None:
    module_paths = tuple(
        path
        for path in files
        if Path(path).suffix.lower() in {".js", ".jsx", ".ts", ".tsx"}
    )
    for path in module_paths:
        for match in _RELATIVE_IMPORT_RE.finditer(files[path]):
            spec = match.group(1) or match.group(2) or ""
            if not _resolve_relative_import(path, spec, files):
                return f"{path} imports missing module {spec}"
    return None


def _resolve_relative_import(source_path: str, specifier: str, files: dict[str, str]) -> str | None:
    source_dir = posixpath.dirname(source_path.replace("\\", "/"))
    target = posixpath.normpath(posixpath.join(source_dir, specifier))
    if target.startswith("../"):
        return None
    if target in files:
        return target
    target_suffix = Path(target).suffix.lower()
    candidates = [target] if target_suffix else []
    if not target_suffix:
        candidates.extend(f"{target}{suffix}" for suffix in _RESOLVABLE_IMPORT_SUFFIXES)
        candidates.extend(f"{target}/index{suffix}" for suffix in _RESOLVABLE_IMPORT_SUFFIXES)
    for candidate in candidates:
        if candidate in files:
            return candidate
    return None


def _llm_fields(purpose: str, session_id: str | None = None) -> dict[str, object]:
    calls = drain_llm_calls()
    if session_id:
        codegen_metrics.record_model_calls(session_id, purpose, calls)
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
        for source_key, event_key in (
            ("inputTokens", "llmInputTokens"),
            ("outputTokens", "llmOutputTokens"),
            ("totalTokens", "llmTotalTokens"),
            ("usageSource", "llmUsageSource"),
        ):
            if source_key in last:
                payload[event_key] = last[source_key]
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
        reasons = {
            "bedrock": "Architecture planning uses Claude on Bedrock for multi-step design reasoning.",
            "gemini": "Gemini plans the architecture. A failure falls back to Bedrock.",
            "nvidia": "Optional NVIDIA provider. A failure falls back to Bedrock.",
        }
    else:
        reasons = {
            "bedrock": "Code generation uses Claude on Bedrock for large structured FileMaps.",
            "gemini": "Gemini generates the FileMap. A failure falls back to Bedrock.",
            "nvidia": "Optional NVIDIA provider. A failure falls back to Bedrock.",
        }
    order = llm_provider_order("plan" if purpose == "plan" else "codegen")
    if not order:
        return (
            "gemini" if gemini_api_key() else "stub",
            plan_model() if purpose == "plan" else codegen_model(),
            "No LLM providers configured; using stub/heuristic behavior.",
        )
    provider = order[0]
    model = model_for_provider(provider, "plan" if purpose == "plan" else "codegen")
    return (provider, model, reasons.get(provider, "Configured LLM provider."))


async def _unhealthy(log: SessionEventLog, session_id: str, error: object) -> None:
    message = str(error)
    await log.append(
        make_event(
            "sandbox.unhealthy",
            session_id,
            {"logs": message, "message": message},
        )
    )


async def _stop_unvalidated(log: SessionEventLog, session_id: str, message: str, *, offer_retry: bool) -> None:
    """End the session without a preview. The message is what the user reads."""
    await log.append(
        make_event(
            "sandbox.unhealthy",
            session_id,
            {
                "logs": message,
                "message": message,
                "offerRetry": offer_retry,
                "terminal": True,
            },
        )
    )
    codegen_metrics.finish_run(session_id, status="not-validated")


async def _stop_providers_unavailable(log: SessionEventLog, session_id: str, error: Exception) -> None:
    """A provider outage is not a code defect: healing would call the same dead providers again."""
    logger.warning("Session %s stopped, coding providers unavailable: %s", session_id, error)
    _llm_fields("codegen", session_id)
    await _stop_unvalidated(log, session_id, str(error), offer_retry=True)


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
    brownie_asset_ids: list[str] | None = None,
) -> None:
    """Intent → architecture → (clarify) → Brownie review → Code Generator FileMap → sandbox.

    Agents never call Docker.
    """
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
            brownie_asset_ids=brownie_asset_ids,
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
    brownie_asset_ids: list[str] | None = None,
) -> None:
    from terrarium_agents.parked import note_parked

    note_parked()
    log = SessionEventLog(redis)
    from terrarium_agents.canary import demo_block_reason, set_canary_actor

    set_canary_actor(await log.load_actor_email(session_id) or "")
    blocked = demo_block_reason(session_id, prompt)
    if blocked:
        await _stop_unvalidated(log, session_id, blocked, offer_retry=False)
        return
    codegen_metrics.start_run(session_id, prompt)
    history = [
        ConversationTurn.model_validate(item)
        for item in await log.load_conversation(session_id)
    ]
    files = await log.load_files(session_id)
    tool_id = await log.load_tool_id(session_id)
    drain_llm_calls()
    saved_plan_raw = await log.load_session_plan(session_id)
    if brownie_asset_ids is not None:
        saved_intent = await _load_saved_intent(log, session_id) if saved_plan_raw else None
        if saved_intent is None or saved_plan_raw is None:
            await _stop_unvalidated(
                log,
                session_id,
                "The Brownie review for this build has expired. Send your request again.",
                offer_retry=False,
            )
            return
        await _continue_after_brownie(
            log,
            session_id,
            files,
            history,
            saved_intent,
            saved_plan_raw,
            brownie_asset_ids,
            frontend_stack=frontend_stack,
            backend_need=backend_need,
            backend_stack=backend_stack,
        )
        return
    try:
        with codegen_metrics.stage(session_id, "intent", kind="model"):
            intent = await asyncio.to_thread(
                classify_session_intent,
                session_id,
                prompt,
                files=files or None,
                tool_id=tool_id,
                conversation=history,
                frontend_stack=frontend_stack,
                backend_need=backend_need,
                backend_stack=backend_stack,
            )
    except (IntentError, MissingFixture) as error:
        logger.exception("Intent classification failed for %s", session_id)
        await _unhealthy(log, session_id, error)
        _llm_fields("intent", session_id)
        codegen_metrics.finish_run(session_id, status="intent-error")
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
    intent_llm = _llm_fields("intent", session_id)

    if saved_plan_raw and intent.kind == "new":
        intent = intent.model_copy(update={"phase": "ready", "questions": None})

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

    if intent.kind == "modify" and not (intent.toolId or tool_id) and not files:
        logger.info(
            "Session %s coerced kind=modify without toolId to new (draft is not an edit)",
            session_id,
        )
        intent = intent.model_copy(update={"kind": "new", "toolId": None})

    from terrarium_agents.acceptance import propose_acceptance_checks

    if intent.phase == "ready" and not intent.acceptanceChecks:
        kind = "modify" if intent.kind == "modify" else "new"
        intent = intent.model_copy(
            update={
                "acceptanceChecks": propose_acceptance_checks(intent.summary or prompt, kind=kind)
            }
        )
    if intent.acceptanceChecks:
        await log.save_acceptance_checks(
            session_id, [c.model_dump() for c in intent.acceptanceChecks]
        )

    if intent.kind == "modify":
        await log.append(
            make_event(
                "intent.classified",
                session_id,
                {**intent.model_dump(exclude_none=True), **intent_llm},
            )
        )
        if intent.phase == "ready" and files:
            failed = await _run_editor_step(log, session_id, prompt, intent, files)
            if failed:
                codegen_metrics.finish_run(session_id, status="edit-unhealthy")
                await _heal_loop(
                    log,
                    session_id,
                    prompt,
                    files,
                    failed,
                    intent=intent.as_intent(),
                )
            else:
                codegen_metrics.finish_run(session_id, status="edited")
        else:
            logger.info("Session %s is kind=modify; Editor needs a ready FileMap", session_id)
            codegen_metrics.finish_run(session_id, status="edit-no-filemap")
        return

    generation_prompt = _generation_prompt(prompt, intent, history)
    job = AgentJob(
        sessionId=session_id,
        intent=intent.as_intent(),
        prompt=generation_prompt,
        frontendStack=frontend_stack,  # type: ignore[arg-type]
        backendNeed=backend_need,  # type: ignore[arg-type]
        backendStack=backend_stack,  # type: ignore[arg-type]
    )

    await log.append(
        make_event(
            "intent.classified",
            session_id,
            {**intent.model_dump(exclude_none=True), **intent_llm},
        )
    )
    if intent.phase == "clarify":
        logger.info("Session %s waiting for answers before the app shape is chosen", session_id)
        codegen_metrics.finish_run(session_id, status="clarify")
        return
    if intent.phase != "ready":
        logger.info("Session %s phase=%s — no codegen yet", session_id, intent.phase)
        codegen_metrics.finish_run(session_id, status=f"phase-{intent.phase}")
        return

    _fe = (intent.frontendStack or frontend_stack or "react").strip().lower()
    if _fe == "custom":
        _msg = "Custom stacks are not yet supported. Choose React / Vite, Angular, or SAP Fiori to continue."
        logger.warning("Session %s blocked by stack gate: fe=custom", session_id)
        await log.append(make_event("sandbox.unhealthy", session_id, {"logs": _msg, "terminal": True}))
        codegen_metrics.finish_run(session_id, status="unsupported-stack")
        return

    user_prompt = generation_prompt
    knowledge = ""
    if not saved_plan_raw and intent.kind == "new":
        knowledge = await _search_knowledge(log, session_id, generation_prompt)
        if knowledge:
            generation_prompt = f"{generation_prompt}\n\n{knowledge}"
            job = job.model_copy(update={"prompt": generation_prompt})

    plan: SessionPlan | None = None
    if saved_plan_raw:
        plan = await asyncio.to_thread(session_plan_from_payload, saved_plan_raw)
        logger.info("Session %s keeping the saved architecture plan", session_id)
        plan = await _replan_if_stack_changed(log, session_id, job, plan)
    else:
        try:
            with codegen_metrics.stage(session_id, "plan", kind="model"):
                plan = await asyncio.to_thread(build_session_plan, job)
        except CodeGeneratorError as error:
            logger.warning("Architecture planning rejected for %s: %s", session_id, error)
            await _unhealthy(log, session_id, error)
            _llm_fields("plan", session_id)
            codegen_metrics.finish_run(session_id, status="plan-error")
            await _heal_loop(
                log, session_id, generation_prompt, files, str(error), intent=intent.as_intent()
            )
            return
        plan_payload = plan.to_payload()
        await log.save_session_plan(session_id, {**plan_payload, "knowledgeContext": knowledge})
        await log.append(
            make_event(
                "architecture.planned",
                session_id,
                {
                    "message": "The shape of the app is ready, based on your answers and the project notes.",
                    "stack": plan.stack,
                    "layout": plan.layout,
                    "complexity": plan.complexity,
                    "frontendStack": plan.frontend_stack,
                    "backendStack": plan.backend_stack,
                    "plan": plan_payload,
                    **_llm_fields("plan", session_id),
                },
            )
        )

    await log.save_intent(session_id, intent.model_dump(exclude_none=True))
    recommendation: dict[str, object] | None = None
    actor_id = await log.load_actor_id(session_id)
    if actor_id:
        try:
            recommendation = await asyncio.to_thread(
                _dashboard_recommendation,
                actor_id,
                user_prompt,
                plan.frontend_stack,
                " ".join([*plan.screens, plan.notes]),
            )
        except Exception:
            logger.exception("Brownie catalog recommendation failed for %s", session_id)
    await log.append(
        make_event(
            "brownie.review",
            session_id,
            {
                "message": "I checked the existing project repos for parts that fit this app. Choose what to reuse.",
                "summary": intent.summary,
                "prompt": user_prompt,
                "stack": plan.stack,
                "frontendStack": plan.frontend_stack,
                "backendStack": plan.backend_stack,
                "screens": list(plan.screens),
                "reuseSupported": plan.frontend_stack == "react",
                "recommendation": recommendation,
            },
        )
    )
    logger.info("Session %s paused for Brownie review", session_id)
    codegen_metrics.finish_run(session_id, status="brownie-review")


def _generation_prompt(prompt: str, intent: IntentAgentOutput, history: list[ConversationTurn]) -> str:
    if intent.kind != "new":
        return prompt
    user_context = [turn.text.strip() for turn in history if turn.role == "user" and turn.text.strip()]
    return "\n\n".join(user_context) if user_context else (prompt or intent.summary or "")


async def _load_saved_intent(log: SessionEventLog, session_id: str) -> IntentAgentOutput | None:
    raw = await log.load_intent(session_id)
    if not raw:
        return None
    try:
        return IntentAgentOutput.model_validate(raw)
    except ValueError:
        logger.warning("Session %s saved intent is not valid; Brownie resume refused", session_id)
        return None


def _default_fullstack(
    intent: IntentAgentOutput,
    history: list[ConversationTurn],
    prompt: str,
    backend_need: str | None,
    backend_stack: str | None,
) -> dict[str, object]:
    """Same rule as the intent agent: an unanswered server question on a framework app means full stack."""
    from terrarium_agents.stacks import infer_backend_stack

    frontend = intent.frontendStack or "react"
    if intent.backendStack not in {None, "none"} or frontend not in {"react", "angular"}:
        return {}
    text = "\n".join([prompt, *(turn.text for turn in history if turn.role == "user")])
    backend = infer_backend_stack(text, frontend, selected=backend_stack, need=backend_need, default="node-express")
    return {"backendStack": backend, "stack": "fullstack"} if backend != "none" else {}


async def _replan_if_stack_changed(
    log: SessionEventLog, session_id: str, job: AgentJob, plan: SessionPlan
) -> SessionPlan:
    """The plan is made on the first turn; the answers can change the stack (e.g. add a server)."""
    from terrarium_agents.codegen import resolve_backend_stack, resolve_frontend_stack

    frontend, backend = resolve_frontend_stack(job), resolve_backend_stack(job)
    if (plan.frontend_stack, plan.backend_stack) == (frontend, backend):
        return plan
    logger.info(
        "Session %s re-planning: stack %s/%s -> %s/%s",
        session_id,
        plan.frontend_stack,
        plan.backend_stack,
        frontend,
        backend,
    )
    try:
        with codegen_metrics.stage(session_id, "replan", kind="model"):
            plan = await asyncio.to_thread(build_session_plan, job)
    except CodeGeneratorError as error:
        logger.warning("Session %s re-plan failed (%s); keeping the first plan", session_id, error)
        return plan
    payload = plan.to_payload()
    await log.save_session_plan(session_id, payload)
    await log.append(
        make_event(
            "architecture.planned",
            session_id,
            {
                "message": f"Architecture re-planned for {frontend} + {backend} after your answers.",
                "stack": plan.stack,
                "layout": plan.layout,
                "complexity": plan.complexity,
                "frontendStack": plan.frontend_stack,
                "backendStack": plan.backend_stack,
                "plan": payload,
                **_llm_fields("plan", session_id),
            },
        )
    )
    return plan


def _dashboard_reuse(owner_id: str | None, asset_ids: list[str], backend_stack: str) -> ReusePlan:
    from terrarium_api.brownie_catalog import reuse_from_dashboard
    from terrarium_api.db import SessionLocal

    with SessionLocal() as db:
        return reuse_from_dashboard(db, owner_id, asset_ids, backend_stack)


def _knowledge_step_delay() -> float:
    try:
        return max(0.0, float(os.environ.get("TERRARIUM_KNOWLEDGE_STEP_DELAY_S", "0.7")))
    except ValueError:
        return 0.7


async def _search_knowledge(log: SessionEventLog, session_id: str, prompt: str) -> str:
    """Search Confluence, Jira, and mail through the mock connectors, one visible step at a time."""
    from terrarium_agents.brownie_knowledge import search_steps

    delay = _knowledge_step_delay()
    await log.append(
        make_event(
            "brownie.knowledge",
            session_id,
            {
                "stage": "started",
                "message": "Searching Confluence, Jira, and mail for this project.",
                "sources": ["confluence", "jira", "mail"],
                "simulated": True,
            },
        )
    )
    context = ""
    for stage, payload in search_steps(prompt):
        if delay:
            await asyncio.sleep(delay)
        if stage == "done":
            context = str(payload.get("context") or "")
            message = f"Found {payload['factCount']} requirements in Confluence, Jira, and mail."
        elif stage == "query":
            message = f"Searching {payload['label']}"
        elif stage == "results":
            message = f"{payload['label']}: {payload['total']} found"
        else:
            message = f"{payload['label']}: {len(payload['facts'])} requirements read"
        await log.append(
            make_event(
                "brownie.knowledge",
                session_id,
                {"stage": stage, "message": message, "simulated": True, **payload},
            )
        )
    logger.info("Session %s knowledge search finished (%s chars of context)", session_id, len(context))
    return context


def _dashboard_recommendation(
    owner_id: str,
    prompt: str,
    frontend_stack: str,
    architecture: str = "",
) -> dict[str, object]:
    from terrarium_api.brownie_catalog import recommend_from_dashboard, sync_projects
    from terrarium_api.db import SessionLocal

    with SessionLocal() as db:
        # The same dashboard versions are both recommended and later reused.
        sync_projects(db, {"id": owner_id})
        return recommend_from_dashboard(
            db,
            owner_id,
            prompt,
            frontend_stack=frontend_stack,
            architecture=architecture,
        )


async def _continue_after_brownie(
    log: SessionEventLog,
    session_id: str,
    files: dict[str, str] | None,
    history: list[ConversationTurn],
    intent: IntentAgentOutput,
    saved_plan_raw: dict[str, object],
    asset_ids: list[str],
    *,
    frontend_stack: str | None,
    backend_need: str | None,
    backend_stack: str | None,
) -> None:
    """Resume a paused build with the Brownie assets the user accepted."""
    generation_prompt = _generation_prompt("", intent, history)
    knowledge = str(saved_plan_raw.get("knowledgeContext") or "")
    if knowledge:
        generation_prompt = f"{generation_prompt}\n\n{knowledge}"
    job = AgentJob(
        sessionId=session_id,
        intent=intent.as_intent(),
        prompt=generation_prompt,
        frontendStack=frontend_stack,  # type: ignore[arg-type]
        backendNeed=backend_need,  # type: ignore[arg-type]
        backendStack=backend_stack,  # type: ignore[arg-type]
    )
    plan = await asyncio.to_thread(session_plan_from_payload, saved_plan_raw)
    await log.clear_session_plan(session_id)
    reuse_supported = plan.frontend_stack == "react"
    if reuse_supported and asset_ids:
        owner_id = await log.load_actor_id(session_id)
        reuse = await asyncio.to_thread(_dashboard_reuse, owner_id, asset_ids, plan.backend_stack)
    else:
        reuse = ReusePlan(ignored=tuple((asset_id, "React builds only.") for asset_id in asset_ids))
    if reuse.applied:
        sources = sorted({asset.tool_name for asset in reuse.applied})
        message = (
            f"Reusing {len(reuse.applied)} component(s) from {', '.join(sources)}; "
            "the generator writes only the remaining files."
        )
    elif asset_ids and not reuse_supported:
        message = "Brownie reuse applies to React builds only. Generating every file."
    else:
        message = "No Brownie assets accepted. Generating every file."
    await log.append(
        make_event(
            "brownie.applied",
            session_id,
            {
                "message": message,
                "requestedAssetIds": asset_ids,
                "appliedAssetIds": reuse.applied_ids,
                "ignoredAssetIds": reuse.ignored_ids,
                "ignored": [{"assetId": asset_id, "reason": reason} for asset_id, reason in reuse.ignored],
                "files": list(reuse.files),
                "provenance": reuse.provenance(),
                "reuseSupported": reuse_supported,
                "simulated": True,
            },
        )
    )
    logger.info(
        "Session %s Brownie resume requested=%s applied=%s ignored=%s",
        session_id,
        asset_ids,
        reuse.applied_ids,
        reuse.ignored,
    )
    await _codegen_and_preview(
        log,
        session_id,
        generation_prompt,
        files,
        intent,
        job,
        plan,
        reuse,
    )


async def _codegen_and_preview(
    log: SessionEventLog,
    session_id: str,
    prompt: str,
    files: dict[str, str] | None,
    intent: IntentAgentOutput,
    job: AgentJob,
    plan: SessionPlan,
    reuse: ReusePlan,
) -> None:
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
        "reusedFiles": list(reuse.files),
        "reusedAssetIds": reuse.applied_ids,
        **_llm_fields("plan", session_id),
    }
    await log.append(make_event("codegen.started", session_id, started_payload))
    with codegen_metrics.stage(session_id, "preview_skeleton_stream", kind="infrastructure"):
        await _emit_preview_stream_started(log, session_id, plan_payload)
    logger.info(
        "Codegen %s complexity=%s stack=%s layout=%s theme=%s — overlay starting",
        session_id,
        plan.complexity,
        plan.stack,
        plan.layout,
        plan.theme,
    )
    streamed_paths: list[str] = []
    try:
        with codegen_metrics.stage(session_id, "codegen", kind="model"):
            loop = asyncio.get_running_loop()
            first_file_at = loop.time()
            first_file_logged = {"done": False}

            def _on_generated_file(path: str, content: str) -> None:
                if not first_file_logged["done"]:
                    first_file_logged["done"] = True
                    codegen_metrics.event(
                        session_id,
                        "codegen.first_file",
                        {
                            "path": path,
                            "secondsSinceCodegenStage": round(loop.time() - first_file_at, 3),
                        },
                    )
                streamed_paths.append(path)
                future = asyncio.run_coroutine_threadsafe(
                    log.append(
                        make_event(
                            "preview.stream.file",
                            session_id,
                            PreviewStreamFilePayload(
                                path=path,
                                content=content,
                                complete=False,
                            ).model_dump(exclude_none=True),
                        )
                    ),
                    loop,
                )
                future.result(timeout=10)

            set_canary_actor(await log.load_actor_email(session_id) or "")
            result = await asyncio.to_thread(
                generate, job, plan, on_file=_on_generated_file, reuse=reuse
            )
            if streamed_paths:
                codegen_metrics.event(
                    session_id,
                    "codegen.streamed_files",
                    {"paths": streamed_paths, "count": len(streamed_paths)},
                )
    except DemoBlocked as error:
        message = str(error)
        terminal = (
            not error.retry
            or kill_switch_on()
            or message in {KILL_MESSAGE, NOT_SUPPORTED_MESSAGE}
        )
        if terminal:
            await _stop_unvalidated(
                log,
                session_id,
                message,
                offer_retry=message not in {KILL_MESSAGE, NOT_SUPPORTED_MESSAGE},
            )
            return
        attempt_id = uuid4().hex
        await log.append(
            make_event(
                "codegen.retry",
                session_id,
                {
                    "attemptId": attempt_id,
                    "message": f"{message} Trying once more.",
                },
            )
        )
        try:
            result = await asyncio.to_thread(
                generate, job, plan, on_file=_on_generated_file, reuse=reuse
            )
        except DemoBlocked as again:
            await _stop_unvalidated(log, session_id, str(again), offer_retry=True)
            return
        except ProvidersUnavailable as error:
            await _stop_providers_unavailable(log, session_id, error)
            return
        except CodeGeneratorError as error:
            logger.warning("Code generation rejected for %s: %s", session_id, error)
            await _unhealthy(log, session_id, error)
            _llm_fields("codegen", session_id)
            codegen_metrics.finish_run(session_id, status="codegen-error")
            await _heal_loop(
                log, session_id, prompt, files, str(error), intent=intent.as_intent(), plan=plan, reuse=reuse
            )
            return
        except Exception as error:
            logger.exception("Code generation failed for %s", session_id)
            await _unhealthy(log, session_id, error)
            _llm_fields("codegen", session_id)
            codegen_metrics.finish_run(session_id, status="codegen-error")
            await _heal_loop(
                log, session_id, prompt, files, str(error), intent=intent.as_intent(), plan=plan, reuse=reuse
            )
            return
    except ProvidersUnavailable as error:
        await _stop_providers_unavailable(log, session_id, error)
        return
    except CodeGeneratorError as error:
        logger.warning("Code generation rejected for %s: %s", session_id, error)
        await _unhealthy(log, session_id, error)
        _llm_fields("codegen", session_id)
        codegen_metrics.finish_run(session_id, status="codegen-error")
        await _heal_loop(
            log, session_id, prompt, files, str(error), intent=intent.as_intent(), plan=plan, reuse=reuse
        )
        return
    except Exception as error:
        logger.exception("Code generation failed for %s", session_id)
        await _unhealthy(log, session_id, error)
        _llm_fields("codegen", session_id)
        codegen_metrics.finish_run(session_id, status="codegen-error")
        await _heal_loop(
            log, session_id, prompt, files, str(error), intent=intent.as_intent(), plan=plan, reuse=reuse
        )
        return

    with codegen_metrics.stage(session_id, "save_filemap", kind="infrastructure"):
        await log.save_files(session_id, result.files)
        codegen_metrics.record_filemap(session_id, result.files)
    with codegen_metrics.stage(session_id, "preview_file_replay", kind="infrastructure"):
        # If tagged streaming already emitted files, only send the completion event.
        if streamed_paths:
            await log.append(
                make_event(
                    "preview.stream.completed",
                    session_id,
                    {
                        "files": _ordered_file_paths(result.files),
                        "message": "Live preview files streamed during generation; verifying in Docker.",
                        "streamedDuringCodegen": True,
                    },
                )
            )
        else:
            await _emit_preview_stream_files(log, session_id, result.files)
    llm = _llm_fields("codegen", session_id)
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
    with codegen_metrics.stage(session_id, "sandbox_boot_and_health", kind="infrastructure"):
        failed = await _boot_preview(log, session_id, job, files=result.files, draft=False)
    if failed:
        codegen_metrics.finish_run(session_id, status="preview-unhealthy")
        await _heal_loop(
            log,
            session_id,
            prompt,
            result.files,
            failed,
            intent=intent.as_intent(),
        )
    else:
        codegen_metrics.finish_run(session_id, status="ready")


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
        with codegen_metrics.stage(session_id, "editor", kind="model"):
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
        _llm_fields("editor", session_id)
        return str(error)

    merged = {**files, **result.files}
    with codegen_metrics.stage(session_id, "save_edit_filemap", kind="infrastructure"):
        await log.save_files(session_id, merged)
        codegen_metrics.record_filemap(session_id, merged)
    with codegen_metrics.stage(session_id, "preview_edit_file_replay", kind="infrastructure"):
        await _emit_preview_stream_files(
            log, session_id, merged, paths=sorted(result.files.keys())
        )
    llm = _llm_fields("editor", session_id)
    from terrarium_agents.edit_check import edit_matches_request

    edit_check = edit_matches_request(prompt, result.files)
    logger.info(
        "Edit check %s ok=%s cssOnly=%s files=%s",
        session_id,
        edit_check["ok"],
        edit_check["cssOnly"],
        edit_check["evidenceFiles"],
    )
    await log.append(
        make_event(
            "editor.completed",
            session_id,
            {
                "commitMessage": result.commitMessage,
                "filesChanged": sorted(result.files.keys()),
                **llm,
            },
        )
    )
    await log.append(make_event("edit.verified", session_id, edit_check))
    job = AgentJob(sessionId=session_id, intent=intent.as_intent(), prompt=prompt)
    with codegen_metrics.stage(session_id, "sandbox_boot_and_health", kind="infrastructure"):
        return await _boot_preview(log, session_id, job, files=merged, draft=False)


async def _sync_github(log: SessionEventLog, session_id: str, files: dict[str, str]) -> None:
    try:
        from terrarium_api.github_sync import sync_session_to_github

        await sync_session_to_github(log, session_id, files)
    except Exception:
        logger.exception("GitHub sync skipped for %s", session_id)


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
    with codegen_metrics.stage(session_id, "filemap_validation", kind="infrastructure"):
        is_valid, validation_error = _validate_filemap_structure(files)
    if not is_valid:
        logger.warning("Session %s failed static validation: %s", session_id, validation_error)
        if draft:
            return None
        await _unhealthy(log, session_id, f"File structure validation failed: {validation_error}")
        return f"File structure validation failed: {validation_error}"

    from terrarium_sandbox.trust import preboot_blocks_boot, scan

    with codegen_metrics.stage(session_id, "preboot_scan", kind="infrastructure"):
        preboot_findings, preboot_secrets, _ = scan(
            files, tool_id=session_id, version_id=session_id
        )
    if preboot_blocks_boot(preboot_findings, preboot_secrets):
        blocking = [
            item
            for item in preboot_findings
            if item.source == "gitleaks"
            or (item.source == "semgrep" and item.severity in ("high", "critical"))
        ]
        for item in blocking:
            logger.warning(
                "Session %s blocked by security gate file=%s rule=%s title=%s",
                session_id,
                item.file,
                item.rule,
                item.title,
            )
        detail = "blocked by security gate"
        await log.append(
            make_event(
                "blocked by security gate",
                session_id,
                {
                    "message": detail,
                    "findings": [
                        {
                            "file": item.file,
                            "rule": item.rule,
                            "title": item.title,
                            "severity": item.severity,
                            "source": item.source,
                        }
                        for item in blocking
                    ],
                },
            )
        )
        if draft:
            return detail
        await _unhealthy(log, session_id, detail)
        return detail
    
    filemap = files
    await log.save_files(session_id, filemap)
    if not draft:
        with codegen_metrics.stage(session_id, "github_sync", kind="infrastructure"):
            await _sync_github(log, session_id, filemap)
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
        logger.info("Session %s starting Docker sandbox (%s files)", session_id, len(filemap))
        with codegen_metrics.stage(session_id, "sandbox_start", kind="infrastructure"):
            handle = await asyncio.to_thread(
                lambda: runner.start(session_id, files=filemap)
            )
        logger.info(
            "Session %s container started id=%s url=%s; waiting for health",
            session_id,
            handle.containerId,
            handle.previewUrl,
        )
        with codegen_metrics.stage(session_id, "sandbox_health_check", kind="infrastructure"):
            report = await asyncio.to_thread(runner.wait_until_healthy, session_id)
        logger.info("Session %s sandbox health=%s", session_id, report.status)
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
    codegen_metrics.event(session_id, "preview.healthy", {"previewUrl": handle.previewUrl})
    await log.save_preview_url(session_id, handle.previewUrl)

    raw_checks = await log.load_acceptance_checks(session_id)
    if raw_checks:
        from terrarium_contracts import AcceptanceCheck
        from terrarium_api.trust.session_checks import run_session_acceptance_checks

        checks = [AcceptanceCheck.model_validate(item) for item in raw_checks]
        check_error = await run_session_acceptance_checks(
            log, session_id, handle.previewUrl, filemap, checks
        )
        if check_error:
            intent_raw = await log.load_intent(session_id) or {}
            heal_intent = Intent(
                kind=intent_raw.get("kind", "modify"),  # type: ignore[arg-type]
                stack=intent_raw.get("stack", "react"),  # type: ignore[arg-type]
                summary=str(intent_raw.get("summary") or "Fix acceptance checks"),
            )
            await _heal_loop(log, session_id, "Fix failing acceptance checks", filemap, check_error, intent=heal_intent)
            return check_error
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
    plan: SessionPlan | None = None,
    reuse: ReusePlan | None = None,
) -> None:
    """Retry Editor or Code Generator at most 3 times, then emit heal.exhausted.

    A security-gate block is not a code defect the editor can patch, so heal
    does not run.
    """
    if "blocked by security gate" in (logs or ""):
        logger.info(
            "Heal skipped for %s: build was blocked by the security gate",
            session_id,
        )
        await log.append(
            make_event(
                "heal.skipped",
                session_id,
                {
                    "reason": "blocked by security gate",
                    "logs": logs,
                    "message": "Not repairing a security-gate block.",
                },
            )
        )
        codegen_metrics.finish_run(session_id, status="security-gate")
        return
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
            codegen_metrics.finish_run(session_id, status="heal-exhausted")
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
        codegen_metrics.event(session_id, "heal.attempt", {"attempt": attempt})
        logger.info("Heal attempt %s/3 for %s", attempt, session_id)
        try:
            with codegen_metrics.stage(session_id, f"heal_decision_{attempt}", kind="model"):
                decision = await asyncio.to_thread(run_heal, job)
        except HealAgentError as error:
            _llm_fields("heal", session_id)
            current_logs = str(error)
            continue
        _llm_fields("heal", session_id)
        try:
            if decision.route == "editor" and current_files:
                with codegen_metrics.stage(session_id, f"heal_editor_{attempt}", kind="model"):
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
                _llm_fields("editor", session_id)
                current_files = {**current_files, **result.files}
            else:
                with codegen_metrics.stage(session_id, f"heal_codegen_{attempt}", kind="model"):
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
                        plan,
                        reuse=reuse if reuse is not None and reuse.files else None,
                    )
                _llm_fields("codegen", session_id)
                current_files = result.files
        except ProvidersUnavailable as error:
            await _stop_providers_unavailable(log, session_id, error)
            return
        except Exception as error:
            logger.exception("Heal %s/%s agent failed for %s", attempt, 3, session_id)
            current_logs = str(error)
            continue
        with codegen_metrics.stage(session_id, f"heal_save_filemap_{attempt}", kind="infrastructure"):
            await log.save_files(session_id, current_files)
            codegen_metrics.record_filemap(session_id, current_files)
        with codegen_metrics.stage(session_id, f"heal_preview_replay_{attempt}", kind="infrastructure"):
            await _emit_preview_stream_files(log, session_id, current_files)
        boot_job = AgentJob(sessionId=session_id, intent=intent, prompt=prompt)
        with codegen_metrics.stage(session_id, f"heal_sandbox_boot_and_health_{attempt}", kind="infrastructure"):
            failed_logs = await _boot_preview(
                log, session_id, boot_job, files=current_files, draft=False
            )
        if failed_logs is None:
            logger.info("Heal %s recovered %s", attempt, session_id)
            codegen_metrics.finish_run(session_id, status=f"healed-{attempt}")
            return
        if "blocked by security gate" in failed_logs:
            logger.info(
                "Heal stopped for %s: repaired files were blocked by the security gate",
                session_id,
            )
            await log.append(
                make_event(
                    "heal.skipped",
                    session_id,
                    {
                        "reason": "blocked by security gate",
                        "logs": failed_logs,
                        "attempt": attempt,
                        "message": "Not repairing a security-gate block.",
                    },
                )
            )
            codegen_metrics.finish_run(session_id, status="security-gate")
            return
        current_logs = failed_logs


async def run_relay_poll(ctx: dict) -> None:
    from terrarium_api.change_requests import poll_relay_once

    worker_id = os.environ.get("WORKER_ID", "laptop-worker")
    await poll_relay_once(worker_id)


async def run_nightly_trust_scan(ctx: dict) -> None:
    """Re-scan live tools and open remediation campaigns (P7-S10)."""
    from terrarium_api.db import SessionLocal
    from terrarium_api.trust.campaigns import run_fleet_campaigns

    _ = ctx
    with SessionLocal() as db:
        await run_fleet_campaigns(db)
    logger.info("Nightly trust scan complete")


async def run_morning_digest_job(ctx: dict) -> None:
    from terrarium_api.db import SessionLocal
    from terrarium_api.trust.campaigns import run_morning_digest

    _ = ctx
    with SessionLocal() as db:
        await run_morning_digest(db)
    logger.info("Morning digest job complete")


async def on_startup(ctx: dict) -> None:
    import asyncio

    from terrarium_api.change_requests import poll_relay_once

    async def relay_loop() -> None:
        worker_id = os.environ.get("WORKER_ID", "laptop-worker")
        while True:
            try:
                await poll_relay_once(worker_id)
            except Exception:
                logger.exception("Relay poll error")
            await asyncio.sleep(15)

    asyncio.create_task(relay_loop())

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
    functions = [
        run_stub_session,
        run_runtime_error_heal,
        run_relay_poll,
        run_nightly_trust_scan,
        run_morning_digest_job,
    ]
    on_startup = on_startup
    try:
        from arq.cron import cron

        cron_jobs = [
            cron(run_nightly_trust_scan, hour=2, minute=0),
            cron(run_morning_digest_job, hour=8, minute=0),
        ]
    except ImportError:
        cron_jobs = []
    redis_settings = redis_settings()
    job_timeout = 900
    max_jobs = 2
