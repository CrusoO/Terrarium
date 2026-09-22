import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from arq import create_pool
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from terrarium_api.routes.health import router as health_router
from terrarium_api.routes.preview import router as preview_router
from terrarium_api.routes.sessions import router as sessions_router
from terrarium_api.routes.workspace import router as workspace_router
from terrarium_api.db import init_db
from terrarium_api.settings import redis_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    try:
        pool = await create_pool(redis_settings())
    except Exception:
        pool = None
    app.state.redis = pool
    try:
        yield
    finally:
        if pool is not None:
            close = getattr(pool, "aclose", None) or getattr(pool, "close")
            await close()


def create_app() -> FastAPI:
    app = FastAPI(title="Terrarium API", version="0.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router)
    app.include_router(preview_router)
    app.include_router(sessions_router)
    app.include_router(workspace_router)
    _attach_web_ui(app)
    return app


def _attach_web_ui(app: FastAPI) -> None:
    """Serve the built React app from the same host as the API."""
    raw = os.environ.get("TERRARIUM_WEB_DIST", "").strip()
    if not raw:
        return
    dist = Path(raw)
    index = dist / "index.html"
    if not index.is_file():
        return
    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="web-assets")

    @app.get("/", include_in_schema=False)
    async def web_index() -> FileResponse:
        return FileResponse(index)
