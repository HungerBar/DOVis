import traceback
import tempfile
from pathlib import Path

import numpy as np
import xarray as xr
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse, FileResponse

from backend.services.boundary_service import calculate_boundary
from backend.core.dataset import get_ds


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


@router.get("/export_boundary_nc")
def export_boundary_nc(
    time_index: int = Query(0, description="Time index"),
    threshold: float = Query(2.0, description="Hypoxia threshold (mg/L)"),
):
    try:
        ds = get_ds()
        oxygen = ds["o2_pred"].isel(time=time_index)

        mask = (oxygen < threshold).astype(np.int8)

        out_ds = xr.Dataset(
            {
                "hypoxia_mask": mask,
                "oxygen": oxygen,
            },
            attrs={
                "description": f"Hypoxia boundary mask (oxygen < {threshold})",
                "time_index": time_index,
                "threshold": threshold,
            },
        )

        tmp = tempfile.NamedTemporaryFile(suffix=".nc", delete=False)
        out_ds.to_netcdf(tmp.name)
        tmp.close()

        filename = f"hypoxia_boundary_t{time_index}_th{threshold}.nc"
        return FileResponse(
            tmp.name,
            media_type="application/x-netcdf",
            filename=filename,
        )
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": str(exc)},
        )
