from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, List

from backend.core.dataset import get_ds, get_ds_by_id
from backend.services.eof_service import run_eof_service

router = APIRouter()


# =========================================================
# GET: EOF options（给前端生成合法的UI范围）
# =========================================================
@router.get("/eof-options")
def get_eof_options(dataset_id: str = "do_predict"):
    try:
        ds = get_ds_by_id(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")

    # 1. dataset
    datasets = [{"id": "do_predict", "name": "Indian Ocean Oxygen Dataset"}]

    # 2. variables（🌟核心优化：过滤掉 _bnds 辅助坐标变量，只留下真正能做EOF的 o2_pred）
    variables = [v for v in ds.data_vars.keys() if not v.endswith("_bnds")]

    # 3. time range（真实数据集 480 个时间步 -> 对应索引 0 ~ 479）
    time_len = ds.dims["time"]
    time_range = [0, time_len - 1]

    # 4. depth range（🌟核心优化：按层级返回 [0, 49] 而不是物理米数，方便前端直接渲染滑动条）
    if "depth" in ds.dims:
        depth_len = ds.dims["depth"]
        depth_range = [0, depth_len - 1]
    else:
        depth_range = None

    # 5. 附加空间安全包络（供高级校验使用）
    lat_range = [float(ds["lat"].values.min()), float(ds["lat"].values.max())]
    lon_range = [float(ds["lon"].values.min()), float(ds["lon"].values.max())]

    modes = ["horizontal", "section"]

    return {
        "datasets": datasets,
        "variables": variables,
        "time_range": time_range,
        "depth_range": depth_range,
        "lat_range": lat_range,
        "lon_range": lon_range,
        "modes": modes,
    }


# =========================================================
# Request Schema
# =========================================================
class EOFRequest(BaseModel):
    dataset_id: str
    variable: str
    time_range: List[int]
    mode_type: Literal["horizontal", "section"]
    mode_num: int = Field(default=3, ge=1, le=10)
    slice_params: Optional[Dict] = None


# =========================================================
# API: 带有安全换算与防御的解耦运行接口
# =========================================================
@router.post("/eof-run")
def run_eof(req: EOFRequest):
    print(
        f"\n[ROUTE LOG] Received EOF Request for {req.dataset_id}, mode: {req.mode_type}"
    )

    try:
        ds = get_ds_by_id(req.dataset_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # 1. 基础时间边界防御
    if len(req.time_range) != 2 or req.time_range[0] > req.time_range[1]:
        raise HTTPException(status_code=400, detail="time_range 格式错误。")
    if not (0 <= req.time_range[0] < ds.dims["time"]) or not (
        0 <= req.time_range[1] < ds.dims["time"]
    ):
        raise HTTPException(status_code=400, detail="时间参数越界。")

    sparams = req.slice_params if req.slice_params is not None else {}

    # 2. 水平切片模式：完成“层级索引 -> 物理水深”的偷天换日
    if req.mode_type == "horizontal":
        if "depth" not in sparams:
            sparams["depth"] = 0

        try:
            depth_idx = int(sparams["depth"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="深度层级必须为整数索引。")

        if not (0 <= depth_idx < ds.dims["depth"]):
            raise HTTPException(
                status_code=400,
                detail=f"深度层级超出范围，应在 0-{ds.dims['depth']-1} 层之间。",
            )

        # 🔥【关键节点】：获取真实非线性物理深度（float米数），重写参数，供底层的 .sel(method="nearest") 匹配
        real_depth_val = float(ds["depth"].values[depth_idx])
        sparams["depth"] = real_depth_val

    # 3. 剖面切片模式：对输入的经纬度空间边界进行刚性防御
    elif req.mode_type == "section":
        if "type" not in sparams:
            sparams["type"] = "lat"
        if "value" not in sparams:
            sparams["value"] = float(ds["lat"].values.min())

        if sparams["type"] not in ["lat", "lon"]:
            raise HTTPException(
                status_code=400, detail="剖面类型必须为 'lat' 或 'lon'。"
            )

        val = float(sparams["value"])
        if sparams["type"] == "lat":
            lat_min, lat_max = float(ds["lat"].values.min()), float(
                ds["lat"].values.max()
            )
            if not (lat_min <= val <= lat_max):
                raise HTTPException(
                    status_code=400,
                    detail=f"纬度剖面位置越界！当前数据集支持范围: {lat_min} 到 {lat_max}",
                )
        else:
            lon_min, lon_max = float(ds["lon"].values.min()), float(
                ds["lon"].values.max()
            )
            if not (lon_min <= val <= lon_max):
                raise HTTPException(
                    status_code=400,
                    detail=f"经度剖面位置越界！当前数据集支持范围: {lon_min} 到 {lon_max}",
                )

    return run_eof_service(
        dataset_id=req.dataset_id,
        variable=req.variable,
        time_range=req.time_range,
        mode_type=req.mode_type,
        mode_num=req.mode_num,
        slice_params=sparams,
    )
