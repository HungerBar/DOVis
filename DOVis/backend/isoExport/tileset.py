import numpy as np
from pyproj import Transformer

to_ecef = Transformer.from_crs(
    "EPSG:4979",
    "EPSG:4978",
    always_xy=True,
)


def build_tileset(
    b3dm_uri,
    mc_result,
    geometric_error=None,
):
    """
    mc_result:
    {
        "lon0": ...,
        "lat0": ...,
        "height0": ...,

        "earth_center_ecef": [...],
        "earth_center_enu": [...],

        "north_enu": [...],
        "meridian_enu": [...],

        "north_ecef": [...],
        "meridian_ecef": [...],

        "bounding_sphere": {
            "center_ecef": [...],
            "radius": ...
        }
    }
    """

    meta = mc_result

    # =========================================================
    # 1. metadata
    # =========================================================

    lon0 = float(meta["lon0"])
    lat0 = float(meta["lat0"])
    height0 = float(meta.get("height0", 0.0))

    center_ecef = np.array(
        meta["bounding_sphere"]["center_ecef"],
        dtype=float,
    )

    radius = float(meta["bounding_sphere"]["radius"])

    # =========================================================
    # 2. local origin in ECEF
    # =========================================================

    x0, y0, z0 = to_ecef.transform(
        lon0,
        lat0,
        height0,
    )

    # =========================================================
    # 3. Direction-constrained rotation solve
    # =========================================================

    def normalize(v):
        v = np.array(v, dtype=float)
        n = np.linalg.norm(v)

        if n < 1e-12:
            raise ValueError("zero-length vector")

        return v / n


    # ---------------------------------------------------------
    # LOCAL FRAME (ENU semantic directions)
    # ---------------------------------------------------------

    y_local = normalize(meta["north_enu"])

    tmp_local = normalize(meta["meridian_enu"])

    # Gram-Schmidt
    z_local = normalize(
        tmp_local
        - y_local * np.dot(tmp_local, y_local)
    )

    x_local = normalize(
        np.cross(y_local, z_local)
    )

    # re-orthogonalize
    z_local = normalize(
        np.cross(x_local, y_local)
    )

    B_local = np.stack(
        [
            x_local,
            y_local,
            z_local,
        ],
        axis=1,
    )

    # ---------------------------------------------------------
    # WORLD FRAME (ECEF semantic directions)
    # ---------------------------------------------------------

    y_world = normalize(meta["north_ecef"])

    tmp_world = normalize(meta["meridian_ecef"])

    z_world = normalize(
        tmp_world
        - y_world * np.dot(tmp_world, y_world)
    )

    x_world = normalize(
        np.cross(y_world, z_world)
    )

    z_world = normalize(
        np.cross(x_world, y_world)
    )

    B_world = np.stack(
        [
            x_world,
            y_world,
            z_world,
        ],
        axis=1,
    )

    # =========================================================
    # 4. Solve rotation
    # =========================================================

    # local -> world
    R = B_world @ B_local.T

    # =========================================================
    # 5. Cesium transform
    # =========================================================

    M = np.eye(4)

    M[:3, :3] = R

    M[:3, 3] = [
        x0,
        y0,
        z0,
    ]

    # Cesium uses column-major
    transform = M.T.flatten().tolist()

    # =========================================================
    # 6. geometric error
    # =========================================================

    if geometric_error is None:
        geometric_error = radius

    # =========================================================
    # 7. tileset
    # =========================================================

    return {
        "asset": {"version": "1.0"},
        "geometricError": float(geometric_error),
        "root": {
            "transform": transform,
            "boundingVolume": {
                "sphere": [
                    float(center_ecef[0]),
                    float(center_ecef[1]),
                    float(center_ecef[2]),
                    float(radius),
                ]
            },
            "refine": "REPLACE",
            "content": {"uri": b3dm_uri},
        },
        "extras": {
            "lon0": lon0,
            "lat0": lat0,
            "height0": height0,
            "north_ecef": meta["north_ecef"],
            "meridian_ecef": meta["meridian_ecef"],
            "north_enu": meta["north_enu"],
            "meridian_enu": meta["meridian_enu"],
        },
    }
