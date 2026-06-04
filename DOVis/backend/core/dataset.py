import xarray as xr
from pathlib import Path
import threading
import os

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "do_predict.nc"

_ds = None
_lock = threading.Lock()
_validated = False


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
