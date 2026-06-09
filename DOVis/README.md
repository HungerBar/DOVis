# DOVis — 溶解氧垂直剖面分析

基于 Cesium 3D 地球的溶解氧（Dissolved Oxygen）垂直剖面与断面可视化模块。

## 功能

- **垂直剖面分析**：点击地球上任意海洋点位，查看该位置从表层到深层的溶解氧浓度变化曲线
- **断面分析**：在地图上选择多个路径点，生成 DO 浓度断面热力图
- **时间序列**：支持滑动时间轴，查看不同时间步的 DO 分布变化
- **水层标注**：自动标注混合层（0–200m）、温跃层/OMZ（200–1000m）、深层水（1000m+）

## 项目结构

```
DOVis/
├── backend/
│   ├── api/routers/profile.py    # API 路由（垂直剖面 + 断面）
│   ├── services/profile_service.py  # 业务逻辑（NetCDF 数据读取）
│   ├── schemas/profile.py        # Pydantic 数据模型
│   ├── core/dataset.py           # xarray 数据集加载器
│   ├── main.py                   # FastAPI 入口
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── modules/ProfileModule.jsx     # 模块主组件
│       ├── components/ProfileChart.jsx   # 垂直剖面 Canvas 折线图
│       ├── components/SectionChart.jsx   # 断面热力图
│       ├── components/ProfileControlPanel.jsx  # 控制面板
│       └── hooks/useProfile.js          # 状态管理
└── data/
    └── do_predict.nc             # NetCDF 数据文件（需自行放置）
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- pnpm

### 后端

```bash
cd DOVis/backend
pip install -r requirements.txt

# 确保 data/do_predict.nc 存在
cd ..
python -m uvicorn backend.main:app --host 0.0.0.0 --port 5001 --reload
```

### 前端

```bash
cd DOVis/frontend
pnpm install
pnpm dev
```

访问 http://localhost:5173

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profile/vertical?lat=&lon=&time_index=` | 获取单点 DO 垂直剖面 |
| POST | `/api/profile/section` | 获取多点断面 DO 数据 |

## 数据格式

NetCDF 文件 `do_predict.nc` 需包含以下维度与变量：

- 维度：`time`（时间步）、`depth`（深度）、`lat`（纬度）、`lon`（经度）
- 变量：`o2_pred`（溶解氧预测值，单位 mmol/m³）
