import os
import struct
import numpy as np
import trimesh


def _repair_glb_chunk_lengths(glb_bytes: bytes) -> bytes:
    if len(glb_bytes) < 20:
        raise ValueError('GLB bytes too short for header')

    magic, version, glb_length = struct.unpack('<4sII', glb_bytes[:12])
    if magic != b'glTF':
        raise ValueError('Invalid GLB magic header')
    if version != 2:
        raise ValueError('Unsupported GLB version: %s' % version)
    if glb_length != len(glb_bytes):
        raise ValueError('GLB length mismatch: %s != %s' % (glb_length, len(glb_bytes)))

    json_chunk_length = struct.unpack('<I', glb_bytes[12:16])[0]
    actual_bin_length = len(glb_bytes) - 20 - json_chunk_length - 8

    if actual_bin_length < 0:
        raise ValueError('Invalid GLB binary length computed: %s' % actual_bin_length)

    bin_length = struct.unpack('<I', glb_bytes[20 + json_chunk_length:24 + json_chunk_length])[0]
    if bin_length != actual_bin_length:
        repaired = bytearray(glb_bytes)
        repaired[24 + json_chunk_length:28 + json_chunk_length] = struct.pack('<I', actual_bin_length)
        print('====================================')
        print('GLB repair: corrected BIN chunk length', bin_length, '->', actual_bin_length)
        print('====================================')
        return bytes(repaired)

    return glb_bytes


def export_glb(vertices, faces, path=None, origin=None):
    """
    Export Cesium-compatible GLB (ECEF coordinates)

    IMPORTANT:
    - vertices MUST already be in ECEF (meters)
    - NO ENU, NO local transform
    - NO coordinate conversion
    """

    # =========================================================
    # 1. input check
    # =========================================================
    vertices = np.asarray(vertices, dtype=np.float64)
    faces = np.asarray(faces, dtype=np.uint32)

    if len(vertices) == 0 or len(faces) == 0:
        raise ValueError("Empty mesh input")

    # =========================================================
    # 2. vertex colors (debug only)
    # =========================================================
    YELLOW = np.array([255, 255, 0, 255], dtype=np.uint8)
    colors = np.tile(YELLOW, (len(vertices), 1))

    # =========================================================
    # 3. build mesh (NO processing)
    # =========================================================
    mesh = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        vertex_colors=colors,
        process=False,
        validate=False,
    )

    # =========================================================
    # 4. normals (safe, no geometry modification)
    # =========================================================
    _ = mesh.vertex_normals

    # =========================================================
    # 5. minimal cleanup ONLY (ECEF-safe)
    # =========================================================
    mesh.remove_degenerate_faces()

    # ⚠️ IMPORTANT:
    # do NOT remove_unreferenced_vertices in scientific meshes blindly
    # it may break topology consistency after MC
    # mesh.remove_unreferenced_vertices()

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
    # 6.1. repair chunk lengths if trimesh produced an invalid GLB header
    # =========================================================
    glb_bytes = _repair_glb_chunk_lengths(glb_bytes)

    # =========================================================
    # 7. save
    # =========================================================
    if path is not None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(glb_bytes)

    # =========================================================
    # 8. debug info (ECEF SPACE)
    # =========================================================
    print("====================================")
    print("GLB export success (ECEF MODE)")
    print("vertices:", len(mesh.vertices))
    print("faces:", len(mesh.faces))

    vmin = mesh.vertices.min(axis=0)
    vmax = mesh.vertices.max(axis=0)

    print("ECEF X range:", vmin[0], "~", vmax[0])
    print("ECEF Y range:", vmin[1], "~", vmax[1])
    print("ECEF Z range:", vmin[2], "~", vmax[2])

    if origin is not None:
        print("origin (debug only):", origin)

    print("glb size:", len(glb_bytes))
    print("====================================")

    return glb_bytes
