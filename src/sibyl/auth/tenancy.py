"""Tenant/group helpers for graph operations.

Graphiti uses `group_id` to scope nodes/edges and searches. We treat the JWT `org`
claim as the canonical group id for graph operations.
"""

from __future__ import annotations

DEFAULT_GRAPH_GROUP_ID = "conventions"


def resolve_group_id(claims: dict | None) -> str:
    """Resolve the graph group_id for a request.

    - If JWT claims include an `org` id, use it (stringified).
    - Otherwise fall back to a shared default group.
    """
    if claims and claims.get("org"):
        return str(claims["org"])
    return DEFAULT_GRAPH_GROUP_ID

