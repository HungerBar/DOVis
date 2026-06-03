from backend.isoExport.tileset_export import export_tileset


def build_tileset_service(
    time_index: int,
    iso_value: float,
):

    return export_tileset(
        time_idx=time_index,
        iso_value=iso_value,
    )
