import os
import numpy as np
import trimesh


def export_glb(vertices, faces, path=None, origin=None):
    """
    Export Cesium-compatible GLB (LOCAL ENU coordinates)

    IMPORTANT:
    - vertices MUST be in ENU (meters)
    - origin is used only for debugging / external metadata
    """

    # =========================================================
    # 1. input check
    # =========================================================
    vertices = np.asarray(vertices, dtype=np.float64)
    faces = np.asarray(faces, dtype=np.uint32)

    if len(vertices) == 0 or len(faces) == 0:
        raise ValueError("Empty mesh input")

    # =========================================================
    # 2. vertex colors (debug)
    # =========================================================
    YELLOW = np.array([255, 255, 0, 255], dtype=np.uint8)
    colors = np.tile(YELLOW, (len(vertices), 1))

    # =========================================================
    # 3. CRITICAL: NO GEOMETRY PROCESSING
    # =========================================================
    mesh = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        vertex_colors=colors,
        process=False,
        validate=False,
    )

    # =========================================================
    # 4. normals (safe, no vertex modification)
    # =========================================================
    _ = mesh.vertex_normals

    # =========================================================
    # 5. cleanup (safe subset only)
    # =========================================================
    mesh.remove_degenerate_faces()
    mesh.remove_unreferenced_vertices()

    if len(mesh.vertices) == 0:
        raise ValueError("Mesh has no valid vertices after cleanup.")
    if len(mesh.faces) == 0:
        raise ValueError("Mesh has no valid faces after cleanup.")

    # =========================================================
    # 6. export GLB
    # =========================================================
    glb_bytes = mesh.export(file_type="glb")

    if isinstance(glb_bytes, memoryview):
        glb_bytes = glb_bytes.tobytes()

    if not isinstance(glb_bytes, (bytes, bytearray)):
        raise TypeError("GLB export did not return bytes.")

    # =========================================================
    # 7. save
    # =========================================================
    if path is not None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(glb_bytes)

    # =========================================================
    # 8. debug info (LOCAL SPACE)
    # =========================================================
    print("====================================")
    print("GLB export success (LOCAL ENU MODE)")
    print("vertices:", len(mesh.vertices))
    print("faces:", len(mesh.faces))

    vmin = mesh.vertices.min(axis=0)
    vmax = mesh.vertices.max(axis=0)

    print("ENU X (East) range:", vmin[0], "~", vmax[0])
    print("ENU Y (North) range:", vmin[1], "~", vmax[1])
    print("ENU Z (Up) range:", vmin[2], "~", vmax[2])

    if origin is not None:
        print("origin (lon, lat, h):", origin)

    print("glb size:", len(glb_bytes))
    print("====================================")

    return glb_bytes
