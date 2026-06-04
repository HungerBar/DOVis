/* eslint-disable no-empty */
export default class CesiumTilesRecovery {
  constructor(viewer, renderer) {
    this.viewer = viewer;
    this.renderer = renderer;
  }

  recover() {
    this.viewer?.camera?.cancelFlight?.();

    this.renderer?.destroy?.();

    try {
      this.viewer?.camera?.flyHome?.(0);
    } catch { }
  }
}