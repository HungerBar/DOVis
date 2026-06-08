import numpy as np
import trimesh


def z_up_to_gltf_y_up(vertices):
    """
    Convert desired 3D Tiles local z-up coordinates to glTF y-up coordinates.

    Desired local coordinate:
        p = (x, y, z)

    Stored glTF coordinate:
        q = (x, z, -y)

    Cesium loads glTF as y-up, then converts it into its runtime z-up space.
    After that conversion, q maps back to p.
    """

    vertices = np.asarray(vertices, dtype=np.float64)

    return np.column_stack(
        [
            vertices[:, 0],
            vertices[:, 2],
            -vertices[:, 1],
        ]
    )


def duplicate_faces_for_double_sided(faces):
    """
    Make mesh visible from both sides.

    This avoids relying on glTF material doubleSided support.
    """

    faces = np.asarray(faces, dtype=np.uint32)

    reversed_faces = faces[:, [0, 2, 1]]

    return np.vstack(
        [
            faces,
            reversed_faces,
        ]
    ).astype(np.uint32)


def export_glb(
    vertices,
    faces,
    path,
    origin=None,
    double_sided=True,
):
    """
    Export mesh to GLB.

    Parameters
    ----------
    vertices : np.ndarray
        Local z-up vertices, shape (N, 3).
        These should NOT be absolute ECEF vertices.
    faces : np.ndarray
        Triangle indices, shape (M, 3).
    path : str
        Output .glb path.
    origin : None
        Kept for compatibility with older calls.
        Do not use origin here; localization is handled in tileset_service.py.
    double_sided : bool
        Whether to duplicate reversed faces.
    """

    vertices = np.asarray(vertices, dtype=np.float64)
    faces = np.asarray(faces, dtype=np.uint32)

    if vertices.ndim != 2 or vertices.shape[1] != 3:
        raise ValueError(f"Invalid vertices shape: {vertices.shape}")

    if faces.ndim != 2 or faces.shape[1] != 3:
        raise ValueError(f"Invalid faces shape: {faces.shape}")

    if len(vertices) == 0:
        raise ValueError("Empty vertices")

    if len(faces) == 0:
        raise ValueError("Empty faces")

    if not np.all(np.isfinite(vertices)):
        raise ValueError("Vertices contain NaN or Inf")

    if not np.all(np.isfinite(faces)):
        raise ValueError("Faces contain NaN or Inf")

    # Keep old interface compatibility.
    # In the new pipeline, origin should normally be None.
    if origin is not None:
        origin = np.asarray(origin, dtype=np.float64)
        vertices = vertices - origin

    # Convert local z-up to glTF y-up.
    gltf_vertices = z_up_to_gltf_y_up(vertices).astype(np.float32)

    if double_sided:
        export_faces = duplicate_faces_for_double_sided(faces)
    else:
        export_faces = faces

    mesh = trimesh.Trimesh(
        vertices=gltf_vertices,
        faces=export_faces,
        process=False,
    )
    mesh.visual.face_colors = [0, 180, 255, 180]

    mesh.export(path)
