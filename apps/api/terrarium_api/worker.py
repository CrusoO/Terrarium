from __future__ import annotations

import asyncio
import logging

from terrarium_contracts import PreviewReadyPayload, SandboxReadyPayload
from terrarium_sandbox import SandboxError, SandboxRunner

from terrarium_api.events import make_event
from terrarium_api.session_log import SessionEventLog
from terrarium_api.settings import redis_settings
from terrarium_api.stub import echo_filemap

logger = logging.getLogger(__name__)


async def run_stub_session(ctx: dict, session_id: str, prompt: str) -> None:
    """Echo stub: persist a FileMap, boot the Docker fixture, emit preview.ready. No LLM."""
    log = SessionEventLog(ctx["redis"])
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
    logger.info("Terrarium ARQ worker started (echo stub, no LLM)")


class WorkerSettings:
    functions = [run_stub_session]
    on_startup = on_startup
    redis_settings = redis_settings()
    job_timeout = 180
    max_jobs = 2
