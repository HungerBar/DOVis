from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
import traceback

from services.boundary_service import calculate_boundary

router = APIRouter()

@router.get("/boundary")
def get_boundary(
    time_index: int = Query(0, description="时间索引，例如 0"),
    threshold: float = Query(20.0, description="缺氧阈值，例如 20.0")
):
    
    try:
        boundary = calculate_boundary(time_index, threshold)
        return {
            "status": "success",
            "tileset_url": boundary["tileset_url"],
            "b3dm_url": boundary["b3dm_url"],
            "cache_key": boundary["cache_key"],
            "cached": boundary["cached"],
            "volume_km3": boundary["volume"]
        }
    except Exception as e:
        traceback.print_exc()  # 这会在终端输出完整的错误堆栈
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e)},  # 简短错误信息返回给前端
        )

