# DOVis 后端

DOVis（Dissolved Oxygen Visualization）—— 面向海洋溶解氧多维度可视化的 FastAPI 后端服务。

## 快速开始

### 1. 创建虚拟环境

```bash
cd DOVis
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 启动服务

在 `DOVis` 目录下运行：

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 5001
```

服务启动后访问 **http://127.0.0.1:5001**。

## API 文档

FastAPI 自动生成 Swagger 交互式文档：

```
http://127.0.0.1:5001/docs
```

ReDoc 格式文档：

```
http://127.0.0.1:5001/redoc
```

## 接口说明

### 健康检查

```
GET /api/health
```

示例：`http://127.0.0.1:5001/api/health`

响应：
```json
{ "status": "ok", "message": "DOVis backend is running" }
```

### 垂直剖面（单点查询）

```
GET /api/profile/vertical?lat=<纬度>&lon=<经度>&time=<时间>
```

在地图上点击某一位置，获取该位置从表层到深层的溶解氧浓度剖面数据，适合前端绘制 DO-深度折线图。

请求示例：
```
http://127.0.0.1:5001/api/profile/vertical?lat=10&lon=80&time=2024-01
```

响应示例：
```json
{
  "location": { "lat": 10.0, "lon": 80.0 },
  "time": "2024-01",
  "unit": "mmol/m3",
  "profile": [
    { "depth": 0, "oxygen": 215.2 },
    { "depth": 50, "oxygen": 206.3 },
    { "depth": 100, "oxygen": 190.4 },
    { "depth": 500, "oxygen": 52.6 },
    { "depth": 1000, "oxygen": 76.4 },
    { "depth": 6000, "oxygen": 148.2 }
  ]
}
```

标准深度层：0、10、25、50、75、100、150、200、300、500、1000、2000、4000、6000 米。

### 断面剖面（多点路径查询）

```
POST /api/profile/section
```

在海图上绘制一条跨区域路径，返回沿路径各采样点的多深度溶解氧数据，适合前端绘制深度-距离热力图。

请求体：
```json
{
  "points": [
    { "lat": 10.0, "lon": 80.0 },
    { "lat": 10.5, "lon": 81.0 },
    { "lat": 11.0, "lon": 82.0 }
  ],
  "time": "2024-01"
}
```

响应包含每个采样剖面沿路径的距离（`distance_km`）、深度（`depth`）和溶解氧浓度（`oxygen`）。

### curl 测试命令

```bash
curl "http://127.0.0.1:5001/api/health"
curl "http://127.0.0.1:5001/api/profile/vertical?lat=10&lon=80&time=2024-01"
curl -X POST "http://127.0.0.1:5001/api/profile/section" \
  -H "Content-Type: application/json" \
  -d '{"points":[{"lat":10,"lon":80},{"lat":11,"lon":82}],"time":"2024-01"}'
```

## 项目结构

```
DOVis/
└── backend/
    ├── app/
    │   ├── main.py                    # FastAPI 应用入口，CORS 配置及路由注册
    │   ├── api/
    │   │   └── profile.py             # 接口路由处理（health / vertical / section）
    │   ├── core/
    │   │   └── config.py              # 集中配置管理（支持 DOVIS_ 环境变量前缀）
    │   ├── schemas/
    │   │   └── profile.py             # Pydantic 请求/响应模型（自动校验）
    │   ├── services/
    │   │   └── profile_service.py     # 核心业务逻辑：DO 剖面生成与路径插值
    │   └── data/
    │       └── sample_do_profile.csv  # 示例 DO-深度数据
    ├── requirements.txt
    └── README.md
```

## 数据层设计

Service 层设计为可插拔架构，当前使用模拟数据，后续可直接替换为真实 NetCDF 数据而无需改动 API 层：

- `profile_service.py` 封装了所有数据访问逻辑，对外暴露 `get_vertical_profile()` 和 `get_section_profile()`
- 当前阶段：基于经纬度种子的随机模拟函数（遵循真实海洋溶解氧垂向分布规律）
- 接入真实数据时：将模拟函数替换为 `xarray.open_dataset()` 读取 Copernicus Marine 的 `.nc` 文件即可
- API 接口、Schema 定义、响应格式均无需更改

### 模拟数据特征

模拟函数遵循海洋学中溶解氧垂直分布的典型规律：
- **表层（0-100m）**：混合层，溶解氧浓度较高（~200-230 mmol/m³），缓慢下降
- **温跃层（100-400m）**：浓度加速下降，向最小含氧带过渡
- **最小含氧带（300-1000m）**：浓度最低（~45-100 mmol/m³）
- **深层（1000-6000m）**：底层冷水团含氧量逐步回升
- **空间差异**：不同经纬度位置产出的剖面各不相同，基于确定性种子确保同一位置可复现

## CORS 跨域配置

已允许以下前端开发地址的跨域请求：

- `http://localhost:5173`
- `http://127.0.0.1:5173`

如需添加其他来源，可通过环境变量 `DOVIS_CORS_ORIGINS` 或直接修改 `backend/app/core/config.py`。
