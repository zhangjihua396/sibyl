"""Database migration utilities.

Auto-runs Alembic migrations on server startup to ensure schema is current.
"""

import asyncio
import os
from pathlib import Path

import structlog

log = structlog.get_logger()


def _run_migrations_sync() -> None:
    """Run Alembic migrations (synchronous)."""
    from alembic import command
    from alembic.config import Config

    # In Docker: /app/alembic.ini
    # In dev: find relative to source
    alembic_ini = Path(os.environ.get("ALEMBIC_CONFIG", "/app/alembic.ini"))

    # Fallback for development (source tree)
    if not alembic_ini.exists():
        # Go up from sibyl/db/migrations.py to apps/api
        api_root = Path(__file__).parent.parent.parent
        alembic_ini = api_root / "alembic.ini"

    if not alembic_ini.exists():
        log.warning("alembic.ini not found, skipping migrations", path=str(alembic_ini))
        return

    log.info("Running database migrations...", config=str(alembic_ini))
    alembic_cfg = Config(str(alembic_ini))
    command.upgrade(alembic_cfg, "head")
    log.info("Database migrations complete")


async def run_migrations() -> None:
    """Run database migrations on startup (async wrapper)."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _run_migrations_sync)
