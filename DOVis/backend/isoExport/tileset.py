import numpy as np


def build_tileset(
    b3dm_uri,
    mc_result,
    geometric_error=None,
):
    """
    Pure ECEF tileset builder (Cesium-safe).

    REQUIREMENTS:
    - mesh MUST already be in ECEF
    - NO ENU, NO rotation frame
    """

    meta = mc_result

    # =========================================================
    # 1. bounding sphere (ECEF)
    # =========================================================
    center = np.array(
        meta["bounding_sphere"]["center_ecef"],
        dtype=np.float64,
    )

    radius = float(meta["bounding_sphere"]["radius"])

    if not np.isfinite(center).all():
        raise ValueError("Invalid ECEF center")

    if radius <= 0:
        raise ValueError("Invalid radius")

    # =========================================================
    # 2. geometric error
    # =========================================================
    if geometric_error is None:
        geometric_error = radius

    # =========================================================
    # 3. identity transform (explicit column-major safe form)
    # =========================================================
    transform = [
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        1.0,
    ]

    # =========================================================
    # 4. tileset root
    # =========================================================
    return {
        "asset": {"version": "1.0", "gltfUpAxis": "Z"},
        "geometricError": float(geometric_error),
        "root": {
            "transform": transform,
            "boundingVolume": {
                "sphere": [
                    float(center[0]),
                    float(center[1]),
                    float(center[2]),
                    float(radius),
                ]
            },
            "refine": "REPLACE",
            "geometricError": float(geometric_error),
            "content": {"uri": b3dm_uri},
        },
    }
