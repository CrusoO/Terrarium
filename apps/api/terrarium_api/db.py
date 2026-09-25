from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from terrarium_api.settings import DATABASE_URL


class Base(DeclarativeBase):
    pass


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    from terrarium_api import models  # noqa: F401

    migration_dir = Path(__file__).resolve().parents[1] / "migrations"
    if migration_dir.exists():
        config = Config()
        config.set_main_option("script_location", str(migration_dir))
        # configparser treats % as interpolation; escape it.
        config.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))
        table_names = set(inspect(engine).get_table_names())
        if {"tools", "tool_versions", "sessions"}.issubset(table_names) and "alembic_version" not in table_names:
            command.stamp(config, "head")
            return
        command.upgrade(config, "head")
        return
    Base.metadata.create_all(bind=engine)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
