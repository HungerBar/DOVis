import sys
import os
import numpy as np

# 自动将当前目录加入环境变量，确保能够识别 backend 模块
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    # 模拟路由调用服务层
    from backend.services.eof_service import run_eof_service
except ImportError as e:
    print(f"❌ 导入失败: {e}")
    print("💡 请确保此脚本放在 backend 文件夹的【同级目录（根目录）】下运行。")
    sys.exit(1)

def run_diagnostic_test():
    print("🚀 开始对 EOF 服务层核心计算结果进行数学验证...\n")
    
    # =====================================================
    # 1. 设定测试参数（根据你的数据集结构量身定制）
    # =====================================================
    test_params = {
        "dataset_id": "do_predict",
        "variable": "o2_pred",          # 对应你信息中的溶解氧预测变量
        "time_range": [0, 100],          # 截取前101个时次进行快速验证
        "mode_type": "horizontal",       # 先测试水平切片模式
        "mode_num": 3,
        "slice_params": {"depth": 5.03}  # 选用第一层浅海深度
    }
    
    print(f"📦 测试输入参数: {test_params}")
    
    try:
        # 调用你的原版服务函数
        res = run_eof_service(**test_params)
    except Exception as e:
        print(f"❌ 运行报错: {e}")
        print("💡 请检查 backend/core/dataset.py 中的 get_ds_by_id 是否能正常读取 4GB 的 .nc 文件。")
        return

    # =====================================================
    # 2. 验证方差贡献率 (Variance Fraction)
    # =====================================================
    print("\n" + "="*50)
    print("📊 检查项 1：方差贡献率（Variance Fraction）降序验证")
    print("="*50)
    
    modes = res["modes"]
    variances = [m["variance"] for m in modes]
    
    for idx, var in enumerate(variances):
        print(f"  - Mode {idx+1} 方差贡献率: {var:.6f} ({var*100:.2f}%)")
        
    # 物理特性：方差贡献率必须单调递减
    is_descending = all(variances[i] >= variances[i+1] for i in range(len(variances)-1))
    if is_descending:
        print("  🟢 [PASS] 各模态方差贡献率严格单调递减，物理序特征正确。")
    else:
        print("  ❌ [FAIL] 警告：方差贡献率未按降序排列！请检查 eofs 算子输入。")

    # =====================================================
    # 3. 验证时间系数 (PCs) 的正交性
    # =====================================================
    print("\n" + "="*50)
    print("📉 检查项 2：时间系数（PCs）的数学正交性")
    print("="==50)
    
    pcs = np.array(res["pcs"])  # 形状为 (Time, mode_num)
    num_modes = pcs.shape[1]
    pc_ortho_ok = True
    
    for i in range(num_modes):
        for j in range(i + 1, num_modes):
            dot_prod = np.dot(pcs[:, i], pcs[:, j])
            norm_i = np.linalg.norm(pcs[:, i])
            norm_j = np.linalg.norm(pcs[:, j])
            # 计算余弦相似度（接近0代表严格正交）
            cos_sim = dot_prod / (norm_i * norm_j) if (norm_i * norm_j) > 0 else 1
            print(f"  - PC_{i+1} 与 PC_{j+1} 的点积: {dot_prod:.4e} | 余弦相似度(应接近0): {cos_sim:.4e}")
            if abs(cos_sim) > 1e-5:
                pc_ortho_ok = False
                
    if pc_ortho_ok:
        print("  🟢 [PASS] 时间序列（PCs）彼此严格交错正交，无线性相关性。")
    else:
        print("  ❌ [FAIL] 警告：PCs 之间未能实现严格正交。")

    # =====================================================
    # 4. 验证空间模态 (EOFs) 的正交性（剔除陆地 Mask）
    # =====================================================
    print("\n" + "="*50)
    print("🗺️ 检查项 3：空间模态（EOFs）在有效海域网格上的正交性")
    print("="*50)
    
    eof_ortho_ok = True
    for i in range(num_modes):
        for j in range(i + 1, num_modes):
            # 将前端风格的 tolist() 数据强转回 numpy float 数组，此时 JSON 中的 null 会自动变为 np.nan
            field_i = np.array(modes[i]["field"], dtype=float).flatten()
            field_j = np.array(modes[j]["field"], dtype=float).flatten()
            
            # 提取非陆地（非 NaN）的有效海洋网格交集
            ocean_mask = ~np.isnan(field_i) & ~np.isnan(field_j)
            valid_i = field_i[ocean_mask]
            valid_j = field_j[ocean_mask]
            
            if len(valid_i) == 0:
                print(f"  - EOF_{i+1} 与 EOF_{j+1} 未找到重合的有效海洋网格。")
                continue
                
            dot_prod = np.dot(valid_i, valid_j)
            norm_i = np.linalg.norm(valid_i)
            norm_j = np.linalg.norm(valid_j)
            cos_sim = dot_prod / (norm_i * norm_j) if (norm_i * norm_j) > 0 else 1
            
            print(f"  - EOF_{i+1} 与 EOF_{j+1} 海域点积: {dot_prod:.4e} | 余弦相似度(应接近0): {cos_sim:.4e}")
            # 空间上由于掩膜边界，允许极小的浮动误差（通常小于 1e-3）
            if abs(cos_sim) > 1e-2:
                eof_ortho_ok = False
                
    if eof_ortho_ok:
        print("  🟢 [PASS] 空间模态（EOFs）在海域网格上通过正交性校验。")
    else:
        print("  ⚠️ [WARNING] EOFs 空间正交性稍有偏差。若偏差较大，强烈建议在 solver = Eof(X) 前引入【纬度面积权重修正】。")

    print("\n" + "="*50)
    print("🎉 诊断性测试运行完毕！")
    print("="*50)

if __name__ == "__main__":
    run_diagnostic_test()