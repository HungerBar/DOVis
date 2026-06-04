import hashlib
import os


def build_cache_key(
    time_index: int,
    threshold: float
) -> str:
    """
    根据参数生成唯一缓存键

    Example:
        time=0 threshold=20
        ->
        cc035a9f3196d0e89180dcc74201b050
    """

    key_str = f"{time_index}_{threshold}"

    return hashlib.md5(
        key_str.encode("utf-8")
    ).hexdigest()


def get_cache_dir(
    tiles_root: str,
    cache_key: str
) -> str:
    """
    获取缓存目录

    Example:
        tiles/hypoxia/
            └── cc035a9f3196d0e89180dcc74201b050/
    """

    cache_dir = os.path.join(
        tiles_root,
        cache_key
    )

    os.makedirs(
        cache_dir,
        exist_ok=True
    )

    return cache_dir


def get_tileset_path(
    cache_dir: str
) -> str:
    """
    返回 tileset.json 路径
    """

    return os.path.join(
        cache_dir,
        "tileset.json"
    )


def get_b3dm_path(
    cache_dir: str
) -> str:
    """
    返回 b3dm路径
    """

    return os.path.join(
        cache_dir,
        "0.b3dm"
    )


def is_cached(
    cache_dir: str
) -> bool:
    """
    判断Tiles是否已经生成
    """

    tileset_path = get_tileset_path(
        cache_dir
    )

    return os.path.exists(
        tileset_path
    )


def clear_cache(
    cache_dir: str
):
    """
    删除某个缓存目录
    """

    if not os.path.exists(cache_dir):
        return

    for root, dirs, files in os.walk(
        cache_dir,
        topdown=False
    ):

        for file in files:
            os.remove(
                os.path.join(root, file)
            )

        for d in dirs:
            os.rmdir(
                os.path.join(root, d)
            )

    os.rmdir(cache_dir)