// WindowPolicy.js
// 定义了初始模块渲染的窗口状态

export const WindowPolicy = {
  default: {
    x: 120,
    y: 120,
    width: 700,
    height: 550,

    minWidth: 650,
    minHeight: 200,

    resizable: true,
    draggable: true,
  },

  apply(overrides = {}) {
    return {
      ...this.default,
      ...overrides,
    };
  },
};