import os
import json
import hashlib
import numpy as np
from skimage.measure import marching_cubes

from core.oxygen_reader import load_oxygen_data
from isoExport.gltf_export import export_glb
from isoExport.b3dm_export import glb_to_b3dm
from isoExport.tileset import build_tileset

BASE_URL = "http://localhost:5001"
TILES_ROOT = os.path.normpath( # tiles 根目录，与 backend/main.py 中挂载目录保持一致
    os.path.join(os.path.dirname(__file__), "..", "..", "tiles")
)
HYPOXIA_TILES_ROOT = os.path.join(TILES_ROOT, "hypoxia") # 低氧区专用目录
DEFAULT_THRESHOLD = 20.0  # mg/L


def calculate_boundary(
    time: str,
    threshold: float = DEFAULT_THRESHOLD,
):
    # 低氧区边界分析主入口，返回 Cesium 3D tiles 信息和体积。

    data = load_oxygen_data(time)
    if data is None:
        raise ValueError(f"cannot load oxygen data for time={time}")

    # 输出 data 基本信息，方便排查阈值与网格生成问题
    print("=== boundary_service data debug ===")
    print("data shape:", getattr(data, "shape", None), "dtype:", getattr(data, "dtype", None))
    try:
        print("data min/max:", float(np.nanmin(data)), float(np.nanmax(data)))
    except Exception as e:
        print("data min/max error:", e)
    try:
        sample = np.array(data).ravel()[:8]
        print("data sample:", np.array2string(sample, threshold=8))
    except Exception as e:
        print("data sample error:", e)
    print("=== end debug ===")

    # 将缺失值填充为一个高于最大值的数，避免 NaN 导致 marching_cubes 和 ECEF 计算异常
    if not np.isfinite(data).all():
        finite_max = np.nanmax(data)
        fill_value = finite_max + 1.0
        print("Warning: data contains NaN/inf values; filling missing values with", fill_value)
        data = np.nan_to_num(data, nan=fill_value, posinf=fill_value, neginf=fill_value)

    # 计算低于阈值的体素数量作为体积近似
    mask = data < threshold
    volume = float(np.sum(mask))

    # 计算缓存 key，保证相同 time+threshold 复用
    cache_key = _make_cache_key(time, threshold)
    result = _export_hypoxia_tileset(
        data=data,
        threshold=threshold,
        cache_key=cache_key,
    )

    result["volume"] = volume
    return result


def _make_cache_key(time: str, threshold: float) -> str: # 通过 MD5 生成唯一缓存键
    key = f"{time}_{threshold:.6f}"
    return hashlib.md5(key.encode("utf-8")).hexdigest()


def _get_output_paths(cache_key: str): # 构造输出目录和文件路径
    out_dir = os.path.join(HYPOXIA_TILES_ROOT, cache_key)
    return {
        "dir": out_dir,
        "glb": os.path.join(out_dir, "hypoxia.glb"),
        "b3dm": os.path.join(out_dir, "hypoxia.b3dm"),
        "tileset": os.path.join(out_dir, "tileset.json"),
    }


def _export_hypoxia_tileset(data, threshold: float, cache_key: str):
    paths = _get_output_paths(cache_key)

    # 如果缓存已存在，则直接返回缓存结果
    if (
        os.path.isfile(paths["glb"])
        and os.path.isfile(paths["b3dm"])
        and os.path.isfile(paths["tileset"])
    ):
        return _build_result(cache_key, cached=True)

    os.makedirs(paths["dir"], exist_ok=True)

    # marching_cubes 从三维数据中提取等值面网格
    # volume: 3D 数组
    # level: 阈值
    # spacing: 网格间距
    verts, faces, normals, values = marching_cubes(
        volume=data.astype(np.float32),
        level=threshold,
        spacing=(1.0, 1.0, 1.0),
    )

    if len(verts) == 0 or len(faces) == 0:
        raise RuntimeError("No hypoxia boundary surface could be generated.")

    # faces 原始格式是 (N, 3)，转换为 uint32
    faces = np.asarray(faces, dtype=np.uint32)

    # 将网格导出为 glb
    export_glb(vertices=verts, faces=faces, path=paths["glb"])

    # 读取 glb bytes 生成 b3dm
    with open(paths["glb"], "rb") as f:
        glb_bytes = f.read()

    b3dm_bytes = glb_to_b3dm(glb_bytes)

    with open(paths["b3dm"], "wb") as f:
        f.write(b3dm_bytes)

    # 计算 tileset 的 bounding sphere
    center = np.mean(verts, axis=0).astype(np.float64)
    radius = float(np.max(np.linalg.norm(verts - center, axis=1)))

    tileset = build_tileset(
        b3dm_uri="hypoxia.b3dm",
        mc_result={
            "bounding_sphere": {
                "center_ecef": center.tolist(),
                "radius": radius,
            }
        },
        geometric_error=radius,
    )

    # 保存 tileset.json
    with open(paths["tileset"], "w", encoding="utf-8") as f:
        json.dump(tileset, f, indent=2)

    return _build_result(cache_key, cached=False)


def _build_result(cache_key: str, cached: bool): # 构造返回给前端的结果对象
    return {
        "tileset_url": f"{BASE_URL}/tiles/hypoxia/{cache_key}/tileset.json",
        "b3dm_url": f"{BASE_URL}/tiles/hypoxia/{cache_key}/hypoxia.b3dm",
        "cache_key": cache_key,
        "cached": cached,
    }