from backend.core.dataset import get_ds
from backend.core.oxygen_reader import load_oxygen_data

from backend.hypoxia.mesh_service import generate_mesh
from backend.hypoxia.tile_service import (
    export_glb,
    glb_to_3dtiles
)

from backend.hypoxia.cache_service import (
    build_cache_key,
    get_cache_dir
)

import os


BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

TILES_ROOT = os.path.normpath(
    os.path.join(
        BASE_DIR,
        "..",
        "tiles",
        "hypoxia"
    )
)
def calculate_boundary(
    time_index: int,
    threshold: float
):

    cache_key = build_cache_key(
        time_index,
        threshold
    )

    cache_dir = get_cache_dir(
        TILES_ROOT,
        cache_key
    )

    tileset_path = os.path.join(
        cache_dir,
        "tileset.json"
    )

    if os.path.exists(tileset_path):

        return {
            "tileset_url":
                f"/tiles/hypoxia/{cache_key}/tileset.json",

            "b3dm_url":
                f"/tiles/hypoxia/{cache_key}/0.b3dm",

            "cache_key":
                cache_key,

            "cached":
                True,

            "volume":
                None
        }

    oxygen_data = load_oxygen_data(
        str(time_index)
    )

    ds = get_ds()

    lons = ds["lon"].values
    lats = ds["lat"].values
    depths = ds["depth"].values

    mesh, volume = generate_mesh(
        oxygen_data,
        lons,
        lats,
        depths,
        threshold
    )



    glb_path = export_glb(
        mesh,
        cache_dir
    )

    tiles_result = glb_to_3dtiles(
        glb_path,
        cache_dir
    )

    return {
        "tileset_url":
            f"/tiles/hypoxia/{cache_key}/tileset.json",

        "b3dm_url":
            f"/tiles/hypoxia/{cache_key}/0.b3dm",

        "cache_key":
            cache_key,

        "cached":
            False,

        "volume":
            volume
    }