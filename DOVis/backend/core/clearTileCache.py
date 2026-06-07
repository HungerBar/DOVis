import os
import shutil
from pathlib import Path
from fastapi import FastAPI

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parents[2]
TILE_DIR = BASE_DIR / "tiles"


def clear_tiles_cache():
    """
    清理 Cesium tiles cache（安全版）
    """
    if not TILE_DIR.exists():
        print(f"[startup] TILE_DIR not found: {TILE_DIR}")
        return

    try:
        # 删除整个目录内容，但保留目录本身
        for item in TILE_DIR.iterdir():
            if item.is_dir():
                shutil.rmtree(item, ignore_errors=True)
            else:
                try:
                    item.unlink()
                except Exception:
                    pass

        print(f"[startup] tiles cache cleared: {TILE_DIR}")

    except Exception as e:
        print(f"[startup] failed to clear tiles cache: {e}")
