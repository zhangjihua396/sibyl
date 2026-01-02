"""Direct Redis subscription for worker-side pubsub.

The worker process needs to receive approval responses from the API process.
Since they don't share memory, we use Redis pubsub for IPC.

This module provides a simple interface for the worker to subscribe to
approval-specific channels and wait for responses.

Channel naming: sibyl:approval:{approval_id}
"""

import asyncio
import json
from typing import Any

import structlog
from redis.asyncio import Redis

from sibyl.config import settings

log = structlog.get_logger()

# Use same Redis DB as websocket pubsub for consistency
PUBSUB_DB = 2

# Channel prefixes for IPC messages
APPROVAL_CHANNEL_PREFIX = "sibyl:approval:"
QUESTION_CHANNEL_PREFIX = "sibyl:question:"


async def _get_redis() -> Redis:
    """Get a Redis connection for pubsub."""
    return Redis(
        host=settings.falkordb_host,
        port=settings.falkordb_port,
        password=settings.falkordb_password,
        db=PUBSUB_DB,
        decode_responses=True,
    )


async def wait_for_approval_response(
    approval_id: str,
    wait_timeout: float = 300.0,
) -> dict[str, Any] | None:
    """Subscribe to an approval channel and wait for a response.

    This is a blocking call that waits for the API to publish an approval
    decision to the channel. Used by ApprovalService in the worker process.

    Args:
        approval_id: The approval record ID to wait for
        wait_timeout: Maximum time to wait in seconds (default 5 minutes)

    Returns:
        The approval response dict if received, None if timeout
    """
    channel = f"{APPROVAL_CHANNEL_PREFIX}{approval_id}"
    redis = await _get_redis()
    pubsub = redis.pubsub()

    try:
        await pubsub.subscribe(channel)
        log.debug("Subscribed to approval channel", channel=channel)

        # Wait for message with timeout
        async with asyncio.timeout(wait_timeout):
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    log.info(
                        "Received approval response",
                        approval_id=approval_id,
                        approved=data.get("approved"),
                    )
                    return data

    except TimeoutError:
        log.warning("Approval request timed out", approval_id=approval_id)
        return None

    except Exception as e:
        log.exception("Error waiting for approval", approval_id=approval_id, error=str(e))
        return None

    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await redis.close()

    return None


async def publish_approval_response(
    approval_id: str,
    response: dict[str, Any],
) -> bool:
    """Publish an approval response to the worker channel.

    Called by the API when a user responds to an approval request.

    Args:
        approval_id: The approval record ID
        response: Dict with 'approved', 'action', 'by', 'message' keys

    Returns:
        True if published successfully, False otherwise
    """
    channel = f"{APPROVAL_CHANNEL_PREFIX}{approval_id}"
    redis = await _get_redis()

    try:
        await redis.publish(channel, json.dumps(response))
        log.info(
            "Published approval response",
            approval_id=approval_id,
            approved=response.get("approved"),
        )
        return True

    except Exception as e:
        log.exception("Failed to publish approval response", approval_id=approval_id, error=str(e))
        return False

    finally:
        await redis.close()


async def wait_for_question_response(
    question_id: str,
    wait_timeout: float = 300.0,
) -> dict[str, Any] | None:
    """Subscribe to a question channel and wait for a user response.

    This is a blocking call that waits for the API to publish a user's
    answer to the question. Used by the AskUserQuestion hook in the worker.

    Args:
        question_id: The question record ID to wait for
        wait_timeout: Maximum time to wait in seconds (default 5 minutes)

    Returns:
        The response dict with 'answers' if received, None if timeout
    """
    channel = f"{QUESTION_CHANNEL_PREFIX}{question_id}"
    redis = await _get_redis()
    pubsub = redis.pubsub()

    try:
        await pubsub.subscribe(channel)
        log.debug("Subscribed to question channel", channel=channel)

        # Wait for message with timeout
        async with asyncio.timeout(wait_timeout):
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    log.info(
                        "Received question response",
                        question_id=question_id,
                        answers=data.get("answers"),
                    )
                    return data

    except TimeoutError:
        log.warning("Question request timed out", question_id=question_id)
        return None

    except Exception as e:
        log.exception("Error waiting for question", question_id=question_id, error=str(e))
        return None

    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await redis.close()

    return None


async def publish_question_response(
    question_id: str,
    response: dict[str, Any],
) -> bool:
    """Publish a question response to the worker channel.

    Called by the API when a user answers a question.

    Args:
        question_id: The question record ID
        response: Dict with 'answers', 'by' keys

    Returns:
        True if published successfully, False otherwise
    """
    channel = f"{QUESTION_CHANNEL_PREFIX}{question_id}"
    redis = await _get_redis()

    try:
        await redis.publish(channel, json.dumps(response))
        log.info(
            "Published question response",
            question_id=question_id,
            answers=response.get("answers"),
        )
        return True

    except Exception as e:
        log.exception("Failed to publish question response", question_id=question_id, error=str(e))
        return False

    finally:
        await redis.close()
