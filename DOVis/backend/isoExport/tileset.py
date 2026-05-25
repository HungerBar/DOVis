import numpy as np
from pyproj import Transformer

to_ecef = Transformer.from_crs("EPSG:4979", "EPSG:4978", always_xy=True)


def ecef_translation(lon, lat, h=0.0):
    x0, y0, z0 = to_ecef.transform(lon, lat, h)

    M = np.eye(4)
    M[:3, 3] = [x0, y0, z0]
    return M.flatten().tolist()


def build_tileset(b3dm_uri, geometric_error):

    M = np.eye(4).flatten().tolist()

    return {
        "asset": {"version": "1.0"},
        "geometricError": float(geometric_error),

        "root": {
            "transform": M,

            # ✔ ENU mesh 不要再用 ECEF sphere
            "boundingVolume": {
                "sphere": [0.0, 0.0, 0.0, float(geometric_error)]
            },

            "geometricError": float(geometric_error),
            "refine": "REPLACE",
            "content": {"uri": b3dm_uri},
            "children": []
        }
    }
