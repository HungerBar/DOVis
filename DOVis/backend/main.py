from fastapi import FastAPI
import os
import sys
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.routers import (
    times,
    volume,
    isoExport,
)
from backend.core.clearTileCache import clear_tiles_cache

# Ensure backend directory is in Python path
BACKEND_DIR = Path(__file__).parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from api.routers.hypoxia import router as hypoxia_router


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TILES_DIR = os.path.join(BASE_DIR, "..", "tiles")
TILES_DIR = os.path.normpath(TILES_DIR)

import mimetypes
mimetypes.add_type("application/octet-stream", ".b3dm")

os.makedirs(TILES_DIR, exist_ok=True)

app = FastAPI(
    title="DOVis API",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# 注册API路由
app.include_router( 
    hypoxia_router,
    prefix="/api/hypoxia",
    tags=["Hypoxia"]
)


# =========================================================
# API routers
# =========================================================
app.include_router(times.router, prefix="/api", tags=["times"])
app.include_router(volume.router, prefix="/api", tags=["volume"])
app.include_router(isoExport.router, prefix="/api", tags=["isoExport"])

# =========================================================
# STATIC TILE SERVER（核心）
# =========================================================
app.mount("/tiles", StaticFiles(directory=TILES_DIR, check_dir=True), name="tiles")


@app.get("/")
def root():
    return {"message": "DOVis FastAPI Server Running"}

