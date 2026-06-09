import os
import json
import pandas as pd
import numpy as np
from backend.hypoxia.cache_service import build_cache_key, get_cache_dir

from backend.core.dataset import get_ds
from backend.core.oxygen_reader import load_oxygen_data
from shapely.geometry import mapping
from skimage import measure
from shapely.geometry import Polygon, MultiPolygon, LineString
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
    alpha: float = 0.02,
):

    report = {}

    # ------------------------
    # 1. 基础检查
    # ------------------------
    if oxygen_3d is None:
        report["error"] = "oxygen_3d is None"
        return None, report

    if depth_index < 0 or depth_index >= oxygen_3d.shape[0]:
        report["error"] = "depth_index out of range"
        return None, report

    report["shape"] = oxygen_3d.shape

    # ------------------------
    # 2. 取层数据
    # ------------------------
    layer = oxygen_3d[depth_index, :, :]

    report["layer_min"] = float(np.nanmin(layer))
    report["layer_max"] = float(np.nanmax(layer))
    report["layer_mean"] = float(np.nanmean(layer))

    # ------------------------
    # 3. 二值化 mask
    # ------------------------
    binary = (layer < threshold).astype(np.uint8)

    report["threshold"] = threshold
    report["mask_ratio"] = float(np.mean(binary))
    report["mask_sum"] = int(np.sum(binary))

    if np.sum(binary) == 0:
        report["error"] = "no values below threshold"
        return None, report

    # ------------------------
    # 4. 提取等值线（核心）
    # ------------------------
    contours = measure.find_contours(binary, 0.5)

    if not contours:
        report["error"] = "no contours found"
        return None, report

    polygons = []

    lon_min, lon_max = float(lons.min()), float(lons.max())
    lat_min, lat_max = float(lats.min()), float(lats.max())

    nlon = len(lons)
    nlat = len(lats)

    # densify 控制参数（越小越密）
    step = 0.02

    for contour in contours:
        if len(contour) < 10:
            continue

        coords = []

        # ------------------------
        # 4.1 像素坐标 → 经纬度
        # ------------------------
        for y, x in contour:
            lon = np.interp(x, [0, nlon - 1], [lon_min, lon_max])
            lat = np.interp(y, [0, nlat - 1], [lat_min, lat_max])
            coords.append((lon, lat))

        # ------------------------
        # 4.2 闭合
        # ------------------------
        if coords[0] != coords[-1]:
            coords.append(coords[0])

        # ------------------------
        # 4.3 densify（关键：加密点）
        # ------------------------
        line = LineString(coords)
        length = line.length

        if length == 0:
            continue

        dense_coords = [
            line.interpolate(d).coords[0] for d in np.arange(0, length, step)
        ]

        if len(dense_coords) < 3:
            continue

        poly = Polygon(dense_coords)

        # ------------------------
        # 4.4 修复 & 简化
        # ------------------------
        if not poly.is_valid:
            poly = poly.buffer(0)

        if poly.is_empty:
            continue

        poly = poly.simplify(0.005, preserve_topology=True)

        polygons.append(poly)

    # ------------------------
    # 5. 输出检查
    # ------------------------
    if not polygons:
        report["error"] = "no valid polygons after processing"
        return None, report

    if len(polygons) == 1:
        result_geom = polygons[0]
    else:
        result_geom = MultiPolygon(polygons)

    # ------------------------
    # 6. report
    # ------------------------
    report["num_contours"] = len(contours)
    report["num_polygons"] = len(polygons)
    report["success"] = True

    return result_geom, report


# -----------------------------
# 2. shapely -> geojson
# -----------------------------
def polygon_to_geojson(polygon):
    return mapping(polygon) if polygon else None


# -----------------------------
# 3. 主入口（给 FastAPI 调用）
# -----------------------------
def calculate_2Dboundary(
    time_index: int, threshold: float, depth_index: int, alpha: float = 0.01
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
        oxygen_3d, lons, lats, depth_index, threshold, alpha
    )

    # print(pd.DataFrame([report]))

    if polygon is None:
        return {"boundary_url": None, "cached": False}

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
        "cached": False,
    }


def calculate_boundary(time_index: int, threshold: float, alpha: float = 0.2):
    # 1. 生成 2D 边界
    result_2d = calculate_2Dboundary(time_index, threshold, 0, alpha)

    # 2. 生成 3D Tiles（如果需要）

    # 3. 返回结果
    return {
        "boundary_url": result_2d.get("boundary_url"),
        "cached": result_2d.get("cached", False),
    }
