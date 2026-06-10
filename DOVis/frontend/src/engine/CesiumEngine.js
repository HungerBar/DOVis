import * as Cesium from 'cesium';

export default class CesiumEngine {
  constructor(container) {
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
      20.0,
      -50.0,
      155.0,
      30.0
    );

    this.viewer = new Cesium.Viewer(container, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      homeButton: false,
      sceneModePicker: true,
      navigationHelpButton: false,
      geocoder: false,
      selectionIndicator: false,
      infoBox: false,
    });

    this.viewer.scene.globe.enableLighting = false;
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

  flyDefault(duration = 1.5) {
    this.viewer?.camera?.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        75.0,
        -10.0,
        14000000
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration,
    });
  }

  destroy() {
    if (this.viewer && !this.viewer.isDestroyed?.()) {
      this.viewer.destroy();
    }

    this.viewer = null;
  }
}