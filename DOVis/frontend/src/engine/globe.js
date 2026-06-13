export function setGlobeVisible(viewer, visible) {
  if (!viewer?.scene?.globe) return;

  viewer.scene.globe.show = visible;

  viewer.imageryLayers?.forEach?.((layer) => {
    layer.show = visible;
  });
}
