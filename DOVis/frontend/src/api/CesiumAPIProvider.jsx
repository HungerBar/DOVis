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
  const entitiesRef = useRef(new Set());
  const handlerRef = useRef(null);

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

    const removeHandler = (handler) => {
      if (handler && !handler.isDestroyed?.()) {
        handler.destroy();
      }

      if (handlerRef.current === handler) {
        handlerRef.current = null;
      }
    };

    const removeAllPoints = () => {
      for (const entity of entitiesRef.current) {
        viewer.entities.remove(entity);
      }

      entitiesRef.current.clear();
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

      clearTileset: (opts = {}) => {
        rendererRef.current?.destroy?.();
        rendererRef.current = null;

        setGlobeVisible(true);

        if (!opts.keepCamera) {
          viewer.camera.flyHome?.(0);
        }
        console.log('[Cesium] Tileset cleared');
      },

      tilesRecover: (opts = {}) => {
        const renderer = getRenderer();

        const recovery = new CesiumTilesRecovery(
          viewer,
          renderer
        );

        recovery.recover();

        setGlobeVisible(true);
      },

      // ============ Camera API =============
      flyHome: () => {
        viewer.camera.flyHome?.(0);
      },

      cancelFlight: () => {
        viewer.camera.cancelFlight?.();
      },

      // ============ Click Pick API =============
      registerClickHandler: (callback) => {
        if (
          handlerRef.current &&
          !handlerRef.current.isDestroyed?.()
        ) {
          handlerRef.current.destroy();
          handlerRef.current = null;
        }

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

      // ============ Point Entity API =============
      addPoint: (lat, lon) => {
        const entity = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          point: {
            pixelSize: 12,
            color: Cesium.Color.fromCssColorString('#38bdf8'),
            outlineColor: Cesium.Color.fromCssColorString('#ffffff'),
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: `${lat.toFixed(4)}°N  ${lon.toFixed(4)}°E`,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -14),
          },
        });

        entitiesRef.current.add(entity);

        return entity;
      },

      removeEntity: (entity) => {
        if (!entity) return;

        viewer.entities.remove(entity);
        entitiesRef.current.delete(entity);
      },

      removeAllPoints,

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

      geojsonRecover: async (opts = {}) => {
        if (!viewer) return;

        try {
          if (geoJsonLayer) {
            viewer.dataSources.remove(geoJsonLayer, true);
            geoJsonLayer = null;
          }

          if (geoJsonCache) {
            geoJsonLayer = geoJsonCache;
            viewer.dataSources.add(geoJsonCache);

            if (!opts.keepCamera) {
              await viewer.zoomTo(geoJsonCache);
            }
          }

          console.log('[Cesium] GeoJSON recovered');
        } catch (e) {
          console.error('[GeoJSON recover error]', e);
        }
      },

      // ============ Global Cleanup API =============
      cleanupAll: () => {
        removeAllPoints();

        if (
          handlerRef.current?.destroy &&
          !handlerRef.current.isDestroyed?.()
        ) {
          handlerRef.current.destroy();
        }

        handlerRef.current = null;

        rendererRef.current?.destroy?.();
        rendererRef.current = null;

        if (geoJsonLayer) {
          viewer.dataSources.remove(geoJsonLayer, true);
          geoJsonLayer = null;
        }

        setGlobeVisible(true);

        console.log('[Cesium] Cleanup all');
      },
    };
  }, [viewer]);

  return (
    <CesiumAPIContext.Provider value={api}>
      {children}
    </CesiumAPIContext.Provider>
  );
}