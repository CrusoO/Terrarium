from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from terrarium_api.routes.health import router as health_router
from terrarium_api.routes.sessions import router as sessions_router


def create_app() -> FastAPI:
    app = FastAPI(title="Terrarium API", version="0.0.0")
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
