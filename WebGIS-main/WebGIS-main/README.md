# WebGIS
2026 Spring WebGIS project repository

## 6.1

### dev work

- 3DIsosurface, backend-eof
- master
- Hypoxic_Boundary_Analysis

1. 端口不一致, 建议统一启动端口为 5001, 跟 vite.config 中相配合
2. 启动目录不一致, 建议统一为 `\DOVis` 目录下启动, 启动命令可以是 `uvicorn backend.main:app --port 5001 --reload`, 也可以在 `main.py` 中调整依赖 (import 语句) 支持 `python -m backend.main` 启动
3. `Hypoxic_Boundary_Analysis` 分支对应功能还没有实现, 并且接口没有在 api 中注册, 而是直接在 main.py 直接声明, 汇总时确认一下是否还是打算直接声明

> backend-eof 已经跟 3DIsosurface 做了集成, 那么建议是将另外两个分支的代码 merge 到 beckend-eof 的框架中 (实际存放还是你的 dev 分支)
> 大家的 requirements.txt 没有做汇总, 这个你得写一个完整的, 避免依赖缺失

> 下周一之前实现后端的汇总与前端框架的确立 (你这周没给的话就用我的吧), 给出基本的 UI 美化: Welcome Page, 功能栏美化等


### module work

> 下周一之前, 实现完整的前端开发, 如有对 Cesium 的操作设计有问题可以让我来改
> 请依照我的框架实现, 可以把我的 README, 模块文件和给出的config 作为上下文让 ai 辅助设计