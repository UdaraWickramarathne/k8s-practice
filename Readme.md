
# k8s-practice

A small demo voting application (multi-service) with Docker and Kubernetes manifests.

This repository contains three main application components and Redis used as a backing store:

- `voting-client` – frontend (Vite) that lets users cast votes
- `voting-result` – frontend showing aggregated voting results
- `voting-service` – backend (.NET) that accepts votes and returns aggregated counts
- `redis-db` / `k8s/redis` – Redis configuration for local and k8s environments

Project provides both Docker Compose for local convenience and Kubernetes manifests for deploying to a cluster.

**Repository Layout**

- [k8s](k8s/) — Kubernetes manifests (ingress, services, deployments, redis)
- [voting-client](voting-client/) — client app source + Dockerfile
- [voting-result](voting-result/) — result UI + Dockerfile
- [voting-service](voting-service/) — .NET backend + Dockerfile
- [redis-db](redis-db/) — docker-compose for Redis standalone
- `docker-compose.yml` — convenience compose at repo root (if present)

**Prerequisites**

- Docker & Docker Compose
- kubectl + access to a Kubernetes cluster (for k8s deploys)
- Node.js (for local frontend dev)
- .NET SDK 9.0+ (for local `voting-service` development)

Quick Start — Docker Compose (local)

1. Build images (optional):

```bash
docker build -t voting-client:local ./voting-client
docker build -t voting-result:local ./voting-result
docker build -t voting-service:local ./voting-service
```

2. Start all services with compose (if `docker-compose.yml` configured):

```bash
docker-compose up --build -d
```

3. If you only need Redis for local testing:

```bash
docker compose -f redis-db/docker-compose.yaml up -d
```

Quick Start — Kubernetes

1. Apply manifests in the `k8s/` folder:

```bash
kubectl apply -f k8s/
```

2. Verify pods and services:

```bash
kubectl get pods,svc -n default
```

3. If an Ingress is included, make sure your cluster Ingress controller is available and DNS / hosts are configured.

Development

- Frontends (run locally):

```bash
cd voting-client
npm install
npm run dev

cd ../voting-result
npm install
npm run dev
```

- Backend (run locally):

```bash
cd voting-service
dotnet run
```

Configuration

- Frontend environment template: `voting-client/public/env.template.js` — copy/rename to `env.js` or configure the build to point to backend/service endpoints.
- Kubernetes configmaps and service manifests live in the `k8s/` subfolders for each service.

Testing & Usage

- The backend exposes a small HTTP API (see `voting-service/Controllers/VotingController.cs`). You can `curl` the endpoints to submit or fetch votes.

Troubleshooting

- If frontends cannot reach the backend, verify the env file or the Kubernetes Service names and ports.
- Ensure Redis is reachable from the backend (check service name in k8s or container network in compose).

Notes

- This repo is meant as a learning/demo setup for Docker and Kubernetes. Adjust images, tags and ingress rules before deploying to production.

---
If you'd like, I can also:

- add a small architecture diagram or ASCII diagram
- create a minimal `Makefile` or `scripts/` folder to automate builds and deploys
- add CI workflows to build and push images

File: [Readme.md](Readme.md)
