"""Tests for RAG API endpoints.

Tests the RAG search, code example search, and page retrieval endpoints.
Uses mocked database and embedding service.
"""

import pytest
from datetime import datetime, UTC
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_embed_text():
    """Mock the embed_text function to return fake embeddings."""
    async def fake_embed(text: str) -> list[float]:
        # Return a fake 1536-dim embedding
        return [0.1] * 1536

    with patch("sibyl.api.routes.rag.embed_text", fake_embed):
        yield fake_embed


@pytest.fixture
def mock_session():
    """Mock database session."""
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


@pytest.fixture
def sample_chunk():
    """Create a sample DocumentChunk for testing."""
    chunk = MagicMock()
    chunk.id = uuid4()
    chunk.document_id = uuid4()
    chunk.chunk_index = 0
    chunk.chunk_type = MagicMock()
    chunk.chunk_type.value = "text"
    chunk.content = "This is sample chunk content about authentication patterns."
    chunk.context = "Document: Auth Guide | Section: Best Practices"
    chunk.heading_path = ["Authentication", "Best Practices"]
    chunk.language = None
    chunk.embedding = [0.1] * 1536
    return chunk


@pytest.fixture
def sample_document():
    """Create a sample CrawledDocument for testing."""
    doc = MagicMock()
    doc.id = uuid4()
    doc.source_id = uuid4()
    doc.url = "https://docs.example.com/auth"
    doc.title = "Authentication Guide"
    doc.content = "Full document content about authentication..."
    doc.raw_content = "<html>...</html>"
    doc.word_count = 500
    doc.token_count = 650
    doc.has_code = True
    doc.is_index = False
    doc.depth = 1
    doc.headings = ["Introduction", "OAuth", "JWT"]
    doc.code_languages = ["python", "javascript"]
    doc.links = ["https://docs.example.com/oauth"]
    doc.crawled_at = datetime.now(UTC)
    return doc


@pytest.fixture
def sample_source():
    """Create a sample CrawlSource for testing."""
    source = MagicMock()
    source.id = uuid4()
    source.name = "Example Docs"
    source.url = "https://docs.example.com"
    return source


# =============================================================================
# RAG Search Endpoint Tests
# =============================================================================


class TestRAGSearchEndpoint:
    """Tests for POST /rag/search endpoint."""

    @pytest.mark.asyncio
    async def test_basic_search(
        self, mock_embed_text, mock_session, sample_chunk, sample_document, sample_source
    ):
        """Test basic RAG search functionality."""
        # Setup mock query result
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (sample_chunk, sample_document, sample_source.name, sample_source.id, 0.85)
        ]
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import rag_search
            from sibyl.api.schemas import RAGSearchRequest

            request = RAGSearchRequest(
                query="authentication patterns",
                match_count=10,
            )

            response = await rag_search(request)

            assert response.query == "authentication patterns"
            assert response.return_mode == "chunks"
            assert len(response.results) == 1

    @pytest.mark.asyncio
    async def test_search_with_source_filter(
        self, mock_embed_text, mock_session, sample_chunk, sample_document, sample_source
    ):
        """Test RAG search with source ID filter."""
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import rag_search
            from sibyl.api.schemas import RAGSearchRequest

            request = RAGSearchRequest(
                query="test query",
                source_id=str(sample_source.id),
                match_count=5,
            )

            response = await rag_search(request)

            assert response.source_filter == str(sample_source.id)

    @pytest.mark.asyncio
    async def test_search_pages_mode(
        self, mock_embed_text, mock_session, sample_chunk, sample_document, sample_source
    ):
        """Test RAG search returning pages instead of chunks."""
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (sample_chunk, sample_document, sample_source.name, sample_source.id, 0.85)
        ]
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import rag_search
            from sibyl.api.schemas import RAGSearchRequest

            request = RAGSearchRequest(
                query="test query",
                return_mode="pages",
                match_count=10,
            )

            response = await rag_search(request)

            assert response.return_mode == "pages"

    @pytest.mark.asyncio
    async def test_search_similarity_threshold(
        self, mock_embed_text, mock_session
    ):
        """Test that similarity threshold filters low-score results."""
        mock_result = MagicMock()
        mock_result.all.return_value = []  # No results above threshold
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import rag_search
            from sibyl.api.schemas import RAGSearchRequest

            request = RAGSearchRequest(
                query="very specific query",
                similarity_threshold=0.9,  # High threshold
                match_count=10,
            )

            response = await rag_search(request)

            # Should have no results if nothing meets threshold
            assert response.total == 0


# =============================================================================
# Code Example Search Tests
# =============================================================================


class TestCodeExampleSearch:
    """Tests for POST /rag/code-examples endpoint."""

    @pytest.fixture
    def sample_code_chunk(self):
        """Create a sample code chunk."""
        chunk = MagicMock()
        chunk.id = uuid4()
        chunk.document_id = uuid4()
        chunk.chunk_index = 0
        chunk.chunk_type = MagicMock()
        chunk.chunk_type.value = "code"
        chunk.content = "```python\ndef authenticate(user):\n    pass\n```"
        chunk.context = "Document: Auth | Section: Functions"
        chunk.heading_path = ["Functions", "authenticate"]
        chunk.language = "python"
        chunk.embedding = [0.1] * 1536
        return chunk

    @pytest.mark.asyncio
    async def test_code_search(
        self, mock_embed_text, mock_session, sample_code_chunk, sample_document, sample_source
    ):
        """Test code example search."""
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (sample_code_chunk, sample_document, sample_source.name, 0.82)
        ]
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import search_code_examples
            from sibyl.api.schemas import CodeExampleRequest

            request = CodeExampleRequest(
                query="authentication function",
                match_count=5,
            )

            response = await search_code_examples(request)

            assert response.query == "authentication function"
            assert len(response.examples) == 1
            assert response.examples[0].language == "python"

    @pytest.mark.asyncio
    async def test_code_search_with_language_filter(
        self, mock_embed_text, mock_session, sample_code_chunk, sample_document, sample_source
    ):
        """Test code search with language filter."""
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (sample_code_chunk, sample_document, sample_source.name, 0.82)
        ]
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import search_code_examples
            from sibyl.api.schemas import CodeExampleRequest

            request = CodeExampleRequest(
                query="authentication",
                language="python",
                match_count=5,
            )

            response = await search_code_examples(request)

            assert response.language_filter == "python"


# =============================================================================
# Page Retrieval Tests
# =============================================================================


class TestPageRetrieval:
    """Tests for page listing and full page retrieval."""

    @pytest.mark.asyncio
    async def test_list_source_pages(
        self, mock_session, sample_document, sample_source
    ):
        """Test listing pages for a source."""
        # Mock source lookup
        mock_session.get = AsyncMock(return_value=sample_source)

        # Mock document query
        mock_docs_result = MagicMock()
        mock_docs_result.scalars.return_value.all.return_value = [sample_document]

        # Mock count query
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1

        mock_session.execute = AsyncMock(side_effect=[mock_count_result, mock_docs_result])

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import list_source_pages

            response = await list_source_pages(
                source_id=str(sample_source.id),
                limit=50,
            )

            assert response.source_id == str(sample_source.id)
            assert response.source_name == sample_source.name

    @pytest.mark.asyncio
    async def test_get_full_page(
        self, mock_session, sample_document, sample_source
    ):
        """Test getting full page content."""
        mock_session.get = AsyncMock(side_effect=[sample_document, sample_source])

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import get_full_page

            response = await get_full_page(document_id=str(sample_document.id))

            assert response.document_id == str(sample_document.id)
            assert response.title == sample_document.title
            assert response.content == sample_document.content
            assert response.has_code == sample_document.has_code

    @pytest.mark.asyncio
    async def test_get_page_not_found(self, mock_session):
        """Test 404 when page not found."""
        mock_session.get = AsyncMock(return_value=None)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import get_full_page
            from fastapi import HTTPException

            # Use a valid UUID format that doesn't exist
            with pytest.raises(HTTPException) as exc_info:
                await get_full_page(document_id="00000000-0000-0000-0000-000000000000")

            assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_page_invalid_uuid(self, mock_session):
        """Test 400 when document ID is not a valid UUID."""
        from sibyl.api.routes.rag import get_full_page
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            await get_full_page(document_id="not-a-valid-uuid")

        assert exc_info.value.status_code == 400
        assert "Invalid document ID format" in exc_info.value.detail


# =============================================================================
# Hybrid Search Tests
# =============================================================================


class TestHybridSearch:
    """Tests for hybrid (vector + full-text) search."""

    @pytest.mark.asyncio
    async def test_hybrid_search(
        self, mock_embed_text, mock_session, sample_chunk, sample_document, sample_source
    ):
        """Test hybrid search combining vector and full-text."""
        mock_result = MagicMock()
        mock_result.all.return_value = [
            (sample_chunk, sample_document, sample_source.name, sample_source.id, 0.85, 0.7)
        ]
        mock_session.execute = AsyncMock(return_value=mock_result)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import hybrid_search
            from sibyl.api.schemas import RAGSearchRequest

            request = RAGSearchRequest(
                query="authentication patterns best practices",
                match_count=10,
            )

            response = await hybrid_search(request)

            assert response.query == "authentication patterns best practices"
            # Hybrid search always returns chunks
            assert response.return_mode == "chunks"


# =============================================================================
# Error Handling Tests
# =============================================================================


class TestErrorHandling:
    """Tests for error handling in RAG endpoints."""

    @pytest.mark.asyncio
    async def test_embedding_error(self, mock_session):
        """Test handling of embedding generation errors."""
        async def failing_embed(text: str) -> list[float]:
            raise ValueError("Embedding service unavailable")

        with patch("sibyl.api.routes.rag.embed_text", failing_embed):
            from sibyl.api.routes.rag import rag_search
            from sibyl.api.schemas import RAGSearchRequest
            from fastapi import HTTPException

            request = RAGSearchRequest(query="test")

            with pytest.raises(HTTPException) as exc_info:
                await rag_search(request)

            assert exc_info.value.status_code == 500
            assert "Embedding error" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_source_not_found(self, mock_session):
        """Test 404 when source not found."""
        mock_session.get = AsyncMock(return_value=None)

        with patch("sibyl.api.routes.rag.get_session") as mock_get_session:
            mock_get_session.return_value = mock_session

            from sibyl.api.routes.rag import list_source_pages
            from fastapi import HTTPException

            # Use a valid UUID format that doesn't exist
            with pytest.raises(HTTPException) as exc_info:
                await list_source_pages(source_id="00000000-0000-0000-0000-000000000000")

            assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_source_invalid_uuid(self, mock_session):
        """Test 400 when source ID is not a valid UUID."""
        from sibyl.api.routes.rag import list_source_pages
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            await list_source_pages(source_id="invalid-source-id")

        assert exc_info.value.status_code == 400
        assert "Invalid source ID format" in exc_info.value.detail


# =============================================================================
# Schema Validation Tests
# =============================================================================


class TestSchemaValidation:
    """Tests for request/response schema validation."""

    def test_rag_search_request_validation(self):
        """Test RAGSearchRequest validation."""
        from sibyl.api.schemas import RAGSearchRequest
        from pydantic import ValidationError

        # Valid request
        req = RAGSearchRequest(query="test query")
        assert req.match_count == 10  # Default
        assert req.return_mode == "chunks"  # Default

        # Empty query should fail
        with pytest.raises(ValidationError):
            RAGSearchRequest(query="")

        # Invalid match_count
        with pytest.raises(ValidationError):
            RAGSearchRequest(query="test", match_count=0)

        # Invalid similarity threshold
        with pytest.raises(ValidationError):
            RAGSearchRequest(query="test", similarity_threshold=1.5)

    def test_code_example_request_validation(self):
        """Test CodeExampleRequest validation."""
        from sibyl.api.schemas import CodeExampleRequest
        from pydantic import ValidationError

        # Valid request
        req = CodeExampleRequest(query="auth function")
        assert req.match_count == 10
        assert req.language is None

        # Empty query should fail
        with pytest.raises(ValidationError):
            CodeExampleRequest(query="")

    def test_response_models(self):
        """Test response model structures."""
        from sibyl.api.schemas import (
            RAGChunkResult,
            RAGPageResult,
            CodeExampleResult,
        )

        # RAGChunkResult
        chunk_result = RAGChunkResult(
            chunk_id="chunk-1",
            document_id="doc-1",
            source_id="source-1",
            source_name="Test Source",
            url="https://example.com",
            title="Test Page",
            content="Test content",
            similarity=0.85,
            chunk_type="text",
            chunk_index=0,
        )
        assert chunk_result.chunk_id == "chunk-1"

        # RAGPageResult
        page_result = RAGPageResult(
            document_id="doc-1",
            source_id="source-1",
            source_name="Test Source",
            url="https://example.com",
            title="Test Page",
            content="Full content",
            word_count=100,
            has_code=False,
            best_chunk_similarity=0.9,
        )
        assert page_result.word_count == 100

        # CodeExampleResult
        code_result = CodeExampleResult(
            chunk_id="chunk-1",
            document_id="doc-1",
            source_name="Test Source",
            url="https://example.com",
            title="API Reference",
            code="def test(): pass",
            similarity=0.8,
        )
        assert code_result.code == "def test(): pass"
