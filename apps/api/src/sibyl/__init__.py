"""Sibyl API Server.

Graphiti-powered knowledge graph providing AI agents access to development
conventions, patterns, templates, and hard-won wisdom.
"""

from sibyl_core.logging import configure_logging

# Configure logging FIRST before any other modules use structlog
configure_logging(service_name="api")

from sibyl.config import Settings  # noqa: E402 - must come after logging config

__version__ = "0.1.0"
__all__ = ["Settings", "__version__"]
