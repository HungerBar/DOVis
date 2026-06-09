import os
import json
import hashlib
import shutil
import numpy as np

from backend.isoGeometry.marching import run_marching_cubes_ecef
from backend.isoExport.gltf_export import export_glb
from backend.isoExport.b3dm_export import glb_to_b3dm
from backend.isoExport.tileset import build_tileset

_TILESET_CACHE = {}
BASE_URL = "http://localhost:5001"


def to_py(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.floating, np.integer)):
        return obj.item()
    return obj


def make_tileset_key(time_idx: int, iso_value: float) -> str:
    return hashlib.md5(f"{time_idx}_{iso_value:.6f}".encode()).hexdigest()


def export_tileset(time_idx: int, iso_value: float, out_root: str = "tiles"):

    key = make_tileset_key(time_idx, iso_value)
    out_dir = os.path.join(out_root, key)

    glb_path = os.path.join(out_dir, "iso.glb")
    b3dm_path = os.path.join(out_dir, "iso.b3dm")
    tileset_path = os.path.join(out_dir, "tileset.json")

    # =====================================================
    # cache
    # =====================================================
    if (
        os.path.isfile(glb_path)
        and os.path.isfile(b3dm_path)
        and os.path.isfile(tileset_path)
    ):
        return _build_result(key, glb_path, b3dm_path, tileset_path, True)

    os.makedirs(out_dir, exist_ok=True)

    try:
        # =================================================
        # 1. marching cubes → ECEF mesh + META
        # =================================================
        verts, faces, meta = run_marching_cubes_ecef(time_idx, iso_value)

        verts = np.asarray(verts, dtype=np.float64)
        faces = np.asarray(faces, dtype=np.uint32)

        if len(verts) == 0 or len(faces) == 0:
            raise ValueError("Empty mesh")

        if not np.all(np.isfinite(verts)):
            raise ValueError("Invalid ECEF vertices")

        # =================================================
        # 2. USE META DIRECTLY (核心修改)
        # =================================================
        bounding_sphere = meta["bounding_sphere"]

        center = np.asarray(bounding_sphere["center"], dtype=np.float64)
        radius = float(bounding_sphere["radius"])

        print("====================================")
        print("ECEF CHECK (FROM META)")
        print("center:", center)
        print("radius:", radius)
        print("====================================")

        # =================================================
        # 3. export GLB (ECEF)
        # =================================================
        export_glb(vertices=verts, faces=faces, path=glb_path, origin=None)

        # =================================================
        # 4. GLB → B3DM
        # =================================================
        with open(glb_path, "rb") as f:
            glb_bytes = f.read()

        b3dm_bytes = glb_to_b3dm(glb_bytes)

        with open(b3dm_path, "wb") as f:
            f.write(b3dm_bytes)

        # =================================================
        # 5. build tileset USING META
        # =================================================
        tileset = build_tileset(
            b3dm_uri="iso.glb",
            mc_result={
                "bounding_sphere": {
                    "center_ecef": center.tolist(),
                    "radius": radius,
                }
            },
            geometric_error=radius,
        )

        tileset = json.loads(json.dumps(tileset, default=to_py))

        with open(tileset_path, "w", encoding="utf-8") as f:
            json.dump(tileset, f, indent=2)

    except Exception as e:
        if os.path.exists(out_dir):
            shutil.rmtree(out_dir)
        raise RuntimeError(f"Failed ECEF tileset generation: {e}") from e

    return _build_result(key, glb_path, b3dm_path, tileset_path, False)


def _build_result(key, glb_path, b3dm_path, tileset_path, cached):
    return {
        "cache_key": key,
        "tileset_url": f"/tiles/{key}/tileset.json",
        "b3dm_url": f"/tiles/{key}/iso.b3dm",
        "cached": cached,
        "paths": {
            "glb": glb_path,
            "b3dm": b3dm_path,
            "tileset": tileset_path,
        },
    }
