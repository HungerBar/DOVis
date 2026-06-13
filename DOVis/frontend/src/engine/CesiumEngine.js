import * as Cesium from 'cesium';
import {
  applyDefaultViewRectangle,
  configureViewer,
  DEFAULT_VIEWER_OPTIONS,
} from './viewerConfig';

export default class CesiumEngine {
  constructor(container) {
    applyDefaultViewRectangle();

    this.viewer = new Cesium.Viewer(
      container,
      DEFAULT_VIEWER_OPTIONS
    );

    configureViewer(this.viewer);
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
