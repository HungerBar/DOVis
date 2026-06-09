/* eslint-disable react-hooks/immutability */
import { useMemo } from 'react';

import * as Cesium from 'cesium';

import CesiumAPIContext from '../context/CesiumAPIContext';

export default function CesiumAPIProvider({
  viewer,
  children,
}) {
  const api = useMemo(() => {
    if (!viewer) return null;

    return {
      flyHome: () => {
        viewer.camera.flyHome?.(0);
      },

      cancelFlight: () => {
        viewer.camera.cancelFlight?.();
      },

      registerClickHandler: (callback) => {
        const handler = new Cesium.ScreenSpaceEventHandler(
          viewer.scene.canvas
        );
        handler.setInputAction((movement) => {
          const cartesian =
            viewer.scene.pickPosition(movement.position) ??
            viewer.camera.pickEllipsoid(movement.position);
          if (cartesian) {
            const cartographic =
              Cesium.Cartographic.fromCartesian(cartesian);
            callback({
              lon: Cesium.Math.toDegrees(cartographic.longitude),
              lat: Cesium.Math.toDegrees(cartographic.latitude),
            });
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        return handler;
      },
    };
  }, [viewer]);

  return (
    <CesiumAPIContext.Provider value={api}>
      {children}
    </CesiumAPIContext.Provider>
  );
}
