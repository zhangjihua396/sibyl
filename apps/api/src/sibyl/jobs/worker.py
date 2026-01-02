"""arq worker - processes background jobs.

Run with: uv run arq sibyl.jobs.WorkerSettings

This is the worker entrypoint. Job implementations are in:
- crawl.py: crawl_source, sync_source, sync_all_sources
- entities.py: create_entity, create_learning_episode, update_entity
- agents.py: run_agent_execution, resume_agent_execution, generate_status_hint
"""

from datetime import UTC, datetime
from typing import Any

import structlog
from arq.connections import RedisSettings

from sibyl.config import settings

# Import job functions from their modules
from sibyl.jobs.agents import (
    generate_status_hint,
    resume_agent_execution,
    run_agent_execution,
)
from sibyl.jobs.crawl import crawl_source, sync_all_sources, sync_source
from sibyl.jobs.entities import create_entity, create_learning_episode, update_entity

log = structlog.get_logger()


def get_redis_settings() -> RedisSettings:
    """Get Redis connection settings."""
    return RedisSettings(
        host=settings.falkordb_host,
        port=settings.falkordb_port,
        password=settings.falkordb_password,
        database=settings.redis_jobs_db,
    )


async def startup(ctx: dict[str, Any]) -> None:
    """Worker startup - initialize resources."""
    from sibyl.banner import log_banner
    from sibyl_core.logging import configure_logging

    # Reconfigure logging for worker (overrides API default)
    configure_logging(service_name="worker")

    log_banner(component="worker")
    log.info("Job worker online")
    ctx["start_time"] = datetime.now(UTC)


async def shutdown(ctx: dict[str, Any]) -> None:  # noqa: ARG001
    """Worker shutdown - cleanup resources."""
    log.info("Job worker shutting down")


class WorkerSettings:
    """arq worker settings."""

    redis_settings = get_redis_settings()

    # Job functions (imported from separate modules)
    functions = [
        # Crawl jobs
        crawl_source,
        sync_source,
        sync_all_sources,
        # Entity jobs
        create_entity,
        create_learning_episode,
        update_entity,
        # Agent jobs
        run_agent_execution,
        resume_agent_execution,
        generate_status_hint,
    ]

    # Lifecycle hooks
    on_startup = startup
    on_shutdown = shutdown

    # Worker settings
    max_jobs = 3  # Max concurrent jobs
    job_timeout = 3600  # 1 hour timeout for crawl jobs
    keep_result = 86400  # Keep results for 24 hours
    poll_delay = 0.5  # Check for jobs every 0.5s


async def run_worker_async() -> None:
    """Run the arq worker in-process.

    This allows running the worker as part of the main server process
    instead of as a separate process. Useful for development and
    simpler deployments.
    """
    from arq import Worker

    settings = WorkerSettings.redis_settings
    log.info(
        "Starting in-process job worker",
        redis_host=settings.host,
        redis_port=settings.port,
        redis_db=settings.database,
        max_jobs=WorkerSettings.max_jobs,
    )

    try:
        worker = Worker(
            functions=WorkerSettings.functions,
            redis_settings=settings,
            on_startup=WorkerSettings.on_startup,  # pyright: ignore[reportAttributeAccessIssue]
            on_shutdown=WorkerSettings.on_shutdown,  # pyright: ignore[reportAttributeAccessIssue]
            max_jobs=WorkerSettings.max_jobs,
            job_timeout=WorkerSettings.job_timeout,
            keep_result=WorkerSettings.keep_result,
            poll_delay=WorkerSettings.poll_delay,
        )

        await worker.async_run()
    except Exception:
        log.exception("Job worker crashed")
        raise
