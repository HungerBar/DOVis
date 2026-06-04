import * as Cesium from 'cesium';

export default class CesiumEngine {
  constructor(container) {
    this.viewer = new Cesium.Viewer(container, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      homeButton: false,
      sceneModePicker: true,
      navigationHelpButton: false,
      geocoder: false,
    });
    this.viewer.scene.globe.enableLighting = false;
    //this.viewer.scene.globe.show = false;
  }

  getViewer() {
    return this.viewer;
  }

  cancelFlight() {
    this.viewer?.camera?.cancelFlight?.();
  }

  flyHome(duration = 0) {
    this.viewer?.camera?.flyHome?.(duration);
  }

  destroy() {
    if (this.viewer && !this.viewer.isDestroyed?.()) {
      this.viewer.destroy();
    }

    this.viewer = null;
  }
}