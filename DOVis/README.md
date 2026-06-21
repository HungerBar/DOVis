# DOVis

Dissolved-oxygen visualization platform — FastAPI backend + React/Vite (Cesium) frontend.

## Requirements

- Node.js + [pnpm](https://pnpm.io/)
- Python 3.11+ (with `pip`)

## Quick start

```bash
pnpm run dev
```

That single command will, on first run:

1. **Auto-install frontend deps** if `frontend/node_modules` is missing.
2. **Auto-install backend deps** (`requirements.txt`) if the core Python packages
   (`fastapi`, `uvicorn`, `pyproj`) are not importable in the active environment.
3. Start the backend (`uvicorn` on `127.0.0.1:5001`) and the frontend (Vite) in parallel.

No manual `pip install -r requirements.txt` or `pnpm --dir frontend install` is needed.

> **Tip:** activate your Python virtual environment (`venv`/`conda`) before running
> `pnpm run dev` so backend deps install into the right place.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm run dev` | Ensure deps are installed, then run backend + frontend in parallel. |
| `pnpm run dev:backend` | Run only the backend (uvicorn). |
| `pnpm run dev:backend:reload` | Backend with auto-reload on `backend/` changes. |
| `pnpm run dev:frontend` | Run only the frontend (Vite). |
| `pnpm run setup` | Install both frontend and backend deps explicitly. |
| `pnpm run install:frontend` | Install frontend deps only. |
| `pnpm run install:backend` | Install backend deps only (`pip install -r requirements.txt`). |
| `pnpm run build` | Build the frontend for production. |
| `pnpm run lint` | Lint the frontend. |

## How the auto-install works

`dev` chains two idempotent guards before starting the servers:

- `ensure:frontend` — installs frontend deps only when `frontend/node_modules` is absent.
- `ensure:backend` — installs backend deps only when the core imports fail.

Both are no-ops once dependencies are in place, so repeated `pnpm run dev` runs stay fast.
