export function createCameraApi(viewer) {
  return {
    flyHome: () => {
      viewer.camera.flyHome?.(0);
    },

    cancelFlight: () => {
      viewer.camera.cancelFlight?.();
    },
  };
}
