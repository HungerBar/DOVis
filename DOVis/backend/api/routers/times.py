from fastapi import APIRouter
from backend.core.times import get_times

router = APIRouter()


@router.get("/times")
def api_times():
    return get_times()
