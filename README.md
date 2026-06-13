# WebGIS

2026 Spring WebGIS project repository

## DOVis

DOVis contains a FastAPI backend and a Vite/React frontend. From the repository
root, use the DOVis package scripts to install and run both services.

First-time setup:

```bash
cd DOVis
pnpm run setup
```

Daily development:

```bash
cd DOVis
pnpm dev
```

`pnpm dev` uses pnpm's native parallel script runner to start:

- Backend API: `http://localhost:5001`
- Frontend app: `http://localhost:5173`

You can also run each side separately:

```bash
pnpm run dev:backend
pnpm run dev:frontend
```

For backend hot reload during API development:

```bash
pnpm run dev:backend:reload
```

If the backend fails on scientific Python imports, recreate or update the Python
environment, then reinstall backend dependencies:

```bash
python -m pip install -r requirements.txt
```
