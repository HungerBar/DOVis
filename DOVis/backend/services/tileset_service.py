import os
import json
import hashlib
import shutil
import traceback
from typing import Any

import numpy as np

# Lazy imports — only needed when build_tileset_service is called
# from backend.isoGeometry.marching import run_marching_cubes_ecef
# from backend.isoExport.gltf_export import export_glb
# from backend.isoExport.b3dm_export import glb_to_b3dm
# from backend.isoExport.tileset import build_tileset

# =========================================================
# config
# =========================================================

BASE_URL = "http://localhost:5001"

CACHE_VERSION = "ecef_structured_local_gltf_yup_v1"

BACKEND_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
    )
)

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        BACKEND_DIR,
        "..",
    )
)

TILES_ROOT = os.path.join(
    PROJECT_ROOT,
    "tiles",
)


# =========================================================
# helpers
# =========================================================


def to_py(obj: Any):
    if isinstance(obj, np.ndarray):
        return obj.tolist()

    if isinstance(obj, (np.floating, np.integer)):
        return obj.item()

    return obj


def make_tileset_key(
    time_index: int,
    iso_value: float,
) -> str:
    """
    Stable cache key.

    CACHE_VERSION is included so old wrong cache will not be reused.
    """

    text = f"{CACHE_VERSION}_{int(time_index)}_{float(iso_value):.6f}"

    return hashlib.md5(text.encode("utf-8")).hexdigest()


def _build_result(
    key: str,
    glb_path: str,
    b3dm_path: str,
    tileset_path: str,
    cached: bool,
):
    return {
        "cache_key": key,
        "tileset_url": f"{BASE_URL}/tiles/{key}/tileset.json",
        "b3dm_url": f"{BASE_URL}/tiles/{key}/iso.b3dm",
        "cached": cached,
        "paths": {
            "glb": glb_path,
            "b3dm": b3dm_path,
            "tileset": tileset_path,
        },
    }


def _validate_mesh(
    verts_ecef,
    faces,
):
    verts_ecef = np.asarray(verts_ecef, dtype=np.float64)
    faces = np.asarray(faces, dtype=np.uint32)

    if verts_ecef.ndim != 2 or verts_ecef.shape[1] != 3:
        raise ValueError(f"Invalid verts_ecef shape: {verts_ecef.shape}")

    if faces.ndim != 2 or faces.shape[1] != 3:
        raise ValueError(f"Invalid faces shape: {faces.shape}")

    if len(verts_ecef) == 0:
        raise ValueError("Empty vertices")

    if len(faces) == 0:
        raise ValueError("Empty faces")

    if not np.all(np.isfinite(verts_ecef)):
        raise ValueError("ECEF vertices contain NaN or Inf")

    if not np.all(np.isfinite(faces)):
        raise ValueError("Faces contain NaN or Inf")

    if faces.max() >= len(verts_ecef):
        raise ValueError(
            f"Face index out of range: max={faces.max()}, vertices={len(verts_ecef)}"
        )

    return verts_ecef, faces


def _get_bounding_sphere_from_meta(meta):
    bounding_sphere = meta.get("bounding_sphere")

    if not bounding_sphere:
        raise ValueError("Missing meta['bounding_sphere']")

    center_ecef = np.asarray(
        bounding_sphere["center"],
        dtype=np.float64,
    )

    radius = float(bounding_sphere["radius"])

    if center_ecef.shape != (3,):
        raise ValueError(f"Invalid center_ecef shape: {center_ecef.shape}")

    if not np.all(np.isfinite(center_ecef)):
        raise ValueError("Invalid bounding sphere center")

    if not np.isfinite(radius) or radius <= 0:
        raise ValueError(f"Invalid bounding sphere radius: {radius}")

    return center_ecef, radius


# =========================================================
# public service
# =========================================================


def build_tileset_service(
    time_index: int,
    iso_value: float,
):
    """
    Build or reuse cached 3D Tiles.

    Interface expected by router:

        result = build_tileset_service(time_index, iso_value)

    Return:
        {
            "tileset_url": ...,
            "b3dm_url": ...,
            "cache_key": ...,
            "cached": ...
        }
    """

    time_index = int(time_index)
    iso_value = float(iso_value)

    key = make_tileset_key(
        time_index=time_index,
        iso_value=iso_value,
    )

    out_dir = os.path.join(
        TILES_ROOT,
        key,
    )

    glb_path = os.path.join(
        out_dir,
        "iso.glb",
    )

    b3dm_path = os.path.join(
        out_dir,
        "iso.b3dm",
    )

    tileset_path = os.path.join(
        out_dir,
        "tileset.json",
    )

    # =====================================================
    # 1. cache hit
    # =====================================================

    if (
        os.path.isfile(glb_path)
        and os.path.isfile(b3dm_path)
        and os.path.isfile(tileset_path)
    ):
        print("\n====================================")
        print("TILESET CACHE HIT")
        print("====================================")
        print("key:", key)
        print("tileset:", tileset_path)

        return _build_result(
            key=key,
            glb_path=glb_path,
            b3dm_path=b3dm_path,
            tileset_path=tileset_path,
            cached=True,
        )

    # =====================================================
    # 2. build new tileset
    # =====================================================

    os.makedirs(
        out_dir,
        exist_ok=True,
    )

    try:
        print("\n====================================")
        print("BUILD TILESET SERVICE")
        print("====================================")
        print("time_index:", time_index)
        print("iso_value:", iso_value)
        print("cache_key:", key)
        print("out_dir:", out_dir)

        # -------------------------------------------------
        # 2.1 marching cubes -> absolute ECEF mesh
        # -------------------------------------------------

        from backend.isoGeometry.marching import run_marching_cubes_ecef

        verts_ecef, faces, meta = run_marching_cubes_ecef(
            time_idx=time_index,
            iso_value=iso_value,
            verbose=True,
        )

        verts_ecef, faces = _validate_mesh(
            verts_ecef,
            faces,
        )

        # -------------------------------------------------
        # 2.2 bounding sphere
        # -------------------------------------------------

        center_ecef, radius = _get_bounding_sphere_from_meta(meta)

        print("\nECEF BOUNDING SPHERE")
        print("center_ecef:", center_ecef)
        print("radius:", radius)

        # -------------------------------------------------
        # 2.3 localize vertices
        # -------------------------------------------------
        #
        # Do not write 6,000,000 m ECEF coordinates directly into GLB.
        # GLB stores local coordinates.
        # tileset root.transform places the tile back to ECEF.
        # -------------------------------------------------

        local_vertices = verts_ecef - center_ecef

        if not np.all(np.isfinite(local_vertices)):
            raise ValueError("Local vertices contain NaN or Inf")

        max_local_abs = float(np.max(np.abs(local_vertices)))

        print("\nLOCAL VERTEX CHECK")
        print("max abs local coord:", max_local_abs)

        # -------------------------------------------------
        # 2.4 export GLB
        # -------------------------------------------------

        from backend.isoExport.gltf_export import export_glb

        export_glb(
            vertices=local_vertices,
            faces=faces,
            path=glb_path,
            origin=None,
            double_sided=True,
        )

        if not os.path.isfile(glb_path):
            raise FileNotFoundError(f"GLB was not created: {glb_path}")

        # -------------------------------------------------
        # 2.5 GLB -> B3DM
        # -------------------------------------------------

        with open(glb_path, "rb") as f:
            glb_bytes = f.read()

        from backend.isoExport.b3dm_export import glb_to_b3dm

        b3dm_bytes = glb_to_b3dm(glb_bytes)

        with open(b3dm_path, "wb") as f:
            f.write(b3dm_bytes)

        if not os.path.isfile(b3dm_path):
            raise FileNotFoundError(f"B3DM was not created: {b3dm_path}")

        # -------------------------------------------------
        # 2.6 write tileset.json
        # -------------------------------------------------
        #
        # content.uri must point to B3DM, not GLB.
        # -------------------------------------------------

        from backend.isoExport.tileset import build_tileset

        tileset = build_tileset(
            b3dm_uri="iso.b3dm",
            center_ecef=center_ecef,
            radius=radius,
            geometric_error=radius,
        )

        tileset = json.loads(
            json.dumps(
                tileset,
                default=to_py,
            )
        )

        with open(tileset_path, "w", encoding="utf-8") as f:
            json.dump(
                tileset,
                f,
                indent=2,
            )

        if not os.path.isfile(tileset_path):
            raise FileNotFoundError(f"tileset.json was not created: {tileset_path}")

        print("\nTILESET EXPORT DONE")
        print("glb:", glb_path)
        print("b3dm:", b3dm_path)
        print("tileset:", tileset_path)
        print("tileset_url:", f"{BASE_URL}/tiles/{key}/tileset.json")

    except Exception as e:
        traceback.print_exc()

        if os.path.exists(out_dir):
            shutil.rmtree(out_dir)

        raise RuntimeError(f"Failed to build tileset: {e}") from e

    return _build_result(
        key=key,
        glb_path=glb_path,
        b3dm_path=b3dm_path,
        tileset_path=tileset_path,
        cached=False,
    )
