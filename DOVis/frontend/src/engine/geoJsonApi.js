import * as Cesium from 'cesium';

let geoJsonLayer = null;
let geoJsonCache = null;

export function createGeoJsonApi(viewer) {
  return {
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

    cleanupGeoJson: () => {
      if (geoJsonLayer) {
        viewer.dataSources.remove(geoJsonLayer, true);
        geoJsonLayer = null;
      }
    },
  };
}
