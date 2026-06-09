from fastapi import APIRouter, Query
from backend.schemas.profile import (
    SectionRequest,
    SectionResponse,
    VerticalProfileResponse,
)
from backend.services.profile_service import (
    get_section_profile,
    get_vertical_profile,
)

router = APIRouter()


@router.get("/profile/vertical", response_model=VerticalProfileResponse, tags=["Profile"])
def vertical_profile(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    time_index: int = Query(0),
):
    return get_vertical_profile(lat, lon, time_index)


@router.post("/profile/section", response_model=SectionResponse, tags=["Profile"])
def section_profile(body: SectionRequest):
    points = [{"lat": p.lat, "lon": p.lon} for p in body.points]
    return get_section_profile(points, body.time_index)
