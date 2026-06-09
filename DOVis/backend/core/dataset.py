import xarray as xr
from pathlib import Path
import threading
import os

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "do_predict.nc"

_ds = None
_lock = threading.Lock()
_validated = False


# =========================================================
# MULTI DATASET SUPPORT
# =========================================================
DATASETS = {
    "do_predict": DATA_PATH,  # 当前默认数据
}


def _validate_nc(path: Path) -> bool:
    """
    只做轻量级验证，不污染全局状态
    """
    try:
        if not path.exists():
            return False

        # 使用 decode_times=False 避免时间轴问题引发额外报错
        ds = xr.open_dataset(path, decode_times=False)

        # 强制触发一次读取（避免 lazy masking 掩盖问题）
        _ = ds.variables.keys()

        ds.close()
        return True

    except Exception as e:
        print(f"[Dataset] validation failed: {e}")
        return False


def _reset_cache():
    """
    只清理内存，不动磁盘
    """
    global _ds, _validated
    _ds = None
    _validated = False


def get_ds():
    """
    安全版本 dataset loader：

    - 单例缓存
    - 启动延迟加载
    - 文件损坏检测
    - 不在这里 crash FastAPI
    """
    global _ds, _validated

    with _lock:

        # 已经加载过且验证通过
        if _ds is not None:
            return _ds

        # 文件不存在
        if not DATA_PATH.exists():
            raise FileNotFoundError(f"[Dataset] not found: {DATA_PATH}")

        # 只验证一次（避免重复 IO）
        if not _validated:
            ok = _validate_nc(DATA_PATH)
            if not ok:
                _reset_cache()
                raise RuntimeError(
                    "[Dataset] do_predict.nc is corrupted or unreadable. "
                    "Please regenerate dataset."
                )
            _validated = True

        try:
            _ds = xr.open_dataset(DATA_PATH, decode_times=False)
            return _ds

        except Exception as e:
            _reset_cache()
            raise RuntimeError(f"[Dataset] failed to open dataset: {e}")


def get_ds_by_id(dataset_id: str):
    """
    多数据源版本 dataset loader。

    当前版本只注册了 do_predict 数据集。
    后续如果有新数据集，可以继续往 DATASETS 里添加。
    """
    with _lock:

        # 检查 dataset 是否存在
        if dataset_id not in DATASETS:
            raise ValueError(f"[Dataset] Unknown dataset_id: {dataset_id}")

        path = DATASETS[dataset_id]

        # 文件检查
        if not path.exists():
            raise FileNotFoundError(f"[Dataset] not found: {path}")

        # 这里先不复用 get_ds 的全局缓存，避免多数据源缓存混乱
        try:
            ds = xr.open_dataset(path, decode_times=False)
            return ds

        except Exception as e:
            raise RuntimeError(f"[Dataset] failed to open {dataset_id}: {e}")
