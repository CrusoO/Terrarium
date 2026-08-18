from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from arq import create_pool
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from terrarium_api.routes.health import router as health_router
from terrarium_api.routes.sessions import router as sessions_router
from terrarium_api.settings import redis_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
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
    app.include_router(sessions_router)
    return app
