import numpy as np


def make_translation_transform(center_ecef):
    """
    Build 3D Tiles root transform.

    3D Tiles matrices are column-major.

    This transform means:

        world_position = center_ecef + local_position
    """

    center_ecef = np.asarray(center_ecef, dtype=np.float64)

    if center_ecef.shape != (3,):
        raise ValueError(f"Invalid center_ecef shape: {center_ecef.shape}")

    if not np.all(np.isfinite(center_ecef)):
        raise ValueError("center_ecef contains NaN or Inf")

    cx, cy, cz = center_ecef

    return [
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
        float(cx),
        float(cy),
        float(cz),
        1.0,
    ]


def build_tileset(
    b3dm_uri,
    center_ecef,
    radius,
    geometric_error=None,
):
    """
    Build single-root 3D Tiles tileset.

    Important:
    - GLB vertices are local.
    - root.transform translates local coordinates back to ECEF.
    - root.boundingVolume is local because root.transform is applied to it.
    """

    center_ecef = np.asarray(center_ecef, dtype=np.float64)
    radius = float(radius)

    if radius <= 0 or not np.isfinite(radius):
        raise ValueError(f"Invalid radius: {radius}")

    if geometric_error is None:
        geometric_error = radius

    transform = make_translation_transform(center_ecef)

    return {
        "asset": {
            "version": "1.0",
            "gltfUpAxis": "Y",
        },
        "geometricError": float(geometric_error),
        "root": {
            "transform": transform,
            "boundingVolume": {
                "sphere": [
                    0.0,
                    0.0,
                    0.0,
                    radius,
                ]
            },
            "geometricError": 0.0,
            "refine": "ADD",
            "content": {
                "uri": b3dm_uri,
            },
        },
    }
