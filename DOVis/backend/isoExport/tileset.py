import numpy as np
from pyproj import Transformer

to_ecef = Transformer.from_crs("EPSG:4979", "EPSG:4978", always_xy=True)


def ecef_translation(lon, lat, h=0.0):
    x0, y0, z0 = to_ecef.transform(lon, lat, h)

    M = np.eye(4)
    M[:3, 3] = [x0, y0, z0]
    return M.flatten().tolist()


def build_tileset(b3dm_uri, geometric_error, lon=80.0, lat=-20.0, height=0.0):

    x0, y0, z0 = to_ecef.transform(lon, lat, 0)

    M = np.eye(4).flatten().tolist()

    return {
        "asset": {"version": "1.0"},
        "geometricError": float(geometric_error),
        "root": {
            "transform": M,
            "boundingVolume": {"sphere": [x0, y0, z0, float(geometric_error)]},
            "geometricError": float(geometric_error),
            "refine": "REPLACE",
            "content": {"uri": b3dm_uri},
            "children": [],
        },
    }
