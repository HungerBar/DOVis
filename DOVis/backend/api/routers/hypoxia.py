from fastapi import APIRouter

from services.volume_service import calculate_volume
from services.boundary_service import calculate_boundary

router = APIRouter()


@router.get("/volume")
def get_volume(time: str):

    volume = calculate_volume(time)

    return {
        "time": time,
        "volume_km3": volume
    }


@router.get("/boundary")
def get_boundary(time: str):

    boundary = calculate_boundary(time)

    return {
        "time": time,
        "boundary": boundary
    }
