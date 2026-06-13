import CesiumTilesRecovery from './CesiumRecovery';
import CesiumTilesRenderer from './CesiumTilesRenderer';
import { setGlobeVisible } from './globe';

export function createTilesApi(viewer, rendererRef) {
  const getRenderer = () => {
    if (!rendererRef.current) {
      rendererRef.current = new CesiumTilesRenderer(viewer);
    }

    return rendererRef.current;
  };

  return {
    loadTileset: async (url) => {
      const renderer = getRenderer();

      // 如果希望加载 3D Tiles 时隐藏地球表面，取消下一行注释
      // setGlobeVisible(viewer, false);

      return renderer.load(url, {
        autoZoom: true,
      });
    },

    clearTileset: (opts = {}) => {
      rendererRef.current?.destroy?.();
      rendererRef.current = null;

      setGlobeVisible(viewer, true);

      if (!opts.keepCamera) {
        viewer.camera.flyHome?.(0);
      }
      console.log('[Cesium] Tileset cleared');
    },

    tilesRecover: () => {
      const renderer = getRenderer();

      const recovery = new CesiumTilesRecovery(
        viewer,
        renderer
      );

      recovery.recover();

      setGlobeVisible(viewer, true);
    },
  };
}
