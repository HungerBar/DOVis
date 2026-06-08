# DOVis 项目架构与 API 说明

## backend

采用 __fast API__ 架构

特别的:

- `main.py`: 如果有静态资源需要暴露为api, 可以放置在这里, 同时这里也是注册 api 的地方, 请保留这一架构完整
- `\api\routers`: 本目录定义的是关于前后端交互时需要保留的 api

> 总而言之, 不要让 main.py 变得过渡臃肿

我的设计:

- `\core`: 本目录定义的是关于怎么从 data 中读取数据, 如果你有读取数据的函数请放在这里
- `\iso*`: 这些目录是我的工具函数目录
- `services`: 具体的实现后端复杂功能的串联层, 是否设计这一接口随你

> 你完全可以按照你自己喜欢的方式组织工具函数, 保证上面关于 api 部分的统一即可

## frontend

`pnpm install` 自动下载所有依赖

- `\config`: 这是一些 config 参数
  - `module`: 你拓展的模块, 需要在这里通过增加 config 注册
  - `cesium`: 这是关于 Cesium 的一些 config
  - `windowPolicy.js`: 这是关于组件初始化面板的一些设置

### 整体架构

为了让 `App.jsx` 不要过度臃肿, 也为了方便汇总同学的工作, 我将真正的汇总页放在了 `\component\AppShell.jsx` 中

> 如果你实在无法按照我的架构完成你的功能, 你也可以提供一个这样的 `AppShell.jsx`, 这样汇总的同学可以直接在多个 `shell` 之间切换来展示多个功能
> 但是请保证 UI 风格和 此处 AppShell.jsx 一致

`AppShell.jsx` 主要有三个模块, Cesium 背景 (详见 Cesium), `ModuleLauncher`, `FloatingWindowLayer`

- `FloatingWindowLayer` 主要管理的就是各个功能展示的窗口, 我目前只是设计了一个最小可行版本(与其配合的 hook 是 `\hooks\useWindowManager`)
- `ModuleLauncher` 这个模块负责统一加载所有模块

> 设计 UI 的同学可以考虑这里应该怎么样做完全合理的可视化, 由于是高度耦合的 (而且代码量也不多), 这里不做赘述

### 如何拓展模块

如何拓展模块呢? 在原有实现基础上 __你只用在 module.js 中注册你的模块, 并在 module 下提供一个对应的模块汇总文件即可__

```js
// \config\module.js

export const moduleConfig = [
  {
    id: 'iso',
    title: 'IsoSurface',
    component: IsoSurfaceModule,
    props: {},
  },
]
```

这是提供给 ModuleLauncher 的 config, id 和 title 不要重复, props 按理来说应该就是完全空的 (默认会提供一个用来清除面板的hook), 而你提供的 module 负责:

- 控制面板渲染: 你只用考虑面板如何渲染即可
- 与Cesium 的交互
- 最重要的: 合理的关闭按钮, 由于不想每次关闭都释放所有缓存, 请你自己定义关于非面板资源的释放, 并在你的 `module.jsx` 中显示定义一个 button 负责资源的释放, 我提供了一个关于面板隐藏的hook (就是面板上的 hidden), 下面是我的返回 button 的示例

```jsx
export default function IsoSurfaceModule({hidden}) {
  ...
  return(
    <div>
      <button
        style={{
          position: 'absolute',
          top: 1,
          right: 1,
          zIndex: 5,
          background: 'transparent',
          border: 'none',

          color: '#fff',
          cursor: 'pointer'
        }} 
        onClick={() => {
          reset();
          hidden();
        }}>
        x
      </button>
    </div>
  )
}
```


> 这里可以结合我的 `IsoSurfaceModule` 的返回来理解 (只用看返回即可)
> 希望你的所有跟面板渲染相关的都暴露在这一层, UI 设计的同学也只用更改这个 module 中的 UI 即可


### 关于 Cesium

- `\src\api`: 这是因为 Cesium 的操作完全独立于整个过程, 所以使用这个文件暴露接口, 如果你需要额外的 Cesium 功能, 请改该文件 
  - `CesiumAPIProvider`: 接收一个 Cesium.Viewer 实例(viewer), 创建一组操作 Cesium 的函数, 通过 React Context 提供给子组件使用

> 这么做的设计是不用暴露 viwer (避免一些稀奇古怪的bug), 如果你想做一些对 viwer 的操作, 请 重写 / 拓展 这个 api, 具体操作可以放在engine下面

我的engine:

- `\engine\`: 
  - `CesiumEngine`: 这是初始化 Cesium的地方, 配合 `\component\CesiumViewer` 获得一个 CesiumViwer 的 background
  - `CesiumRecovery`: 这是我将 renderer 重置的地方, 我用 `const rendererRef = useRef(null);` 来获得 renderer
  - `CesiumTilesRenderer`: 这是我将 3DTiles 渲染出来的地方

> 如果你只是想获得 Cesium canvas上的数据, 那么只要在 CesiumAPIProvider 上拓展即可
> 如果你像我一下希望加载一些资源在 Cesium 上 (即赋予 viwer 某些属性值), 那么你需要向我一样提供一个 CesiumTilesRenderer, 并且在 CesiumRecovery 中提供一个类, 规范如果加载失败的话会发生什么 (否则会出现神秘 bug), 然后再在 CesiumAPIProvider 上拓展对应的功能
> 我觉得另外 3 个功能应该不会涉及加载 3dtiles 之外的加载需求, 低氧区边界应该也能作为 3dtiles 加载? 所以我这里没做特意的解耦
 
为了让 api 能作为 context 传递, 我设计了 `useCesiumAPI`

而 `useCesiumTiles` 就是一个示例, 展示我是如果清晰的使用 api 暴露出来的接口与 Cesium 交互的

> 这里已经默认你了解了 hook 的基本原理. 简单来说就是当你在网页操作时, 需要一个应对函数, hook就是这个应对函数
> 你可以结合 `\module\IsoSurfaceModule` 中我怎么使用这个 hook 来理解


## 关于分工的一些建议

## 前言

在设计 `\module` 的时候尽可能清晰的展示出哪个模块对应的是哪个渲染出来的组件

### UI 设计

请你着重阅读 AppShell.jsx 中的三个模块:

`AppShell.jsx` 主要有三个模块, Cesium 背景 (详见 Cesium), `ModuleLauncher`, `FloatingWindowLayer`

- `FloatingWindowLayer` 主要管理的就是各个功能展示的窗口, 我目前只是设计了一个最小可行版本(与其配合的 hook 是 `\hooks\useWindowManager`)
- `ModuleLauncher` 这个模块负责统一加载所有模块

做整体的美化, 并对各个模块暴露出来的 module (`\module`) 文件夹下的组件做美化, 以及给一个 Welcome page

### 溶解氧垂直剖面点

> 这里在给老师汇报的时候, 老师认为断面的展示最好还是加上

可能可行的路线:

- 单点: 拓展我的 CesiumAPIProvider, 能获得鼠标点击点的经纬度 (输入经纬度), 写一个 hook 根据经纬度请求相应的数据然后在另外的页面中展示 (支持时间滑块)
- 断面, 可以考虑让用户用鼠标绘制一条线, 然后你只是离散的在这条线上采样, 得到一个经纬度数组, 然后按照 topic 中文档说明的方式做可视化 (支持时间滑块)

> 如果不想做断面的话还有个拓展方向: 把那个预报数据加入平台, 然后让时间滑块支持预测, 这两个拓展方向选一个即可
> 可以先把基础实现了我来拓展也行

### 低氧区边界分析

这里可以将低氧区作为 3dtiles 渲染(复用我的render api), 面板设计上也可以复用我的代码
关键是怎么在后端根据输入的时间获得低氧区 (如果 3d 效果不好也可以退化为时间深度双输入)

> 这个 Cesium 坐标系太折磨了, 顺利的话帮 UI 设计的做下迁移吧, 不顺利emmmm


### EOF 模态分解

在前后端交互上可以做下拉框, 实现对 data 目录下所有数据的选择, 然后做某个深度上的 eof (所以输入是深度与目标文件), 然后展示结果也是在module中展示, 并且支持导出

> 想了下感觉你的工作量也不多, 可以帮帮 UI 设计的同学做下迁移与合并

---

#### 后端细节

1. api

    - 接收：
      - 数据源（哪一个海洋的文件）
      - 时间跨度（哪一段时间的 EOF）
      - EOF 模式（水平 or 剖面）
      - 空间切片参数（深度 or 沿哪一经纬线）
      - 计算 mode 数量
  
    - 返回：
      - EOF 结果（矩阵）
        - JSON 格式

2. 数据

    - 在 [原来读取数据的文档](WebGIS\DOVis\backend\core\dataset.py) 增加 `get_ds_by_id()` 读入方式，和原先读取数据函数形式完全一样，但是支持多源数据选择


3. 环境

    - 安装 eof 库 `pip install eofs`

#### 前端细节

- 基本架构

  1. State
      - 当前系统的状态，所有参数都是 EOF 局部、不影响其他模块

  2. Hook 
      - 读取状态、更新状态、调用后端模块的 api 、操作 cesium

      - `useEOF.js` 管理所有的控制参数和后端返回的 result 状态，处理 fetch 异步请求。
    
      - 还有一个 Hook 负责结果图表的生命周期和配置 `useEOFchart.js` 

        >引入 Plotly.js 进行可视化，资源放在 public 文件夹中（放本地减少网络影响），在 index.html 中引入

  3. UI 
      - 根据用户交互调用 Hook

      >`eofControlPanel.jsx` 负责表单的外观渲染；`eofResultPanel.jsx` 负责接收后端返回的 result 数据，并把它渲染出来
  
  4. Module 
      - 连接 UI 和 Hook
      >`eofModule.jsx` 调用 useEOF() 拿到数据和方法，然后把它们分别分发给左侧面板和右侧大屏

  5. 其他业务
      - `eofExport.js` 处理 EOF 结果，打包、压缩、导出 

- 环境与结构
  
  - 安装依赖 `npm install jszip file-saver`

  - 增加 utils 文件夹，放前端工具函数的代码

#### EOF 流程

1. 用户操作
    - 选择数据源（全局）
    - 选择 EOF 模式：横剖 or 纵剖
    - 选择位置：深度 or 经纬度
    - 选择时间跨度
    - 选择展示前几个模态

2. 结果可视化
    - 多个按钮，切换 mode

3. 打包和导出数据
    - 用户选择模块，导出当前 mode 的 EOF 结果，是一个 .zip 压缩包

4. 关闭 EOF 面板后，保留用户操作参数，销毁 EOF 结果

#### 其他说明

- **目前EOF前后端的相关参数全部是按照 do_predict.nc 写死的**，如果之后改成多源数据，考虑在后端增加一个接口，接收数据并返回它的信息

  - 相关参数应该包括 api中数据格式与边界检查；eof总控面板中，用户输入参数范围与 ui 显示；结果图渲染hook中，原始数据时间转实际时间时基准年份。

- 设计 ui ，整个面板样式修改 [`eofControlPanel.jsx`](WebGIS\DOVis\frontend\src\components\eofControlPanel.jsx) ；可视化样式修改 [`eofResultPanel.jsx`](WebGIS\DOVis\frontend\src\components\eofResultPanel.jsx)

  - 可视化样式修改的时候务必小心，有些必须的结构不要动！
 
- **迁移与合并有啥任务要我完成直接和我说就行！**

---

### EOF 部分说明

1. 设计思路

    - 计算采用处理气象 / 海洋数据标准的 `eofs` 库，与四维的海洋数据对齐；

    - 由于 EOF 是将高维时空数据分解为空间模态和时间系数，在前端结果采用二维特征图和一维时间曲线图表示；

    - 使用 `Plotly` 库进行绘图，天然支持二维热力图等科学计算结果的可视化；

    - 为了减小计算压力和方便结果展示，分析区域选取空间切片，支持：
      - 水平 EOF ，指定深度层，对二维平面进行时空分解；
      - 剖面 EOF ，沿经度线或者纬度线指定剖面，对断面进行时空分解。

    - 为了观察不同周期的规律，分析时段也能自由选择；

    - 支持分析结果导出，内容包括参数配置、可视化图表、JSON 格式的结果矩阵；

    - 为了降低系统的复杂程度，EOF 部分全部采用局部的状态隔离，所有控制参数、选择状态、返回结果在前端实行局部管理，打开时独立运行、关闭时释放内存销毁计算结果，不污染全局。



2. 前后端配合

    1. 前端通过 `GET` 接口获取需要用户操作的参数并生成 UI ；
    2. 前端通过 `POST` 发送请求，后端响应并接收用户填入参数，进行格式检查和调整，加载数据，进行 EOF 计算，返回 JSON 格式的结果矩阵；
    3. 前端收到响应数据，进行绘图；
    4. 导出数据也是在前端触发完成。

3. 前端架构

    - EOF 的前端分为四层：
      1. 总控 `eofModule.jsx` 
          - 管理整个 EOF 模块的生命周期，调用自定义 Hook `useEOF()` ，提取出所有的状态、运行逻辑和结果，并作为 `Props` 分发给控制面板。
      
      2. 逻辑层 hooks 
          - `useEOF.js` 独立维护用户填入的参数，监听运行 EOF 事件。
          - `useEOFchart.js` 仅仅是一个图表生命周期的 hook ，监听初次返回结果、切换模态两个事件，通过本地挂载的 `Plotyly.js` 资源在 Canvas 视窗上进行绘图。
      
      3. UI 
          - `eofControlPanel.jsx` 负责 EOF 面板外观渲染。
          - `eofResultPanel.jsx` 结果区，内部为绘图 hook 预览 Canvas 实体，调用导出工具函数支持导出数据（这是一个动作，导出的是当前数据状态）。
      
      4. 工具层 utils `eofExport.js`
          - 工具函数，基于 `jszip` 和 `file-saver` 实现前端导出数据，在浏览器生成数据并打包下载，不经过后端存储。

    - EOF 维护的状态包括：
      - 输入参数配置状态：记录用户填入了什么参数，并且这个状态在关闭面板时并不销毁；
      - 生命周期状态：分为请求在后端计算、进入阻断和加载，或者没有请求、释放；
      - 数据状态：存储后端返回的 EOF 结果，关闭面板时会被销毁；
      - 模态视图状态：记录当前渲染的是哪个模态的结果。

4. 拓展和改进

    - 如何适应多源数据？
      - 增加一个 `GET` 接口，选中数据源后自动触发，后端进行读取，返回其格式和范围，对应改变 UI 显示。

    - 其他可以增加的：接入 llm 分析 EOF 结果
      - 后端计算得出主要的统计学指标，生成结构化提示词给 llm ，返回分析给前端。