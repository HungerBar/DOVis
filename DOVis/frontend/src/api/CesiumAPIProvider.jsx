/* eslint-disable react-hooks/immutability */
import {
  useMemo,
  useRef,
} from 'react';

import CesiumAPIContext from '../context/CesiumAPIContext';

import CesiumTilesRenderer from '../engine/CesiumTilesRenderer';
import CesiumTilesRecovery from '../engine/CesiumRecovery';

let geoJsonLayer = null;
let geoJsonCache = null;

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
      
      // ============ 3Dtiles相关API =============
      loadTileset: async (url) => {
        const renderer = getRenderer();

        // 1. 隐藏地球表面
        setGlobeVisible(false);

        return renderer.load(url, {
          autoZoom: false,
        });
      },

      clearTileset: () => {
        rendererRef.current?.destroy?.();
        rendererRef.current = null;

        // 2. 恢复地球表面
        setGlobeVisible(true);
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

      // ============ GeoJSON相关API =============
      loadGeoJson: async (url) => {
        if (!viewer) return;

        const Cesium = await import('cesium');

        try {
          // 1. 清旧图层
          if (geoJsonLayer) {
            viewer.dataSources.remove(geoJsonLayer, true);
            geoJsonLayer = null;
          }

          // 2. 加载 GeoJSON
          const ds = await Cesium.GeoJsonDataSource.load(url, {
            clampToGround: true,
          });

          geoJsonLayer = ds;
          viewer.dataSources.add(ds);

          await viewer.zoomTo(ds);

          console.log('[Cesium] GeoJSON loaded');
        } catch (e) {
          console.error('[GeoJSON load error]', e);
        }
      },

      clearGeoJson: () => {
        if (!viewer) return;

        if (geoJsonLayer) {
          viewer.dataSources.remove(geoJsonLayer, true);
          geoJsonLayer = null;
        }

        console.log('[Cesium] GeoJSON cleared');
      },
      
      geojsonRecover: async () => {
        if (!viewer) return;

        try {
          if (geoJsonLayer) {
            viewer.dataSources.remove(geoJsonLayer, true);
            geoJsonLayer = null;
          }

          if (geoJsonCache) {
            geoJsonLayer = geoJsonCache;
            viewer.dataSources.add(geoJsonCache);

            await viewer.zoomTo(geoJsonCache);
          }

          console.log('[Cesium] GeoJSON recovered');
        } catch (e) {
          console.error('[GeoJSON recover error]', e);
        }
      },
    };
  }, [viewer]);



  return (
    <CesiumAPIContext.Provider value={api}>
      {children}
    </CesiumAPIContext.Provider>
  );
}