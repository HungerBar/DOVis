import numpy as np
from pyproj import Transformer
from backend.core.dataset import get_ds
import pyvista as pv

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

    return (
        np.linalg.norm(
            np.cross(
                b - a,
                c - a,
            )
        )
        * 0.5
    )


def find_non_collinear_points(
    verts_ecef,
    min_area=1e3,
):

    n = len(verts_ecef)

    if n < 3:
        raise ValueError("Not enough vertices")

    # -----------------------------------------------------
    # initial guess
    # -----------------------------------------------------

    idx0 = 0
    idx1 = n // 3
    idx2 = 2 * n // 3

    p0 = verts_ecef[idx0]
    p1 = verts_ecef[idx1]
    p2 = verts_ecef[idx2]

    area = triangle_area(
        p0,
        p1,
        p2,
    )

    if area > min_area:

        return (
            np.array([p0, p1, p2]),
            [idx0, idx1, idx2],
        )

    # -----------------------------------------------------
    # brute-force sparse search
    # -----------------------------------------------------

    step = max(1, n // 50)

    for i in range(0, n, step):

        for j in range(i + 1, n, step):

            for k in range(j + 1, n, step):

                a = verts_ecef[i]
                b = verts_ecef[j]
                c = verts_ecef[k]

                area = triangle_area(
                    a,
                    b,
                    c,
                )

                if area > min_area:

                    return (
                        np.array([a, b, c]),
                        [i, j, k],
                    )

    raise ValueError("Could not find non-collinear points")


# =========================================================
# main
# =========================================================


def run_marching_cubes_ecef(
    time_idx: int,
    iso_value: float,
    verbose=True,
):

    ds = get_ds()

    # =====================================================
    # 1. load volume
    # =====================================================

    vol = ds["o2_pred"].isel(time=time_idx).values

    depth = ds.depth.values
    lat = ds.lat.values
    lon = ds.lon.values

    vol = np.nan_to_num(
        vol,
        nan=np.nanmin(vol) - 1.0,
    )

    nz, ny, nx = vol.shape

    # =====================================================
    # 2. build structured grid
    # =====================================================

    grid = pv.ImageData()

    grid.dimensions = (
        nx,
        ny,
        nz,
    )

    grid.spacing = (
        1.0,
        1.0,
        1.0,
    )

    # IMPORTANT:
    # PyVista/VTK internally uses Fortran order

    grid.point_data["field"] = vol.transpose(2, 1, 0).ravel(order="F")

    # =====================================================
    # 3. marching cubes
    # =====================================================

    mesh = grid.contour(isosurfaces=[iso_value])

    verts = np.asarray(mesh.points)

    faces = mesh.faces.reshape(-1, 4)[:, 1:4]

    if len(verts) == 0:
        raise ValueError("Empty contour mesh")

    # =====================================================
    # 4. index space -> geographic coords
    # =====================================================

    ix = verts[:, 0]
    iy = verts[:, 1]
    iz = verts[:, 2]

    # -----------------------------------------------------
    # NOTE:
    # Depending on VTK axis conventions,
    # you may need:
    #
    # lat <- iz
    # h   <- iy
    #
    # if orientation looks wrong
    # -----------------------------------------------------

    lon_v = np.interp(
        ix,
        np.arange(nx),
        lon,
    )

    lat_v = np.interp(
        iy,
        np.arange(ny),
        lat,
    )

    # ocean depth -> ellipsoidal height

    h_v = -np.interp(
        iz,
        np.arange(nz),
        depth,
    )

    # =====================================================
    # 5. geographic -> ECEF
    # =====================================================

    x, y, z = to_ecef.transform(
        lon_v,
        lat_v,
        h_v,
    )

    verts_ecef = np.vstack(
        [
            x,
            y,
            z,
        ]
    ).T

    # =====================================================
    # OPTIONAL:
    # handedness / axis debugging
    # =====================================================

    DEBUG_TRANSFORM = None

    if DEBUG_TRANSFORM == "swap_yz":

        verts_ecef = verts_ecef[:, [0, 2, 1]]

    elif DEBUG_TRANSFORM == "swap_xyz":

        verts_ecef = verts_ecef[:, [1, 2, 0]]

    elif DEBUG_TRANSFORM == "flip_x":

        verts_ecef[:, 0] *= -1

    elif DEBUG_TRANSFORM == "flip_y":

        verts_ecef[:, 1] *= -1

    elif DEBUG_TRANSFORM == "flip_z":

        verts_ecef[:, 2] *= -1

    elif DEBUG_TRANSFORM == "left_to_right":

        verts_ecef = np.column_stack(
            [
                verts_ecef[:, 0],
                verts_ecef[:, 2],
                -verts_ecef[:, 1],
            ]
        )

    # =====================================================
    # 6. bounding sphere
    # =====================================================

    center = np.array(
        [0.0, 0.0, 0.0],
        dtype=np.float64,
    )

    radius = float(
        np.linalg.norm(
            verts_ecef,
            axis=1,
        ).max()
    )

    # =====================================================
    # 7. choose 3 non-collinear control points
    # =====================================================

    control_src, control_indices = find_non_collinear_points(verts_ecef)

    control_dst = control_src.copy()

    # =====================================================
    # 8. debug output
    # =====================================================

    if verbose:

        centroid = np.mean(
            verts_ecef,
            axis=0,
        )

        lon_c, lat_c, h_c = to_geo.transform(
            centroid[0],
            centroid[1],
            centroid[2],
        )

        print("\n====================================")

        print("PYVISTA MC RESULT")

        print("====================================")

        print("vertices:", len(verts_ecef))

        print("faces:", len(faces))

        # -------------------------------------------------
        # bounding sphere
        # -------------------------------------------------

        print("\nBOUNDING SPHERE")

        print("center:", center)

        print("radius:", radius)

        # -------------------------------------------------
        # centroid
        # -------------------------------------------------

        print("\nMESH CENTROID")

        print("ECEF:", centroid)

        print("lon:", lon_c)

        print("lat:", lat_c)

        print("height:", h_c)

        # -------------------------------------------------
        # control points
        # -------------------------------------------------

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

            print(f"VERTEX INDEX : " f"{control_indices[i]}")

            print("ECEF : " f"X={src[0]:.6f}, " f"Y={src[1]:.6f}, " f"Z={src[2]:.6f}")

            print(
                "GEO  : " f"lon={lon_p:.6f}, " f"lat={lat_p:.6f}, " f"height={h_p:.3f}"
            )

        # -------------------------------------------------
        # triangle area
        # -------------------------------------------------

        area = triangle_area(
            control_src[0],
            control_src[1],
            control_src[2],
        )

        print("\nTRIANGLE AREA")

        print(f"{area:.6f} m²")

    # =====================================================
    # 9. metadata
    # =====================================================

    meta = {
        "frame": "ECEF",
        "bounding_sphere": {
            "center": center.tolist(),
            "radius": radius,
        },
        "vertices": len(verts_ecef),
        "faces": len(faces),
        "control_points": [
            {
                "id": i,
                "vertex_index": int(control_indices[i]),
                "source_ecef": control_src[i].tolist(),
                "target_ecef": control_dst[i].tolist(),
            }
            for i in range(3)
        ],
        "note": "ECEF mesh with non-collinear control points",
    }

    return (
        verts_ecef,
        faces,
        meta,
    )
