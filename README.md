# WebGIS
2026 Spring WebGIS project repository

## 6.1

### 汇总 (dev 分支) 注意事项

- 3DIsosurface
- master
- Hypoxic_Boundary_Analysis

1. 暴露端口的方式不一致, 3DIsosurface 是在前端 vite.config.js 中设置后端暴露的 api, 而 master 是在后端中定义 `CORS_ORIGINS` 暴露给前端
2. 启动方式不一致, 3DIsosurface 的启动中不显式给出启动端口(设置为 5001), 而 master 中则采用默认的 8000
3. `Hypoxic_Boundary_Analysis` 分支对应功能还没有实现, 并且接口没有在 api 中注册, 而是直接在 main.py 直接声明, 汇总时确认一下是否还是打算直接声明
