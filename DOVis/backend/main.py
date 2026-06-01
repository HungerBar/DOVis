from fastapi import FastAPI

from api.routers.hypoxia import router as hypoxia_router

app = FastAPI(
    title="DOVis API",
    version="0.1.0"
)

app.include_router(
    hypoxia_router,
    prefix="/api/hypoxia",
    tags=["Hypoxia"]
)

@app.get("/")
def root():
    return {"message": "DOVis Backend Running"}
