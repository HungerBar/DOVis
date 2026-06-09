/* eslint-disable react-hooks/immutability */
import {
  useMemo,
  useRef,
} from 'react';

import * as Cesium from 'cesium';

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
      // ============ 3D Tiles API =============
      loadTileset: async (url) => {
        const renderer = getRenderer();

        // 如果希望加载 3D Tiles 时隐藏地球表面，取消下一行注释
        // setGlobeVisible(false);

        return renderer.load(url, {
          autoZoom: true,
        });
      },

      clearTileset: () => {
        rendererRef.current?.destroy?.();
        rendererRef.current = null;

        setGlobeVisible(true);

        viewer.camera.flyHome?.(0);
        console.log('clear');
      },

      tilesRecover: () => {
        const renderer = getRenderer();

        const recovery = new CesiumTilesRecovery(
          viewer,
          renderer
        );

        recovery.recover();

        setGlobeVisible(true);
      },

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

          if (!cartesian) return;

          const cartographic =
            Cesium.Cartographic.fromCartesian(cartesian);

          callback({
            lon: Cesium.Math.toDegrees(cartographic.longitude),
            lat: Cesium.Math.toDegrees(cartographic.latitude),
          });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        return handler;
      },

      // ============ GeoJSON API =============
      loadGeoJson: async (url) => {
        if (!viewer) return;

        try {
          if (geoJsonLayer) {
            viewer.dataSources.remove(geoJsonLayer, true);
            geoJsonLayer = null;
          }

          const ds = await Cesium.GeoJsonDataSource.load(url, {
            clampToGround: true,
          });

          geoJsonLayer = ds;
          geoJsonCache = ds;

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