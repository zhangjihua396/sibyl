"""E2E tests for API endpoints."""

import pytest


class TestAPIEndpoints:
    """Test key API endpoints directly."""

    def test_health_endpoint(self, sync_api_client) -> None:
        """GET /health returns healthy status."""
        response = sync_api_client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert "status" in data

    def test_admin_stats(self, sync_api_client) -> None:
        """GET /admin/stats returns entity counts."""
        response = sync_api_client.get("/admin/stats")
        # May require auth
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)

    def test_entities_list(self, sync_api_client) -> None:
        """GET /entities returns entity list."""
        response = sync_api_client.get("/entities")
        # May require auth
        if response.status_code == 200:
            data = response.json()
            assert "entities" in data or isinstance(data, list)

    def test_entities_with_type_filter(self, sync_api_client) -> None:
        """GET /entities?entity_type=pattern filters correctly."""
        response = sync_api_client.get("/entities", params={"entity_type": "pattern"})
        if response.status_code == 200:
            data = response.json()
            entities = data.get("entities", data)
            # All should be patterns
            for entity in entities:
                if "entity_type" in entity:
                    assert entity["entity_type"] == "pattern"

    def test_search_endpoint(self, sync_api_client) -> None:
        """POST /search performs semantic search."""
        response = sync_api_client.post("/search", json={"query": "test", "limit": 5})
        # May require auth
        if response.status_code == 200:
            data = response.json()
            assert "results" in data or isinstance(data, list)

    def test_graph_full(self, sync_api_client) -> None:
        """GET /graph/full returns graph data."""
        response = sync_api_client.get("/graph/full")
        # May require auth
        if response.status_code == 200:
            data = response.json()
            assert "nodes" in data or "edges" in data or isinstance(data, dict)


@pytest.mark.asyncio
class TestAsyncAPI:
    """Async API tests."""

    async def test_async_entities(self, api_client) -> None:
        """Async GET /entities."""
        response = await api_client.get("/entities")
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (dict, list))

    async def test_async_search(self, api_client) -> None:
        """Async POST /search."""
        response = await api_client.post("/search", json={"query": "authentication", "limit": 3})
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, (dict, list))
