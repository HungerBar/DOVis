import * as Cesium from 'cesium';

export function createCameraApi(viewer) {
  return {
    flyHome: () => {
      viewer.camera.flyHome?.(0);
    },

    flyDefault: (duration = 1.5) => {
      viewer.camera.flyTo?.({
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
    },

    cancelFlight: () => {
      viewer.camera.cancelFlight?.();
    },
  };
}
