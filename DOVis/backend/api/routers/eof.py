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



# =========================================================
# API
# =========================================================
@router.post("/eof-run")
def run_eof(req: EOFRequest):
    # 显式打印，如果终端这里都没反应，说明你的 main.py 挂载路由写错了！
    print(f"\n[ROUTE LOG] Received EOF Request for {req.dataset_id}, mode: {req.mode_type}")
    
    # 强制将 slice_params 兜底，防止前端传 null 报错
    sparams = req.slice_params if req.slice_params is not None else {}
    
    # 特殊照顾：如果前端传的是 horizontal，但没包在 slice_params 里面，我们从顶层捞出来补进去
    if req.mode_type == "horizontal" and "depth" not in sparams:
        # 假设前端由于组件状态挂载把 depth 丢在最外层或默认为 0
        pass

    return run_eof_service(
        dataset_id=req.dataset_id,
        variable=req.variable,
        time_range=req.time_range,
        mode_type=req.mode_type,
        mode_num=req.mode_num,
        slice_params=sparams
    )