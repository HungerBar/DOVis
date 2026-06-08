import os
import json
import pandas as pd
import numpy as np
import alphashape
from hypoxia.cache_service import build_cache_key, get_cache_dir

from core.dataset import get_ds
from core.oxygen_reader import load_oxygen_data
from shapely.geometry import mapping

# -----------------------------
# 1. 边界生成
# -----------------------------
def generate_boundary(
    oxygen_3d: np.ndarray,
    lons: np.ndarray,
    lats: np.ndarray,
    depth_index: int,
    threshold: float,
    alpha: float = 0.02
):

    report = {}

    # ------------------------
    # 1. 基础检查
    # ------------------------
    report["has_data"] = oxygen_3d is not None

    if oxygen_3d is None:
        report["error"] = "oxygen_3d is None"
        return None, report

    report["shape"] = oxygen_3d.shape

    if depth_index < 0 or depth_index >= oxygen_3d.shape[0]:
        report["error"] = "depth_index out of range"
        return None, report

    # ------------------------
    # 2. 切片
    # ------------------------
    layer = oxygen_3d[depth_index, :, :]

    report["layer_min"] = float(np.nanmin(layer))
    report["layer_max"] = float(np.nanmax(layer))
    report["layer_mean"] = float(np.nanmean(layer))

    # ------------------------
    # 3. mask
    # ------------------------
    mask = layer < threshold

    report["threshold"] = threshold
    report["mask_ratio"] = float(np.mean(mask))
    report["mask_sum"] = int(np.sum(mask))

    if not np.any(mask):
        report["error"] = "no values below threshold"
        return None, report

    # ------------------------
    # 4. points
    # ------------------------
    lon_grid, lat_grid = np.meshgrid(lons, lats)

    points = np.column_stack([
        lon_grid[mask],
        lat_grid[mask]
    ])

    report["points_count"] = len(points)

    if len(points) < 4:
        report["error"] = "too few points"
        return None, report

    # ------------------------
    # 5. alpha shape
    # ------------------------
    try:
        polygon = alphashape.alphashape(points, alpha)
    except Exception as e:
        report["error"] = f"alpha shape failed: {str(e)}"
        return None, report

    report["alpha"] = alpha
    report["polygon_empty"] = polygon is None or polygon.is_empty

    if polygon is None or polygon.is_empty:
        report["error"] = "empty polygon"
        return None, report

    # ------------------------
    # 6. success
    # ------------------------
    report["success"] = True

    return polygon, report


# -----------------------------
# 2. shapely -> geojson
# -----------------------------
def polygon_to_geojson(polygon):
    return mapping(polygon) if polygon else None


# -----------------------------
# 3. 主入口（给 FastAPI 调用）
# -----------------------------
def calculate_2Dboundary(
    time_index: int,
    threshold: float,
    depth_index: int,
    alpha: float = 0.01
):
    cache_key = build_cache_key(
        time_index,
        threshold,
        depth_index,
    )
    cache_dir = get_cache_dir(cache_key)

    # 1. load dataset
    oxygen_3d = load_oxygen_data(str(time_index))

    ds = get_ds()
    lons = ds["lon"].values
    lats = ds["lat"].values

    # 2. generate boundary
    polygon, report = generate_boundary(
        oxygen_3d,
        lons,
        lats,
        depth_index,
        threshold,
        alpha
    )

    print(pd.DataFrame([report]))

    if polygon is None:
        return {
            "boundary_url": None,
            "cached": False
        }

    geojson = polygon_to_geojson(polygon)

    # 3. write file
    os.makedirs(cache_dir, exist_ok=True)

    geojson_path = os.path.join(cache_dir, "boundary.geojson")

    with open(geojson_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, ensure_ascii=False)

    # 4. return url 
    BASE_URL = "http://localhost:5001"
    return {
        "boundary_url": f"{BASE_URL}/tiles/hypoxia/{cache_key}/boundary.geojson",
        "cache_key": cache_key,
        "cached": False
    }

def calculate_boundary(
    time_index: int,
    threshold: float,
    alpha: float = 0.2
):
    # 1. 生成 2D 边界
    result_2d = calculate_2Dboundary(time_index, threshold, 0, alpha)

    # 2. 生成 3D Tiles（如果需要）

    # 3. 返回结果
    return {
        "boundary_url": result_2d.get("boundary_url"),
        "cached": result_2d.get("cached", False)
    }