import os
import hashlib


# -----------------------------
# 1. 生成 cache key
# -----------------------------
def build_cache_key(
    time_index: int,
    threshold: float,
    depth_index: int,
    model_version: str = "v1"
) -> str:
    """
    生成唯一 cache key
    """

    raw = f"{time_index}_{depth_index}_{threshold}_{model_version}"

    return hashlib.md5(raw.encode("utf-8")).hexdigest()


# -----------------------------
# 2. cache 根目录
# -----------------------------
BASE_CACHE_DIR = os.path.normpath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "tiles",
        "hypoxia"
    )
)


# -----------------------------
# 3. 获取 cache dir
# -----------------------------
def get_cache_dir(cache_key: str) -> str:
    """
    每个 cache_key 对应一个目录
    """

    return os.path.join(
        BASE_CACHE_DIR,
        cache_key
    )


# -----------------------------
# 4. 判断是否存在 cache
# -----------------------------
def is_cached(cache_key: str) -> bool:
    """
    判断是否已有结果
    """

    cache_dir = get_cache_dir(cache_key)

    geojson_path = os.path.join(
        cache_dir,
        "boundary.geojson"
    )

    return os.path.exists(geojson_path)