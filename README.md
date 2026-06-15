# DOVis

DOVis is an interactive web visualization system for exploring dissolved oxygen
(DO) variation in the Indian Ocean. It combines a FastAPI scientific-data
backend with a Vite, React, and Cesium frontend to support 3D ocean-volume
visualization, vertical-profile inspection, isosurface rendering, EOF analysis,
and hypoxia-region exploration.

The application is designed around a four-dimensional dissolved oxygen dataset:
longitude, latitude, depth, and time. The backend builds a local SQLite database
from the NetCDF source data, reads API data from SQLite, prepares generated 3D
tiles, and serves them to the frontend for interactive geospatial visualization.

## Features

- 3D dissolved oxygen visualization on a Cesium globe.
- Dissolved oxygen isosurface generation and export through backend services.
- Vertical profile queries for inspecting oxygen changes with depth.
- EOF analysis tools for studying dominant spatial-temporal patterns.
- Hypoxia visualization for low-oxygen regions.
- FastAPI endpoints for time, volume, profile, isosurface, EOF, and hypoxia data.
- Local development workflow that starts both backend and frontend with one
  package script.

## Data Source

This project uses dissolved oxygen data from the following study:

**Paper:** [Reconstruction of dissolved oxygen in the Indian Ocean from 1980 to
2019 based on machine learning techniques](https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2023.1291232/full)

**Authors:** Sheng Huang, Jian Shao, Yijun Chen, Jin Qi, Sensen Wu, Feng Zhang,
Xianqiang He, Zhenhong Du

**Journal:** *Frontiers in Marine Science*, Volume 10, 2023

**DOI:** [10.3389/fmars.2023.1291232](https://doi.org/10.3389/fmars.2023.1291232)

The study reconstructs Indian Ocean dissolved oxygen from 1980 to 2019 using
machine learning methods including Extremely Randomized Trees (ERT) and Random
Forest (RF). It combines ocean reanalysis variables such as temperature,
salinity, density, currents, and spatial-temporal features to produce a
four-dimensional dissolved oxygen reconstruction. The reported validation
performance reached an R² of 0.969 and an RMSE of 12.8 μmol kg⁻¹.

The paper also reports an Indian Ocean oxygen loss of approximately
−141.5 ± 15.1 Tmol per decade, with expanding hypoxic regions in the Arabian
Sea, Bay of Bengal, and equatorial Indian Ocean.

## Data File Location

Place the NetCDF dataset at:

```text
DOVis/data/do_predict.nc
```

The backend uses this NetCDF file as the source for a generated SQLite database:

```text
DOVis/data/do_predict.sqlite
```

The database path and source dataset path are defined in:

```text
DOVis/backend/core/database.py
```

By default, the backend expects the source filename to remain `do_predict.nc`.
If you replace the dataset, either keep the same filename and location, or
update the paths in `DOVis/backend/core/database.py`. Generated SQLite files are
local runtime artifacts and should not be committed.

Expected layout:

```text
WebGIS/
├── README.md
└── DOVis/
    ├── data/
    │   ├── do_predict.nc
    │   └── do_predict.sqlite  # generated locally
    ├── backend/
    ├── frontend/
    ├── package.json
    └── requirements.txt
```

## Tech Stack

- Backend: FastAPI, Uvicorn, xarray, NumPy, SciPy, pandas, NetCDF4, scikit-image,
  trimesh, PyVista, VTK
- Frontend: Vite, React, Cesium
- Package scripts: pnpm

## First-Time Setup

Run setup from the DOVis package directory:

```bash
cd DOVis
```

Creating a Python virtual environment is optional, but recommended:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install frontend and backend dependencies:

```bash
pnpm run setup
```

This runs:

```bash
pnpm --dir frontend install
python -m pip install -r requirements.txt
```

## Run the Application

You can either prebuild the database before starting the app, or start the app
directly and let the backend build it on first use.

Recommended for first use, because it shows database import progress:

```bash
cd DOVis
python -m backend.core.build_database
pnpm dev
```

Direct startup:

```bash
cd DOVis
pnpm dev
```

If `DOVis/data/do_predict.sqlite` does not exist or is older than
`DOVis/data/do_predict.nc`, the backend will rebuild it automatically when data
is first requested. The first build can take a while because the NetCDF source
file is large.

`pnpm dev` starts the backend and frontend in parallel:

- Backend API: `http://localhost:5001`
- Frontend app: `http://localhost:5173`

Open the frontend URL in a browser to use DOVis.

## Run Services Separately

Backend only:

```bash
cd DOVis
pnpm run dev:backend
```

Backend with hot reload:

```bash
cd DOVis
pnpm run dev:backend:reload
```

Frontend only:

```bash
cd DOVis
pnpm run dev:frontend
```

## Build and Lint

Build the frontend:

```bash
cd DOVis
pnpm run build
```

Run frontend linting:

```bash
cd DOVis
pnpm run lint
```

## Troubleshooting

If the backend cannot find the dataset, confirm that the file exists at:

```text
DOVis/data/do_predict.nc
```

If you want to build or rebuild the SQLite database manually, run:

```bash
cd DOVis
python -m backend.core.build_database
```

If scientific Python imports fail, recreate or update the Python environment and
reinstall backend dependencies:

```bash
cd DOVis
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

If the frontend cannot connect to the API, confirm that the backend is running on
`http://localhost:5001` and that the frontend is running on
`http://localhost:5173`.
