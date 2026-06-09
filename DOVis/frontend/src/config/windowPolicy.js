export const WindowPolicy = {
  default: {
    x: 16,
    y: 60,
    width: 360,
    height: 520,

    minWidth: 280,
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
