import numpy as np
from fastapi import APIRouter, Query, Response
from backend.core.volume import get_volume

router = APIRouter()


@router.get("/volume")
def api_volume(time_index: int = Query(0)):
    arr = get_volume(time_index).astype(np.float32)

    return Response(
        content=arr.tobytes(),
        media_type="application/octet-stream",
        headers={"X-Shape": ",".join(map(str, arr.shape)), "X-Dtype": "float32"},
    )
