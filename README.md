# WebGIS

2026 Spring WebGIS project repository


## 6.1

### 汇总: 

- 3DIsosurface
- master
- 

1. 暴露端口的方式不一致, 3DIsosurface 是在前端 vite.config.js 中设置后端暴露的 api, 而 master 是在后端中定义 `CORS_ORIGINS` 暴露给前端
2. 启动方式不一致, 3DIsosurface 的启动中不显式给出启动端口(设置为 5001), 而 master 中则采用默认的 8000
