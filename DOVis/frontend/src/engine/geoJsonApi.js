import * as Cesium from 'cesium';

let geoJsonLayer = null;
let geoJsonCache = null;

const GEOJSON_STYLE = {
  clampToGround: true,
  stroke: Cesium.Color.fromCssColorString('#c084fc'),
  strokeWidth: 3,
  fill: Cesium.Color.fromCssColorString('#c084fc').withAlpha(0.25),
};

function removeEntityLabels(dataSource) {
  for (const entity of dataSource.entities.values) {
    entity.label = undefined;
  }
}

export function createGeoJsonApi(
  viewer,
  studyAreaDrawnRef,
  studyAreaDsRef
) {
  return {
    loadGeoJson: async (url) => {
      if (!viewer) return;

      try {
        if (geoJsonLayer) {
          viewer.dataSources.remove(geoJsonLayer, true);
          geoJsonLayer = null;
        }

        const ds = await Cesium.GeoJsonDataSource.load(
          url,
          GEOJSON_STYLE
        );

        removeEntityLabels(ds);

        geoJsonLayer = ds;
        geoJsonCache = ds;

        viewer.dataSources.add(ds);

        await viewer.zoomTo(ds);

        console.log('[Cesium] GeoJSON loaded');
      } catch (e) {
        console.error('[GeoJSON load error]', e);
      }
    },

    clearGeoJson: (opts = {}) => {
      if (!viewer) return;

      if (geoJsonLayer) {
        viewer.dataSources.remove(geoJsonLayer, true);
        geoJsonLayer = null;
      }

      geoJsonCache = null;

      if (!opts.keepCamera) {
        viewer.camera.flyHome?.(0);
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

    drawStudyArea: () => {
      if (!viewer || studyAreaDrawnRef.current) return;

      studyAreaDrawnRef.current = true;

      Cesium.GeoJsonDataSource.load(
        '/static/study_area.geojson',
        GEOJSON_STYLE
      ).then((ds) => {
        removeEntityLabels(ds);

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

    cleanupGeoJson: () => {
      if (geoJsonLayer) {
        viewer.dataSources.remove(geoJsonLayer, true);
        geoJsonLayer = null;
      }
    },
  };
}
