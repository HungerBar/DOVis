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
from rasterio import features
import shapely.geometry as sg

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
    if oxygen_3d is None:
        return None, {"error": "oxygen_3d is None"}

    if depth_index < 0 or depth_index >= oxygen_3d.shape[0]:
        return None, {"error": "depth_index out of range"}

    layer = oxygen_3d[depth_index, :, :]

    report["shape"] = oxygen_3d.shape
    report["layer_min"] = float(np.nanmin(layer))
    report["layer_max"] = float(np.nanmax(layer))
    report["threshold"] = threshold

    # ------------------------
    # 2. 构造 mask（低氧区）
    # ------------------------
    mask = (layer < threshold).astype(np.uint8)

    report["mask_ratio"] = float(np.mean(mask))
    report["mask_sum"] = int(np.sum(mask))

    if report["mask_sum"] == 0:
        return None, {"error": "no values below threshold", **report}

    # ------------------------
    # 3. rasterio shapes（核心）
    # ------------------------
    shapes_gen = features.shapes(mask.astype(np.int16))

    polygons = []

    # ------------------------
    # 4. 坐标转换（pixel → lon/lat）
    # ------------------------
    lon_min, lon_max = float(lons.min()), float(lons.max())
    lat_min, lat_max = float(lats.min()), float(lats.max())

    nlon = len(lons)
    nlat = len(lats)

    def pixel_to_lonlat(coords):
        new_rings = []

        for ring in coords:
            new_ring = []
            for x, y in ring:

                lon = np.interp(x, [0, nlon - 1], [lon_min, lon_max])
                lat = np.interp(y, [0, nlat - 1], [lat_min, lat_max])

                new_ring.append((lon, lat))

            new_rings.append(new_ring)

        return sg.Polygon(new_rings[0], new_rings[1:])

    # ------------------------
    # 5. 提取 polygon
    # ------------------------
    for geom, value in shapes_gen:

        if value != 1:
            continue

        poly = pixel_to_lonlat(geom["coordinates"])

        if poly.is_empty:
            continue

        # 过滤极小碎片（关键）
        if poly.area < 1e-6:
            continue

        polygons.append(poly)

    if not polygons:
        return None, {"error": "no valid polygons", **report}

    # ------------------------
    # 6. 合并（避免 MultiPolygon 混乱）
    # ------------------------
    from shapely.ops import unary_union

    merged = unary_union(polygons)

    # ------------------------
    # 7. 输出统一处理
    # ------------------------
    if merged.geom_type == "Polygon":
        result_geom = merged
    else:
        # MultiPolygon → 保留最大面（避免碎片）
        result_geom = max(merged.geoms, key=lambda g: g.area)


    if merged.geom_type == "Polygon":
        result_geom = merged
    else:
        result_geom = max(
            merged.geoms,
            key=lambda g: g.area
        )

    # ------------------------
    # 平滑边界
    # ------------------------
    cell_lon = abs(lons[1] - lons[0])
    cell_lat = abs(lats[1] - lats[0])

    tol = max(cell_lon, cell_lat)

    result_geom = (
        result_geom
        .buffer(tol)
        .buffer(-tol)
        .simplify(
            tol * 0.5,
            preserve_topology=True
        )
    )

    # ------------------------
    # 8. report
    # ------------------------
    report["num_raw_polygons"] = len(polygons)
    report["geom_type"] = result_geom.geom_type
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
