# sibyl-core

Core library for Sibyl - domain models, graph operations, and knowledge retrieval.

## Overview

This package provides the shared components used by both the Sibyl CLI and Server:

- **models/** - Domain entities (Entity, Task, Project, Epic, etc.)
- **graph/** - FalkorDB/Graphiti client and entity management
- **retrieval/** - Hybrid search (semantic + BM25), fusion, deduplication
- **tools/** - Core MCP tool implementations (search, explore, add, manage)
- **tasks/** - Workflow engine, dependency resolution, estimation
- **auth/** - JWT tokens, password hashing, auth context primitives
- **utils/** - Resilience patterns, retry logic

## Installation

```bash
# As a dependency in another package
uv add sibyl-core

# For development (editable install)
uv pip install -e packages/python/sibyl-core
```

## Usage

```python
from sibyl_core import CoreConfig, core_config
from sibyl_core.models import Entity, Task, Project
from sibyl_core.graph import GraphClient, EntityManager
from sibyl_core.tools import search, explore, add
```

## Configuration

The library uses environment variables with `SIBYL_` prefix:

- `SIBYL_FALKORDB_*` - FalkorDB connection settings
- `SIBYL_OPENAI_API_KEY` - For embeddings
- `SIBYL_ANTHROPIC_API_KEY` - For LLM operations

See `sibyl_core/config.py` for full configuration options.
