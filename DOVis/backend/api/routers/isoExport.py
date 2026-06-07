from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
import traceback
from backend.services.isoExport_service import export_iso_surface_field
from backend.services.tileset_service import (
    build_tileset_service
)

router = APIRouter()


# =========================================================
# export iso-surface depth field
# =========================================================
@router.get("/export_iso_surface_field")
def api_export_iso_surface_field(
    time_index: int = Query(0),
    iso_value: float = Query(0.5),
):

    path = export_iso_surface_field(time_index, iso_value)

    return FileResponse(
        path,
        media_type="application/x-netcdf",
        filename=(f"iso_depth_" f"t{time_index}_" f"v{iso_value}.nc"),
    )


# =========================================================
# export cesium 3d tileset
# =========================================================
@router.get("/export_tileset")
def api_export_tileset(
    time_index: int = Query(0),
    iso_value: float = Query(0.5),
):
    try:
        result = build_tileset_service(time_index, iso_value)
        return {
            "status": "success",
            "tileset_url": result["tileset_url"],
            "b3dm_url": result["b3dm_url"],
            "cache_key": result["cache_key"],
            "cached": result["cached"],
        }
    except Exception as e:
        traceback.print_exc()  # 这会在终端输出完整的错误堆栈
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(e)},  # 简短错误信息返回给前端
        )
