# WebGIS


## DOVis

DOVis contains a FastAPI backend and a Vite/React frontend. From the repository
root, use the DOVis package scripts to install and run both services.

Data files:

```text
DOVis/data/do_predict.nc
```

The backend currently reads the default NetCDF dataset from
`DOVis/data/do_predict.nc`. If you replace the dataset, keep the filename
`do_predict.nc`, or update the dataset path in `DOVis/backend/core/dataset.py`.

First-time setup:

```bash
cd DOVis

# Optional but recommended: create an isolated Python environment first.
python -m venv .venv
source .venv/bin/activate

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
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```
