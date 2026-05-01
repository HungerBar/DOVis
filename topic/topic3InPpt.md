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


---

Re: 
  - 我觉得这个题目很新很有趣，一个是可视化有很大的潜力、一个是分析可以延伸的地方很多

  - 如果就围绕溶解氧这个点切入，考虑可能更清晰的后端分析结构：
    - 描述溶解氧分布
      - 水平层
      - 深度切片
      - 垂向剖面
      - 剖面线
    - 识别分布结构规律
      - 跃层检测
      - OMZ 识别
      - 极值区检测
    - 简单机理分析（这里可以延伸）
      - 温度影响分析
      - 深度分层分析
      - 洋流影响分析
      - ...
    - 应用（生态、环境、渔业...）
      - 低氧风险评估
      - 海洋环境评估？

  - ~~关于数据收集的问题，或许有挂？~~ 如果考虑自费一个很小型的服务器存储主要的数据，然后用 Python 读取和分析，是否可行？

--- 

额如果能收集到, 存储应该是没问题的, 我有一个 linux 机器可以作为 db server, 但是这样毫无疑问增加了工作量 ~~(虽然我感觉有 ai 的话不会增加很多)~~

这一块主要感觉还是收集上的问题