import mimetypes
import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.routers import hypoxia, isoExport, times, volume


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TILES_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "tiles"))
BACKEND_PORT = 5001

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


@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.include_router(hypoxia.router, prefix="/api/hypoxia", tags=["Hypoxia"])
app.include_router(times.router, prefix="/api", tags=["times"])
app.include_router(volume.router, prefix="/api", tags=["volume"])
app.include_router(isoExport.router, prefix="/api", tags=["isoExport"])

app.mount("/tiles", StaticFiles(directory=TILES_DIR, check_dir=True), name="tiles")


@app.get("/")
def root():
    return {
        "message": "DOVis FastAPI Server Running",
        "port": BACKEND_PORT,
        "docs": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=BACKEND_PORT,
        reload=True,
    )
