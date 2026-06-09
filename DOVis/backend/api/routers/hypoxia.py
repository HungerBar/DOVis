from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
import traceback

from backend.services.boundary_service import calculate_boundary
from backend.services.boundary_service import calculate_2Dboundary

router = APIRouter()


@router.get("/boundary")
def get_boundary(
    time_index: int = Query(0, description="时间索引，例如 0"),
    threshold: float = Query(20.0, description="缺氧阈值，例如 20.0"),
):

    try:
        result = calculate_boundary(time_index, threshold)

        #  旧版 3D Tiles（兼容）
        response = {
            "status": "success",
            "cached": result.get("cached", False),
            "volume_km3": result.get("volume"),
            "tileset_url": result.get("tileset_url"),
            "b3dm_url": result.get("b3dm_url"),
        }
        return response
    except Exception as e:
        traceback.print_exc()  # 这会在终端输出完整的错误堆栈
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e)},  # 简短错误信息返回给前端
        )


@router.get("/boundary2D")
def get_2Dboundary(
    time_index: int = Query(0, description="时间索引，例如 0"),
    threshold: float = Query(20.0, description="缺氧阈值，例如 20.0"),
    depth_index: int = Query(0, description="深度索引"),
):

    try:
        result = calculate_2Dboundary(time_index, threshold, depth_index)

        response = {
            "status": "success",
            "cached": result.get("cached", False),
            "boundary_url": result.get("boundary_url"),
        }

        return response
    except Exception as e:
        traceback.print_exc()  # 这会在终端输出完整的错误堆栈
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e)},  # 简短错误信息返回给前端
        )
