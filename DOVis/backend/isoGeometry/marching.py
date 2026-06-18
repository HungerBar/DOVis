import numpy as np
import pyvista as pv
from pyproj import Transformer

from backend.core.dataset import get_ds

# =========================================================
# CRS transforms
# =========================================================

to_ecef = Transformer.from_crs(
    "EPSG:4979",
    "EPSG:4978",
    always_xy=True,
)

to_geo = Transformer.from_crs(
    "EPSG:4978",
    "EPSG:4979",
    always_xy=True,
)


# =========================================================
# geometry helpers
# =========================================================


def triangle_area(a, b, c):
    return 0.5 * np.linalg.norm(np.cross(b - a, c - a))


def find_non_collinear_points(
    verts_ecef,
    min_area=1e3,
):
    n = len(verts_ecef)

    if n < 3:
        raise ValueError("Not enough vertices")

    idx0 = 0
    idx1 = n // 3
    idx2 = 2 * n // 3

    p0 = verts_ecef[idx0]
    p1 = verts_ecef[idx1]
    p2 = verts_ecef[idx2]

    area = triangle_area(p0, p1, p2)

    if area > min_area:
        return (
            np.array([p0, p1, p2]),
            [idx0, idx1, idx2],
        )

    step = max(1, n // 50)

    for i in range(0, n, step):
        for j in range(i + 1, n, step):
            for k in range(j + 1, n, step):
                a = verts_ecef[i]
                b = verts_ecef[j]
                c = verts_ecef[k]

                area = triangle_area(a, b, c)

                if area > min_area:
                    return (
                        np.array([a, b, c]),
                        [i, j, k],
                    )

    raise ValueError("Could not find non-collinear points")


def build_valid_cell_mask(valid_xyz):
    """
    Build valid-cell mask for a StructuredGrid.

    Parameters
    ----------
    valid_xyz : np.ndarray
        Boolean array with shape (nx, ny, nz).

    Returns
    -------
    np.ndarray
        Boolean array with shape (nx - 1, ny - 1, nz - 1).
        True means all 8 corner points of the cell are valid.
    """

    return (
        valid_xyz[:-1, :-1, :-1]
        & valid_xyz[1:, :-1, :-1]
        & valid_xyz[:-1, 1:, :-1]
        & valid_xyz[1:, 1:, :-1]
        & valid_xyz[:-1, :-1, 1:]
        & valid_xyz[1:, :-1, 1:]
        & valid_xyz[:-1, 1:, 1:]
        & valid_xyz[1:, 1:, 1:]
    )


# =========================================================
# main
# =========================================================


def run_marching_cubes_ecef(
    time_idx: int,
    iso_value: float,
    verbose=True,
):
    """
    Extract iso-surface directly on an ECEF StructuredGrid.

    Interface is unchanged:

        verts_ecef, faces, meta = run_marching_cubes_ecef(
            time_idx,
            iso_value,
            verbose=True,
        )

    Returns
    -------
    verts_ecef : np.ndarray
        Shape (N, 3), absolute ECEF coordinates.
    faces : np.ndarray
        Shape (M, 3), triangle indices.
    meta : dict
        Metadata for tileset export.
    """

    ds = get_ds()

    # =====================================================
    # 1. load volume
    # =====================================================

    raw_vol = ds["o2_pred"].isel(time=time_idx).values.astype(np.float32)

    depth = ds.depth.values.astype(np.float64)
    lat = ds.lat.values.astype(np.float64)
    lon = ds.lon.values.astype(np.float64)

    # raw_vol: (depth, lat, lon) = (nz, ny, nx)
    nz, ny, nx = raw_vol.shape

    # =====================================================
    # 2. convert scalar field to VTK order
    # =====================================================
    #
    # Source:
    #   raw_vol[k, j, i] -> (depth, lat, lon)
    #
    # StructuredGrid:
    #   field_xyz[i, j, k] -> (lon, lat, depth)
    #
    # VTK expects x-fastest ordering, so we use ravel(order="F").
    # =====================================================

    field_xyz = raw_vol.transpose(2, 1, 0)  # (nx, ny, nz)
    valid_xyz = np.isfinite(field_xyz)

    field_xyz_filled = np.where(
        valid_xyz,
        field_xyz,
        iso_value,
    ).astype(np.float32)

    # =====================================================
    # 3. build ECEF StructuredGrid
    # =====================================================

    lon3, lat3, depth3 = np.meshgrid(
        lon,
        lat,
        depth,
        indexing="ij",
    )

    height3 = -depth3

    x, y, z = to_ecef.transform(
        lon3.ravel(order="F"),
        lat3.ravel(order="F"),
        height3.ravel(order="F"),
    )

    points = np.column_stack([x, y, z]).astype(np.float64)

    grid = pv.StructuredGrid()
    grid.dimensions = (
        nx,
        ny,
        nz,
    )
    grid.points = points

    grid.point_data["field"] = field_xyz_filled.ravel(order="F")

    # =====================================================
    # 4. hide invalid cells
    # =====================================================

    valid_cell = build_valid_cell_mask(valid_xyz)
    invalid_cell_ids = np.flatnonzero((~valid_cell).ravel(order="F"))

    if len(invalid_cell_ids) > 0:
        grid = grid.hide_cells(invalid_cell_ids)

    # =====================================================
    # 5. contour / marching cubes
    # =====================================================

    mesh = grid.contour(
        isosurfaces=[float(iso_value)],
        scalars="field",
    )

    if mesh.n_points == 0 or mesh.n_cells == 0:
        raise ValueError(
            f"Empty contour mesh for iso_value={iso_value}, time_idx={time_idx}"
        )

    mesh = mesh.triangulate()
    mesh = mesh.clean(tolerance=0.0)

    verts_ecef = np.asarray(mesh.points, dtype=np.float64)

    faces_raw = mesh.faces.reshape(-1, 4)

    if not np.all(faces_raw[:, 0] == 3):
        raise ValueError("Contour mesh contains non-triangle faces.")

    faces = faces_raw[:, 1:4].astype(np.uint32)

    # =====================================================
    # 6. bounding sphere
    # =====================================================

    center = verts_ecef.mean(axis=0).astype(np.float64)

    radius = float(
        np.linalg.norm(
            verts_ecef - center,
            axis=1,
        ).max()
    )

    # =====================================================
    # 7. control points
    # =====================================================

    control_src, control_indices = find_non_collinear_points(verts_ecef)
    control_dst = control_src.copy()

    # =====================================================
    # 8. debug output
    # =====================================================

    if verbose:
        lon_v, lat_v, h_v = to_geo.transform(
            verts_ecef[:, 0],
            verts_ecef[:, 1],
            verts_ecef[:, 2],
        )

        lon_c, lat_c, h_c = to_geo.transform(
            center[0],
            center[1],
            center[2],
        )

        print("\n====================================")
        print("PYVISTA ECEF STRUCTUREDGRID RESULT")
        print("====================================")

        print("vertices:", len(verts_ecef))
        print("faces:", len(faces))

        print("\nSOURCE DATA")
        print("volume shape:", raw_vol.shape)
        print("lon range:", float(lon.min()), float(lon.max()))
        print("lat range:", float(lat.min()), float(lat.max()))
        print("depth range:", float(depth.min()), float(depth.max()))

        print("\nMESH GEO RANGE")
        print("lon range:", float(np.nanmin(lon_v)), float(np.nanmax(lon_v)))
        print("lat range:", float(np.nanmin(lat_v)), float(np.nanmax(lat_v)))
        print("height range:", float(np.nanmin(h_v)), float(np.nanmax(h_v)))
        print("depth range:", float(np.nanmin(-h_v)), float(np.nanmax(-h_v)))

        print("\nBOUNDING SPHERE")
        print("center:", center)
        print("radius:", radius)
        print("center lon:", lon_c)
        print("center lat:", lat_c)
        print("center height:", h_c)

        print("\nVALIDITY")
        print("invalid points:", int(np.size(valid_xyz) - np.count_nonzero(valid_xyz)))
        print("invalid cells:", int(len(invalid_cell_ids)))

        print("\n====================================")
        print("CONTROL POINTS")
        print("====================================")

        for i in range(3):
            src = control_src[i]

            lon_p, lat_p, h_p = to_geo.transform(
                src[0],
                src[1],
                src[2],
            )

            print(f"\nP{i}")
            print(f"VERTEX INDEX : {control_indices[i]}")
            print("ECEF : " f"X={src[0]:.6f}, " f"Y={src[1]:.6f}, " f"Z={src[2]:.6f}")
            print(
                "GEO  : "
                f"lon={lon_p:.6f}, "
                f"lat={lat_p:.6f}, "
                f"height={h_p:.3f}, "
                f"depth={-h_p:.3f}"
            )

        area = triangle_area(
            control_src[0],
            control_src[1],
            control_src[2],
        )

        print("\nTRIANGLE AREA")
        print(f"{area:.6f} m^2")

    # =====================================================
    # 9. metadata
    # =====================================================

    meta = {
        "frame": "ECEF",
        "bounding_sphere": {
            "center": center.tolist(),
            "radius": radius,
        },
        "vertices": int(len(verts_ecef)),
        "faces": int(len(faces)),
        "control_points": [
            {
                "id": int(i),
                "vertex_index": int(control_indices[i]),
                "source_ecef": control_src[i].tolist(),
                "target_ecef": control_dst[i].tolist(),
            }
            for i in range(3)
        ],
        "note": "ECEF StructuredGrid contour with invalid cells hidden",
    }

    return (
        verts_ecef,
        faces,
        meta,
    )
