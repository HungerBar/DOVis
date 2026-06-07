# DOVis

DOVis is a dissolved oxygen visualization platform for the WebGIS course
project. It combines FastAPI, Vite, React, and Cesium to support ocean oxygen
field visualization, 3D isosurface rendering, and hypoxic boundary analysis.

Start project-level commands from this directory:

```powershell
cd DOVis
```

## Backend

The backend port is standardized as `5001`.

Install backend dependencies first:

```powershell
python -m pip install -r backend\requirements.txt
```

```powershell
uvicorn backend.main:app --port 5001 --reload
```

The backend also supports module startup:

```powershell
python -m backend.main
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite runs on `http://127.0.0.1:5173` and proxies `/api` and `/tiles` to
`http://127.0.0.1:5001`.

From `DOVis`, you can also run:

```powershell
npm run backend
npm run frontend
```

## API Routes

- `GET /`
- `GET /docs`
- `GET /api/times`
- `GET /api/volume`
- `GET /api/export_iso_surface_field`
- `GET /api/export_tileset`
- `GET /api/hypoxia/boundary`

## Development Notes

- Always start the backend from `DOVis`.
- Keep backend imports in the `backend.*` package style.
- Keep the backend API port at `5001` unless `vite.config.js` is updated at the
  same time.
- The frontend cinematic image asset is stored in
  `frontend/src/assets/cinematic-ocean-oxygen.png`.
