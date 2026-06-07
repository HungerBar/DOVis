import traceback

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from backend.services.boundary_service import calculate_boundary


router = APIRouter()


@router.get("/boundary")
def get_boundary(
    time_index: int = Query(0, description="Time index, for example 0"),
    threshold: float = Query(20.0, description="Hypoxia threshold, for example 20.0"),
):
    try:
        boundary = calculate_boundary(time_index, threshold)
        return {
            "status": "success",
            "tileset_url": boundary["tileset_url"],
            "b3dm_url": boundary["b3dm_url"],
            "cache_key": boundary["cache_key"],
            "cached": boundary["cached"],
            "volume_km3": boundary["volume"],
        }
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(exc)},
        )
