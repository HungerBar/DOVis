/* eslint-disable react-hooks/immutability */
import {
  useMemo,
  useRef,
} from 'react';

import CesiumAPIContext from '../context/CesiumAPIContext';

import CesiumTilesRenderer from '../engine/CesiumTilesRenderer';
import CesiumTilesRecovery from '../engine/CesiumRecovery';

export default function CesiumAPIProvider({
  viewer,
  children,
}) {
  const rendererRef = useRef(null);

  const setGlobeVisible = (visible) => {
    if (!viewer?.scene?.globe) return;

    viewer.scene.globe.show = visible;

    viewer.imageryLayers?.forEach?.((layer) => {
      layer.show = visible;
    });
  };

  const api = useMemo(() => {
    if (!viewer) return null;

    const getRenderer = () => {
      if (!rendererRef.current) {
        rendererRef.current = new CesiumTilesRenderer(viewer);
      }
      return rendererRef.current;
    };

    return {
      loadTileset: async (url) => {
        const renderer = getRenderer();

        // 1. 隐藏地球表面
        // setGlobeVisible(false);

        return renderer.load(url, {
          autoZoom: true,
        });
      },

      clearTileset: () => {
        rendererRef.current?.destroy?.();
        rendererRef.current = null;

        // 2. 恢复地球表面
        setGlobeVisible(true);

        viewer.camera.flyHome?.(0);
        console.log("clear");
      },

      tilesRecover: () => {
        const renderer = getRenderer();

        const recovery = new CesiumTilesRecovery(
          viewer,
          renderer
        );

        recovery.recover();

        // 3. 恢复地球表面
        setGlobeVisible(true);
      },

      flyHome: () => {
        viewer.camera.flyHome?.(0);
      },

      cancelFlight: () => {
        viewer.camera.cancelFlight?.();
      },
    };
  }, [viewer]);

  return (
    <CesiumAPIContext.Provider value={api}>
      {children}
    </CesiumAPIContext.Provider>
  );
}