# Deployment Overview

Sibyl can be deployed in multiple configurations, from local development to production Kubernetes
clusters.

## Architecture

Sibyl consists of four main components:

| Component    | Purpose                             | Port   |
| ------------ | ----------------------------------- | ------ |
| **Backend**  | FastAPI + MCP server (sibyld serve) | 3334   |
| **Worker**   | arq job queue processor             | -      |
| **Frontend** | Next.js 16 web UI                   | 3337   |
| **FalkorDB** | Graph database (Redis + FalkorDB)   | 6379\* |
| **Postgres** | Relational data (users, crawl docs) | 5432\* |

\*Default internal ports. External mappings vary by deployment mode.

```
                                   +------------------+
                                   |    Frontend      |
                                   |   (Next.js 16)   |
                                   |     :3337        |
                                   +--------+---------+
                                            |
+------------------+               +--------+---------+
|    MCP Client    |               |      Kong /      |
| (Claude, etc.)   +-------------->+     Ingress      |
+------------------+     /mcp      +--------+---------+
                                            |
                         /api/*    +--------+---------+
                         +-------->+     Backend      |
                                   | (FastAPI + MCP)  |
                                   |     :3334        |
                                   +----+-------+-----+
                                        |       |
                          +-------------+       +-------------+
                          |                                   |
              +-----------+----------+          +-------------+---------+
              |     PostgreSQL       |          |       FalkorDB        |
              |   (users, docs)      |          |    (knowledge graph)  |
              |       :5432          |          |         :6379         |
              +----------------------+          +-----------------------+
                          ^
                          |
              +-----------+----------+
              |       Worker         |
              |   (arq processor)    |
              +----------------------+
```

## Deployment Modes

### 1. Local Development (Docker Compose)

**Best for:** Quick local development and testing.

- Single command startup
- Hot reload for backend/frontend
- Databases run in Docker containers
- [Docker Compose Guide](docker-compose.md)

### 2. Local Kubernetes (Tilt + Minikube)

**Best for:** Testing Kubernetes manifests locally, developing with full K8s stack.

- Full Kubernetes environment locally
- Kong Gateway for routing
- CNPG for managed PostgreSQL
- Automatic image builds on code changes
- [Tilt/Minikube Guide](tilt-minikube.md)

### 3. Production Kubernetes

**Best for:** Production deployments with HA and scaling.

- Helm chart for declarative deployment
- HPA for autoscaling
- PodDisruptionBudgets for availability
- External or in-cluster databases
- [Kubernetes Guide](kubernetes.md)
- [Helm Chart Reference](helm-chart.md)

## Quick Comparison

| Feature               | Docker Compose | Tilt/Minikube | Production K8s |
| --------------------- | -------------- | ------------- | -------------- |
| Setup time            | 1 minute       | 5-10 minutes  | Varies         |
| Hot reload            | Yes            | Yes           | No             |
| Kong Gateway          | No             | Yes           | Yes            |
| TLS                   | No             | Yes (Caddy)   | Yes            |
| Autoscaling           | No             | No            | Yes (HPA)      |
| Multi-replica         | No             | Yes           | Yes            |
| Resource requirements | Low            | Medium        | High           |
| Production-like       | No             | Mostly        | Yes            |

## Port Mappings by Environment

### Docker Compose (Local Dev)

| Service  | Host Port | Container Port | Notes                  |
| -------- | --------- | -------------- | ---------------------- |
| Backend  | 3334      | 3334           | API + MCP              |
| Frontend | 3337      | 3337           | Next.js UI             |
| FalkorDB | 6380      | 6379           | Avoids Redis conflicts |
| FalkorDB | 3335      | 3000           | Browser UI             |
| Postgres | 5433      | 5432           | Avoids local Postgres  |

### Tilt/Minikube

All services accessed via `https://sibyl.local`:

| Path    | Service  | Notes        |
| ------- | -------- | ------------ |
| /api/\* | Backend  | REST API     |
| /mcp    | Backend  | MCP protocol |
| /       | Frontend | Next.js UI   |

## Next Steps

- [Environment Variables](environment.md) - Full configuration reference
- [Monitoring](monitoring.md) - Health checks and observability
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
