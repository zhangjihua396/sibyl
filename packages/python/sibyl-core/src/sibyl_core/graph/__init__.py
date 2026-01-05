"""Graph database client and operations."""

from sibyl_core.graph.batch import (
    batch_create_nodes,
    batch_create_relationships,
    batch_delete_nodes,
    batch_update_nodes,
)
from sibyl_core.graph.client import GraphClient, get_graph_client, reset_graph_client
from sibyl_core.graph.entities import EntityManager
from sibyl_core.graph.relationships import RelationshipManager

__all__ = [
    "EntityManager",
    "GraphClient",
    "RelationshipManager",
    "batch_create_nodes",
    "batch_create_relationships",
    "batch_delete_nodes",
    "batch_update_nodes",
    "get_graph_client",
    "reset_graph_client",
]
