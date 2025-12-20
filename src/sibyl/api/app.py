"""FastAPI application factory.

Creates the REST API app that gets mounted alongside MCP.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.routing import WebSocketRoute

from sibyl.api.routes import admin_router, entities_router, graph_router, search_router
from sibyl.api.websocket import websocket_handler
from sibyl.config import settings


def create_api_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI app with all routes and middleware.
    """
    app = FastAPI(
        title="Sibyl API",
        description="REST API for Sibyl Knowledge Graph",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS for frontend (localhost:3337)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3337",
            "http://127.0.0.1:3337",
            f"http://localhost:{settings.server_port}",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(entities_router)
    app.include_router(search_router)
    app.include_router(graph_router)
    app.include_router(admin_router)

    # WebSocket route for realtime updates
    app.routes.append(
        WebSocketRoute("/ws", websocket_handler, name="websocket")
    )

    @app.get("/")
    async def root() -> dict[str, str]:
        """API root - basic info."""
        return {
            "name": "Sibyl API",
            "version": "0.1.0",
            "docs": "/api/docs",
            "websocket": "/api/ws",
        }

    return app
