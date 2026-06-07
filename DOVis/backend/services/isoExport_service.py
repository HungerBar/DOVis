from backend.core.dataset import get_ds

from backend.isoGeometry.iso_surface import build_iso_surface_product


def export_iso_surface_field(
    time_index: int,
    iso_value: float,
):

    ds = get_ds()
    # time slice
    ds_t = ds.isel(time=time_index)

    # full pipeline
    path = build_iso_surface_product(
        ds_t,
        iso_value,
        var_name="o2_pred",
        depth_name="depth",
    )

    return path
