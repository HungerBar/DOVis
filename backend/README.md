# DOVis Backend

Dissolved Oxygen Visualization — FastAPI backend for multi-dimensional DO data.

## Quick Start

### 1. Create virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The server starts at **http://127.0.0.1:8000**.

## API Documentation

Interactive Swagger docs (auto-generated):

```
http://127.0.0.1:8000/docs
```

ReDoc alternative:

```
http://127.0.0.1:8000/redoc
```

## Endpoints

### Health Check

```
GET /api/health
```

Example: `http://127.0.0.1:8000/api/health`

Response:
```json
{ "status": "ok", "message": "DOVis backend is running" }
```

### Vertical Profile

```
GET /api/profile/vertical?lat=<lat>&lon=<lon>&time=<time>
```

Example:
```
http://127.0.0.1:8000/api/profile/vertical?lat=10&lon=80&time=2024-01
```

Returns DO concentration vs depth at the given location:
```json
{
  "location": { "lat": 10.0, "lon": 80.0 },
  "time": "2024-01",
  "unit": "mmol/m3",
  "profile": [
    { "depth": 0, "oxygen": 215.2 },
    { "depth": 50, "oxygen": 206.3 },
    { "depth": 100, "oxygen": 190.4 }
  ]
}
```

Standard depths: 0, 10, 25, 50, 75, 100, 150, 200, 300, 500, 1000, 2000, 4000, 6000 m.

### Section Profile

```
POST /api/profile/section
```

Request body:
```json
{
  "points": [
    { "lat": 10.0, "lon": 80.0 },
    { "lat": 10.5, "lon": 81.0 },
    { "lat": 11.0, "lon": 82.0 }
  ],
  "time": "2024-01"
}
```

Returns DO profiles interpolated along the transect for depth-distance heatmaps.

### Test with curl

```bash
curl "http://127.0.0.1:8000/api/health"
curl "http://127.0.0.1:8000/api/profile/vertical?lat=10&lon=80&time=2024-01"
curl -X POST "http://127.0.0.1:8000/api/profile/section" \
  -H "Content-Type: application/json" \
  -d '{"points":[{"lat":10,"lon":80},{"lat":11,"lon":82}],"time":"2024-01"}'
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── api/
│   │   └── profile.py       # Route handlers
│   ├── core/
│   │   └── config.py        # Settings (env-prefixed)
│   ├── schemas/
│   │   └── profile.py       # Pydantic request/response models
│   ├── services/
│   │   └── profile_service.py  # Business logic & DO profile generation
│   └── data/
│       └── sample_do_profile.csv  # Example DO-depth data
├── requirements.txt
└── README.md
```

## Data Model

The service layer is designed so that the mock generator can be swapped for real NetCDF data:

- `profile_service.py` handles all data access via `get_vertical_profile()` and `get_section_profile()`
- When real Copernicus Marine `.nc` files are available, replace the mock logic with `xarray` reads
- The API contract (schemas, response format) stays unchanged

## CORS

The backend allows cross-origin requests from:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Configure additional origins via the `DOVIS_CORS_ORIGINS` environment variable or in `app/core/config.py`.
