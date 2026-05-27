from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.routers import (
    times,
    volume,
    isoExport,
)
from backend.core.clearTileCache import clear_tiles_cache

# =========================================================
# FIX 1: 绝对路径（避免 uvicorn cwd 不一致导致 tiles 找不到）
# =========================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TILES_DIR = os.path.join(BASE_DIR, "..", "tiles")
TILES_DIR = os.path.normpath(TILES_DIR)

import mimetypes

mimetypes.add_type("application/octet-stream", ".b3dm")

os.makedirs(TILES_DIR, exist_ok=True)

# =========================================================
# App init
# =========================================================
app = FastAPI(title="DOVis API", version="1.0.0")


@app.on_event("startup")
def startup_event():
    print("[startup] clearing tile cache...")
    clear_tiles_cache()


# =========================================================
# CORS
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# =========================================================
# Root
# =========================================================
@app.get("/")
def root():
    return {
        "message": "DOVis FastAPI Server Running",
        "tiles_directory": TILES_DIR,
        "tiles_url_example": "/tiles/{cache_key}/tileset.json",
    }


# =========================================================
# uvicorn 启动方式（避免 import string 错误路径）
# =========================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,  
        host="0.0.0.0",
        port=5001,
        reload=True,
    )
