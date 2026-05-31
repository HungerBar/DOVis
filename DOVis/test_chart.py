import sys
import os
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec

# 自动将当前目录加入环境变量
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from backend.services.eof_service import run_eof_service
except ImportError as e:
    print(f"❌ 导入失败: {e}\n💡 请确保此脚本放在 backend 文件夹的【同级目录】下运行。")
    sys.exit(1)

def plot_eof_results(mode_type="horizontal"):
    """
    调用服务层并绘制 EOF 结果
    mode_type: "horizontal" (水平切片) 或 "section" (纵向断面)
    """
    print(f"📦 正在调用后端计算 {mode_type} 模式的 EOF...")
    
    # 1. 配置测试参数
    if mode_type == "horizontal":
        test_params = {
            "dataset_id": "do_predict",
            "variable": "o2_pred",          # 溶解氧预测变量
            "time_range": [0, 240],         # 选取前151个时次
            "mode_type": "horizontal",
            "mode_num": 1,
            "slice_params": {"depth": 15} # 浅海第一层
        }
    else:  # section 剖面模式
        test_params = {
            "dataset_id": "do_predict",
            "variable": "o2_pred",
            "time_range": [0, 150],
            "mode_type": "section",
            "mode_num": 3,
            "slice_params": {"type": "lat", "value": 0.0} # 沿赤道剖面
        }

    try:
        res = run_eof_service(**test_params)
    except Exception as e:
        print(f"❌ EOF 计算报错: {e}")
        return

    # 2. 提取并准备数据
    coords = res["coords"]
    modes = res["modes"]
    pcs = np.array(res["pcs"])  # 形状: (Time, mode_num)
    mode_num = res["mode_num"]

    # 3. 创建画布布局 (上方并排画3个空间模态，下方画时间序列)
    plt.style.use('dark_background') # 使用暗色系调色盘，贴合前端大屏风格
    fig = plt.figure(figsize=(16, 10), dpi=120)
    gs = GridSpec(2, 3, height_ratios=[1.2, 1], hspace=0.3, wspace=0.25)
    
    # 确认坐标轴物理含义
    if mode_type == "horizontal":
        x_vals = np.array(coords["lon"])
        y_vals = np.array(coords["lat"])
        x_label, y_label = "Longitude (°E)", "Latitude (°N)"
        title_prefix = "Horizontal EOF"
    else:
        x_vals = np.array(coords.get("lon") if "lon" in coords else coords.get("lat"))
        y_vals = np.array(coords["depth"])
        x_label = "Longitude (°E)" if "lon" in coords else "Latitude (°N)"
        y_label = "Depth (m)"
        title_prefix = "Section EOF"

    print("🎨 正在绘制可视化图表...")
    
    # ==========================================
    # 区域一：绘制前3个 Mode 的空间模态 (Top Row)
    # ==========================================
    for i in range(mode_num):
        ax = fig.add_subplot(gs[0, i])
        mode_data = modes[i]
        
        # 将 list 转换为 numpy 数组，并处理 NaN（陆地掩膜）
        field = np.array(mode_data["field"], dtype=float)
        
        # 科学严谨性：计算绝对值最大值，强制色标关于 0 对称
        v_max_abs = max(abs(mode_data["v_min"]), abs(mode_data["v_max"]))
        if v_max_abs < 1e-6: v_max_abs = 0.1
        
        # 绘制网格伪彩图 (使用与前端一致的蓝红异常色带 RdBu_r)
        # shading='nearest' 适合格点网格，扩展可以使用 contourf
        mesh = ax.pcolormesh(x_vals, y_vals, field, 
                             cmap="RdBu_r", 
                             vmin=-v_max_abs, 
                             vmax=v_max_abs, 
                             shading='auto')
        
        # 把陆地（NaN值）背景色设为深灰色，防止穿透
        ax.set_facecolor('#2d3748') 
        
        # 剖面模式下，深海向下延伸，需要反转 Y 轴
        if mode_type == "section":
            ax.invert_yaxis()
            
        ax.set_title(f"Mode {i+1} ({mode_data['variance']*100:.2f}%)", fontsize=13, pad=10, color='#38bdf8')
        ax.set_xlabel(x_label, color='#a0aec0')
        ax.set_ylabel(y_label, color='#a0aec0')
        ax.tick_params(colors='#718096')
        
        # 每个子图右侧加一个独立的对称 Colorbar
        cbar = fig.colorbar(mesh, ax=ax, orientation='vertical', pad=0.03, shrink=0.8)
        cbar.ax.tick_params(labelsize=9, colors='#718096')

    # ==========================================
    # 区域二：绘制时间系数 PCs (Bottom Row, 跨越3列)
    # ==========================================
    ax_pc = fig.add_subplot(gs[1, :])
    colors = ['#38bdf8', '#4ade80', '#fb923c'] # 用不同高亮色区分 PC1, PC2, PC3
    
    time_steps = np.arange(pcs.shape[0])
    
    for i in range(mode_num):
        ax_pc.plot(time_steps, pcs[:, i], 
                   label=f"PC {i+1} (Variance: {modes[i]['variance']*100:.1f}%)", 
                   color=colors[i], 
                   linewidth=1.8, 
                   alpha=0.85)
        
    # 绘制一条 Y=0 的基准参考线
    ax_pc.axhline(0, color='#4a5568', linestyle='--', linewidth=1)
    
    ax_pc.set_title("Principal Components (PCs) Time Series", fontsize=13, pad=10, color='#fff')
    ax_pc.set_xlabel("Time Step (Index)", color='#a0aec0')
    ax_pc.set_ylabel("Amplitude", color='#a0aec0')
    ax_pc.tick_params(colors='#718096')
    ax_pc.grid(True, color='#2d3748', linestyle=':', alpha=0.6)
    
    # 漂亮别致的图例
    legend = ax_pc.legend(loc="upper right", frameon=True, facecolor='#1a202c', edgecolor='#4a5568')
    for text in legend.get_texts():
        text.set_color('#fff')

    # 4. 保存并展示
    fig.suptitle(f"📊 {title_prefix} Analysis Dashboard (Indian Ocean $O_2$)", fontsize=16, fontweight='bold', color='#fff', y=0.98)
    output_filename = f"eof_{mode_type}_result.png"
    plt.savefig(output_filename, bbox_inches='tight', facecolor='#0b1220')
    print(f"💾 绘图成功！图片已保存至本地: {output_filename}")
    plt.show()

if __name__ == "__main__":
    # ✨ 你可以通过修改这里的参数，分别查看 "horizontal" 或 "section" 的出图效果
    plot_eof_results(mode_type="horizontal")