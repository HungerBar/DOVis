// WindowPolicy.js
// 定义了初始模块渲染的窗口状态，支持不同模块有不同大小


export const WindowPolicy = {
  // 默认尺寸
  default: {
    x: 120,
    y: 120,
    width: 700,
    height: 500,
    minWidth: 300,
    minHeight: 200,
    resizable: true,
    draggable: true,
  },

  // 给不同模块规定初始化大小，ID 在 module.js 中规定
  moduleSpecs: {
    iso: {
      width: 700,
      height: 700,
    },
    eof: {         
      width: 900,
      height: 700,
      minHeight: 600,
    },
  },

  // 专门给 ModuleLauncher 读
  getPolicyForModule(moduleId) {
    return this.moduleSpecs[moduleId] || {};
  },

  // apply 方法 useWindowManager 能正常调用
  apply(overrides = {}) {
    return {
      ...this.default,
      ...overrides,
    };
  },
};