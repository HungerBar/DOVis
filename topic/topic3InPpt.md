# 洋盆溶解氧多维可视化平台 DOVis — Dissolved Oxygen Visualization

- 全球溶解氧0-6000米多维数据展示，实现三维透视
- 海洋多深度层溶解氧数据分析
- 海洋剖面溶解氧分析

## 初步分析

### 全球模型与三维透视

[参考](https://myoceanglobe.marine.copernicus.eu/)

目前实现暂定印度洋, 首先实现印度洋部分功能

Q1: 三维透视是指什么? 

目前的设想是用户可以过输入时间, 值来获得等值面

- 高精度: 对等值面用 [marching cubes 算法](https://graphics.stanford.edu/~mdfisher/MarchingCubes.html) 构建并渲染, 支持导出 `.obj` / `.nc` 等格式文件
- 实时性: 对于动态滑块, 考虑使用 ray marching 的方式实现

### 溶解氧垂直剖面分析

用户通过地图选点 / 输入目标经纬度来实现溶解氧垂直剖面点的选择, 然后参考地形剖面的采样方式构建垂直剖面图(DO-depth)

> 可以拓展为断面分析, 即做一个 (depth-x) 图, 然后用颜色表示当地 DO 值的大小


### 低氧区边界分析（Hypoxic Boundary Analysis）

借用上面三维等值面构建的算法, 实现低氧区的三维可视化, 同样实现时间滑块, 可以用于观察低氧边界如何移动

> 可拓展为低氧体积的计算

### EOF模态分解（EOF Analysis）

[tutorial](https://www.ictp.it/sites/default/files/%5Bteaching-materials%5D/lecture_notes_AD_section13.pdf)

[github repository](https://github.com/ajdawson/eofs/)




## 项目框架

### 前端

- Vite
- [React](https://zh-hans.react.dev/learn)
- [Cesium](https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html#.ConstructorOptions)

### 后端

- [flask](https://fastapi.tiangolo.com/tutorial/first-steps/#define-a-path-operation-decorator)



### 计划分工

1. 整体框架, 汇总, UI美化: 李航宇
2. 全球溶解氧0-6000米多维数据展示，实现三维透视: 谢骐骏 
3. 溶解氧垂直剖面分析, 断面可视化(可选): 叶羽童 
4. 低氧区边界分析 (Hypoxic Boundary Analysis), 低氧体积计算(输入为时间, 可选): 1 人
5. 利用 eofs 库实现基本的 EOF 模态分解: 1 人
6. 整理文档, 维护仓库: 谢骐骏
7. 汇报:

> 如果不能实现拓展功能, 需配合 1 一起完成汇总与美化工作


### 数据源

- [国家海洋环境预报中心](https://www.nmefc.cn/ybfw/styb/WestNorthPacific)
- [Copernicus Marine Data Store](https://data.marine.copernicus.eu/products?pk_vid=af6103db3d4548e717790159795188c5)
- [Global Ocean Biogeochemistry Hindcast](https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_BGC_001_029/services)
