from fastapi import APIRouter, Query
from backend.app.schemas.profile import (
    HealthResponse,
    SectionRequest,
    SectionResponse,
    VerticalProfileResponse,
)
from backend.app.services.profile_service import get_section_profile, get_vertical_profile

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(status="ok", message="DOVis backend is running")


@router.get("/profile/vertical", response_model=VerticalProfileResponse, tags=["Profile"])
async def vertical_profile(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    time: str = Query(default="2024-01", description="Time string (e.g., 2024-01)"),
):
    return get_vertical_profile(lat, lon, time)


@router.post("/profile/section", response_model=SectionResponse, tags=["Profile"])
async def section_profile(body: SectionRequest):
    points = [{"lat": p.lat, "lon": p.lon} for p in body.points]
    return get_section_profile(points, body.time)
