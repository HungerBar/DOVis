import os
import json
import trimesh


def export_glb(
    mesh,
    output_dir: str,
    filename: str = "boundary.glb"
) -> str:
    """
    将 trimesh mesh 导出为 GLB 文件

    Parameters
    ----------
    mesh : trimesh.Trimesh
    output_dir : str
    filename : str

    Returns
    -------
    glb_path : str
    """

    os.makedirs(output_dir, exist_ok=True)

    glb_path = os.path.join(output_dir, filename)

    # 如果 mesh 为空，直接报错（非常关键）
    if mesh is None or len(mesh.vertices) == 0:
        raise ValueError("mesh is empty, cannot export GLB")

    if len(mesh.faces) == 0:
        raise ValueError("mesh has no faces, cannot export GLB")

    # 复制 mesh 以避免修改原始数据
    export_mesh = mesh.copy()
    
    # 对于 ECEF 坐标（百万米级别），先居中到原点以提高 Blender 兼容性
    # 但保存原始包围盒信息用于后续定位
    center = export_mesh.bounds.mean(axis=0)
    print(f"[INFO] Mesh center: {center}, bounds: {export_mesh.bounds}")
    
    # 平移到原点（便于 Blender 显示）
    print(mesh.vertices[:5])

    # 显式指定 GLB 格式并验证导出
    try:
        export_mesh.export(glb_path, file_type="glb")
        
        # 验证文件是否成功生成
        if not os.path.exists(glb_path) or os.path.getsize(glb_path) == 0:
            raise ValueError(f"GLB export failed: file is empty or not created")
        
        print(f"[OK] GLB exported: {glb_path} ({os.path.getsize(glb_path)} bytes)")
        print(f"[INFO] Note: Coordinates centered at {center} for Blender compatibility")
        
    except Exception as e:
        raise RuntimeError(f"GLB export error: {e}")

    return glb_path

# ----------------------------
# 1. GLB → 3D Tiles
# ----------------------------

def glb_to_3dtiles( 
    glb_path: str,
    output_dir: str
):

    tileset_path = os.path.join(output_dir, "tileset.json")
    out_glb_path = os.path.join(output_dir, "boundary.glb")

    # -------------------------
    # 读取 GLB，计算 center
    # -------------------------
    mesh = trimesh.load(glb_path, force='mesh')

    if mesh is None or len(mesh.vertices) == 0:
        raise ValueError("GLB is empty")

    center = mesh.bounds.mean(axis=0)

    print("[INFO] GLB center:", center)

    # -------------------------
    # 平移到局部坐标（Blender友好）
    # -------------------------
    mesh.apply_translation(-center)

    mesh.export(out_glb_path)

    # -------------------------
    # 写 tileset.json（关键修改）
    # -------------------------
    tileset = {
        "asset": {
            "version": "1.1"
        },
        "geometricError": 5000,
        "root": {
            "boundingVolume": {
                "box": [
                    0, 0, 0,
                    1, 0, 0,
                    0, 1, 0,
                    0, 0, 1
                ]
            },
            "geometricError": 0,
            "refine": "ADD",

            # ⭐⭐⭐关键修复点
            "transform": [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                float(center[0]),
                float(center[1]),
                float(center[2]),
                1
            ],

            "content": {
                "uri": "boundary.glb"
            }
        }
    }

    with open(tileset_path, "w", encoding="utf-8") as f:
        json.dump(tileset, f, indent=2)

    return {
        "tileset_path": tileset_path,
        "glb_path": out_glb_path,
        "center": center.tolist()
    }

# ----------------------------
# 2. fallback tileset.json
# ----------------------------
