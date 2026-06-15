import * as Cesium from 'cesium';

export const DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
  20.0,
  -50.0,
  155.0,
  30.0
);

export const DEFAULT_VIEWER_OPTIONS = {
  animation: false,
  timeline: false,
  infoBox: false,
  selectionIndicator: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  homeButton: false,
  sceneModePicker: true,
  navigationHelpButton: false,
  geocoder: false,
};

export function applyDefaultViewRectangle() {
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = DEFAULT_VIEW_RECTANGLE;
}

export function configureViewer(viewer) {
  viewer.scene.globe.enableLighting = false;
}
