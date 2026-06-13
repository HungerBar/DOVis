import * as Cesium from 'cesium';

export function createClickApi(viewer, handlerRef) {
  const removeHandler = (handler) => {
    if (handler && !handler.isDestroyed?.()) {
      handler.destroy();
    }

    if (handlerRef.current === handler) {
      handlerRef.current = null;
    }
  };

  return {
    registerClickHandler: (callback) => {
      removeHandler(handlerRef.current);

      const handler = new Cesium.ScreenSpaceEventHandler(
        viewer.scene.canvas
      );

      handler.setInputAction((movement) => {
        const cartesian =
          viewer.scene.pickPosition(movement.position) ??
          viewer.camera.pickEllipsoid(movement.position);

        if (!cartesian) return;

        const cartographic =
          Cesium.Cartographic.fromCartesian(cartesian);

        callback({
          lon: Cesium.Math.toDegrees(cartographic.longitude),
          lat: Cesium.Math.toDegrees(cartographic.latitude),
        });
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      handlerRef.current = handler;

      return handler;
    },

    removeHandler,
  };
}
