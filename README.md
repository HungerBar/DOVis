# WebGIS

2026 Spring WebGIS project repository.

## DOVis

DOVis, short for Dissolved Oxygen Visualization, is the main WebGIS application
in this repository. It includes a FastAPI backend and a Vite + React + Cesium
frontend for ocean dissolved oxygen visualization, isosurface rendering, and
hypoxic boundary analysis.

Main project directory:

```text
DOVis/
```

## Port Convention

The backend API port is standardized as:

```text
5001
```

Vite does not occupy the backend port. During frontend development, Vite runs on
`5173` and proxies backend requests to `5001`.

## Start Backend

Run commands from the `DOVis` directory:

```powershell
cd DOVis
uvicorn backend.main:app --port 5001 --reload
```

The backend also supports module startup:

```powershell
cd DOVis
python -m backend.main
```

## Start Frontend

```powershell
cd DOVis\frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The frontend proxy is configured in:

```text
DOVis/frontend/vite.config.js
```

It forwards `/api` and `/tiles` to:

```text
http://127.0.0.1:5001
```

## Useful Scripts

From `DOVis`:

```powershell
npm run backend
npm run frontend
```

## Notes

- Start the backend from `DOVis`, not from `DOVis/backend`.
- Keep backend imports in the `backend.*` package style.
- Keep the backend API port aligned with the Vite proxy target.
- Install backend dependencies from `DOVis/backend/requirements.txt` before
  running the API server.
