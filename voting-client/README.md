# Voting Client (React + TypeScript + Vite)

This repository contains the Voting Client — a small React application built with Vite and TypeScript used in the "Voting app" demo. The client lets users submit votes and view live results by talking to the `voting-service` backend and `voting-result` components.

**What this folder contains**
- `src/` — React source (components, assets, configuration).
- `public/` — static assets and `env.template.js` used to inject runtime env values.
- `Dockerfile` — image build instructions for containerizing the client.
- `entrypoint.sh` — optional container entrypoint used by the Docker image.

**Quick Start (local development)**

1. Install dependencies:

```bash
npm install
```

2. Run the dev server (Vite):

```bash
npm run dev
```

The dev server typically runs on port 5173. Open the URL printed by Vite (usually http://localhost:5173) to use the app.

**Build & Preview**

```bash
npm run build
npm run preview
```

`build` produces an optimized `dist/` folder suitable for static hosting.

**Docker**

Build the Docker image:

```bash
docker build -t voting-client:local .
```

Run the container (example):

```bash
docker run -p 8080:80 voting-client:local
```

Adjust the port mapping as needed. The project also includes a `docker-compose`/k8s setup in the workspace root for full-stack demos.

**Environment & Configuration**

- Runtime config template: `public/env.template.js` — copy or transform this into `public/env.js` at deploy time to point the client at the backend URL.
- Compile-time config: `src/config/env.ts` — used inside the app to read environment values.

For local development the client expects the API server at a base URL set in the env (see `public/env.template.js`). When running the full demo via Docker Compose or Kubernetes, the services are wired together so the client can reach `voting-service` by service name.

**Kubernetes**

This project includes k8s manifests under the top-level `k8s/` folder. The `voting-client` deployment/service there demonstrate how the built image is deployed and served in-cluster.

**Troubleshooting**

- If the UI can't reach the API, confirm `public/env.js` (or the injected env values) point at the correct `voting-service` address.
- If assets fail after building, run `npm run build` locally and inspect the `dist/` folder for expected output.

If you want, I can also add a short example showing how to generate `public/env.js` at container startup or update the k8s `ConfigMap` to provide the runtime env values.
