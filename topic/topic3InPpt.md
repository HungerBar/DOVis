# 洋盆多维可视化平台

- 全球溶解氧0-6000米多维数据展示，实现三维透视
- 海洋多深度层数据分析
- 海洋剖面分析

## 前端参考

- [3D地球 + 海洋体渲染: Cesium 原生的可视化支持](https://cesium.com/use-cases/underground-undersea/?utm_source=chatgpt.com)
- [体数据可视化: Plotly.js 的可视化方法](https://www.sciencedirect.com/science/article/pii/S1364815220309658?utm_source=chatgpt.com), 同济大学的论文

## 后端参考

- 数据格式, 数据库?
- 面向数据
  - 垂向（多深度层）分析
    - 垂向剖面提取（Vertical Profile）
    - 垂向统计（Vertical Statistics）
    - 跃层检测
  - 水平层分析（Depth Slice Analysis）
    - 空间分布统计（mean / std）
    - 极值区域检测
    - 等值线提取（contour）
  - 剖面分析（Transect Analysis）
  - 时序分析（Time Series）???
  - 空间插值
- 专业功能
  - 缺氧区（OMZ）识别: OMZ = Oxygen Minimum Zone
  - 水团分析（Water Mass Analysis）
  - 梯度场分析


## 预期分工

1 个汇总 && debug
2 个前端
2 个后端
