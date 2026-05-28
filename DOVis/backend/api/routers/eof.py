from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal, Optional, Dict
from fastapi import Query

from backend.core.dataset import get_ds, get_ds_by_id
from backend.services.eof_service import run_eof_service

router = APIRouter()


# =========================================================
# GET: EOF options（给前端生成UI用）
# =========================================================
@router.get("/eof-options")
def get_eof_options(dataset_id: str = "do_predict"):
    
    ds = get_ds_by_id(dataset_id)

    # =====================================================
    # 1. dataset（目前单文件，但保留扩展）
    # =====================================================
    datasets = [
        {
            "id": "do_predict",
            "name": "Indian Ocean Oxygen Dataset"
        }
    ]

    # =====================================================
    # 2. variables
    # =====================================================
    variables = list(ds.data_vars.keys())

    # =====================================================
    # 3. time range
    # =====================================================
    time_len = ds.dims["time"]
    time_range = [0, time_len - 1]

    # =====================================================
    # 4. depth range
    # =====================================================
    if "depth" in ds.dims:
        depth_values = ds["depth"].values
        depth_range = [float(depth_values.min()), float(depth_values.max())]
    else:
        depth_range = None

    # =====================================================
    # 5. supported modes
    # =====================================================
    modes = ["horizontal", "section"]

    return {
        "datasets": datasets,
        "variables": variables,
        "time_range": time_range,
        "depth_range": depth_range,
        "modes": modes
    }

# =========================================================
# Request
# =========================================================
class EOFRequest(BaseModel):
    dataset_id: str          # 数据源选择
    variable: str

    time_range: list[int]

    mode_type: Literal["horizontal", "section"]

    mode_num: int = 3

    slice_params: Optional[Dict] = None
    # horizontal: {"depth": 50}
    # section: {"type": "lat", "value": 10}


# =========================================================
# API
# =========================================================
@router.post("/eof-run")
def run_eof(req: EOFRequest):

    return run_eof_service(
        dataset_id=req.dataset_id,
        variable=req.variable,
        time_range=req.time_range,
        mode_type=req.mode_type,
        mode_num=req.mode_num,
        slice_params=req.slice_params,
    )