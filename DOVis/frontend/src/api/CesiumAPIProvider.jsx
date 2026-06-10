/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';

import * as Cesium from 'cesium';

import CesiumAPIContext from '../context/CesiumAPIContext';

export default function CesiumAPIProvider({
  viewer,
  children,
}) {
  const entitiesRef = useRef(new Set());
  const handlerRef = useRef(null);
  const studyAreaDrawnRef = useRef(false);
  const studyAreaDsRef = useRef(null);

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

        handlerRef.current = handler;
        return handler;
      },

      removeHandler: (handler) => {
        if (handler && !handler.isDestroyed?.()) {
          handler.destroy();
        }
        if (handlerRef.current === handler) {
          handlerRef.current = null;
        }
      },

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
        if (entity) {
          viewer.entities.remove(entity);
          entitiesRef.current.delete(entity);
        }
      },

      removeAllPoints: () => {
        for (const entity of entitiesRef.current) {
          viewer.entities.remove(entity);
        }
        entitiesRef.current.clear();
      },

      cleanupAll: () => {
        api.removeAllPoints();
        if (handlerRef.current?.destroy && !handlerRef.current.isDestroyed?.()) {
          handlerRef.current.destroy();
        }
        handlerRef.current = null;
      },

      loadGeoJson: async (url) => {
        if (!viewer) return;
        try {
          const ds = await Cesium.GeoJsonDataSource.load(url, {
            clampToGround: true,
            stroke: Cesium.Color.fromCssColorString('#c084fc'),
            strokeWidth: 3,
            fill: Cesium.Color.fromCssColorString('#c084fc').withAlpha(0.25),
          });
          // Remove auto-generated labels from feature properties
          for (const entity of ds.entities.values) {
            entity.label = undefined;
          }
          viewer.dataSources.add(ds);
        } catch (e) {
          console.error('[GeoJSON load error]', e);
        }
      },

      drawStudyArea: () => {
        if (studyAreaDrawnRef.current) return;
        studyAreaDrawnRef.current = true;
        Cesium.GeoJsonDataSource.load('/static/study_area.geojson', {
          clampToGround: true,
          stroke: Cesium.Color.fromCssColorString('#c084fc'),
          strokeWidth: 3,
          fill: Cesium.Color.fromCssColorString('#c084fc').withAlpha(0.25),
        }).then((ds) => {
          for (const entity of ds.entities.values) {
            entity.label = undefined;
          }
          studyAreaDsRef.current = ds;
          viewer.dataSources.add(ds);
        }).catch((e) => {
          studyAreaDrawnRef.current = false;
          console.error('[GeoJSON load error]', e);
        });
      },

      removeStudyArea: () => {
        if (studyAreaDsRef.current) {
          viewer.dataSources.remove(studyAreaDsRef.current);
          studyAreaDsRef.current = null;
        }
        studyAreaDrawnRef.current = false;
      },
    };
  }, [viewer]);

  return (
    <CesiumAPIContext.Provider value={api}>
      {children}
    </CesiumAPIContext.Provider>
  );
}
