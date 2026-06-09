from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.routers import (
    times,
    profile,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TILES_DIR = os.path.join(BASE_DIR, "..", "tiles")
TILES_DIR = os.path.normpath(TILES_DIR)

import mimetypes

mimetypes.add_type("application/octet-stream", ".b3dm")

os.makedirs(TILES_DIR, exist_ok=True)

app = FastAPI(title="DOVis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(times.router, prefix="/api", tags=["times"])
app.include_router(profile.router, prefix="/api", tags=["profile"])

app.mount("/tiles", StaticFiles(directory=TILES_DIR, check_dir=True), name="tiles")


@app.get("/")
def root():
    return {
        "message": "DOVis FastAPI Server Running",
        "tiles_directory": TILES_DIR,
        "tiles_url_example": "/tiles/{cache_key}/tileset.json",
    }
