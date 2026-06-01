from fastapi import FastAPI
import os
app = FastAPI(
    title="DOVis API",
    description="Dissolved Oxygen Visualization System",
    version="0.1"
)

app.include_router(
    hypoxia_router,
    prefix="/hypoxia",
    tags=["Hypoxia"]
)

@app.get("/")
def root():
    return {
        "message": "Backend Running"
    }
