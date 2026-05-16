# 洋盆多维可视化平台

- 全球溶解氧0-6000米多维数据展示，实现三维透视
- 海洋多深度层数据分析
- 海洋剖面分析

# 初步分析

## 全球模型

[参考](https://myoceanglobe.marine.copernicus.eu/)

Q1: 三维透视? 计划对某些等值面用 [marching cubes 算法](https://graphics.stanford.edu/~mdfisher/MarchingCubes.html) 渲染出来

## 多深度层数数据分析, 剖面分析

Q2: 怎样合理的从三维模型中提取出目标剖面 (用户该怎么操作才能得到他想要的目标的剖面图)

Q3: 剖面图该借助什么插件来渲染, Cesium 能实现吗?

Q4: 需要对多深度层数, 剖面做哪些后端分析?

## 数据源

- [国家海洋环境预报中心](https://www.nmefc.cn/ybfw/styb/WestNorthPacific)
- [Global Ocean Biogeochemistry Hindcast](https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_BGC_001_029/description)
- [Global Ocean Biogeochemistry Analysis and Forecast](https://data.marine.copernicus.eu/product/GLOBAL_ANALYSISFORECAST_BGC_001_028/description)
