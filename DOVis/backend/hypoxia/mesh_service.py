from skimage.measure import marching_cubes
from pyproj import Transformer
import trimesh
import numpy as np


def generate_mesh(
    oxygen_data,
    lons,
    lats,
    depths,
    threshold
):
    # -------------------------
    # 1. mask
    # -------------------------
    mask = oxygen_data < threshold

    if np.sum(mask) == 0:
        raise ValueError(f"未找到低于 {threshold} 的区域")

    # -------------------------
    # 2. marching cubes
    # -------------------------
    verts, faces, normals, values = marching_cubes(
        mask.astype(np.uint8),
        level=0.5
    )

    # -------------------------
    # 3. index -> real coord
    # -------------------------
    z_idx = verts[:, 0]
    y_idx = verts[:, 1]
    x_idx = verts[:, 2]

    lon_real = np.interp(x_idx, np.arange(len(lons)), lons)
    lat_real = np.interp(y_idx, np.arange(len(lats)), lats)
    depth_real = np.interp(z_idx, np.arange(len(depths)), depths)

    # 海面以下
    height = -depth_real

    # -------------------------
    # 4. projection (WGS84 → ECEF)
    # -------------------------
    transformer = Transformer.from_crs(
        "EPSG:4326",
        "EPSG:4978",
        always_xy=True
    )

    X, Y, Z = transformer.transform(
        lon_real,
        lat_real,
        height
    )

    vertices = np.column_stack([X, Y, Z])

    # -------------------------
    # 5. clean mesh (关键修复点)
    # -------------------------
    vertices = np.nan_to_num(vertices)
    
    # 验证 vertices 是否有效（不全是 NaN）
    if np.all(np.isnan(vertices)):
        raise ValueError("mesh vertices are all NaN after coordinate transformation")

    # 创建 mesh 时自动修复
    mesh = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        process=True  #  自动修复退化三角形
    )

    # -------------------------
    # 6. validation（替代你原来的print）
    # -------------------------
    if len(mesh.vertices) == 0 or len(mesh.faces) == 0:
        raise ValueError("mesh生成失败（空mesh）")
    
    # 额外检查：确保没有无效的面索引
    if np.any(mesh.faces >= len(mesh.vertices)):
        raise ValueError("mesh has invalid face indices pointing beyond vertex count")
    
    # 检查顶点是否有 NaN 或 Inf
    if not np.all(np.isfinite(mesh.vertices)):
        print("[WARN] mesh vertices contain NaN or Inf, attempting to clean...")
        mesh.vertices = np.nan_to_num(mesh.vertices)
        if not np.all(np.isfinite(mesh.vertices)):
            raise ValueError("mesh vertices still contain invalid values after cleanup")

    if not mesh.is_watertight:
        print("[WARN] mesh不是封闭曲面（正常现象）")

    # -------------------------
    # 7. volume（简单估计）
    # -------------------------
    volume = float(np.sum(mask))

    print("mesh OK:",
          mesh.vertices.shape,
          mesh.faces.shape)

    print("bounds:", mesh.bounds)

    return mesh, volume