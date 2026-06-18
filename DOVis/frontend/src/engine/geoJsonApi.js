import * as Cesium from 'cesium';
import {
  createEarthFacingOrientation,
  createFlyDestination,
} from './cameraOrientation';

let geoJsonLayer = null;
let geoJsonCache = null;
let geoJsonLoadRequestId = 0;
const geoJsonLayers = new Map();
const geoJsonLayerRequestIds = new Map();
let eofHighValueLayer = null;

const GEOJSON_STYLE = {
  clampToGround: true,
  stroke: Cesium.Color.fromCssColorString('#c4b5fd'),
  strokeWidth: 3,
  fill: Cesium.Color.fromCssColorString('#c4b5fd').withAlpha(0.24),
};

const HYPOXIA_STYLE = {
  clampToGround: true,
  stroke: Cesium.Color.fromCssColorString('#9b5fbf'),
  strokeWidth: 3,
  fill: Cesium.Color.fromCssColorString('#7b4a9e').withAlpha(0.52),
};

const EOF_HIGH_VALUE_STYLE = {
  clampToGround: true,
  stroke: Cesium.Color.fromCssColorString('#fffb00'),
  strokeWidth: 3,
  fill: Cesium.Color.fromCssColorString('#ff3b00').withAlpha(0.62),
};

const EOF_FILL = Cesium.Color.fromCssColorString('#ff3b00').withAlpha(0.68);
const EOF_OUTLINE = Cesium.Color.fromCssColorString('#fffb00').withAlpha(1.0);

function removeEntityLabels(dataSource) {
  for (const entity of dataSource.entities.values) {
    entity.label = undefined;
  }
}

async function flyToIndianOcean(viewer, options = {}) {
  if (!viewer) return;

  const destination = createFlyDestination({
    lon: options.flyLon ?? 80.0,
    lat: options.flyLat ?? -15.0,
    height: options.flyHeight ?? 16000000.0,
  });

  await viewer.camera.flyTo({
    destination,
    orientation: createEarthFacingOrientation(destination),
    duration: options.flyDuration ?? 1.5,
  });
}

export function createGeoJsonApi(
  viewer,
  studyAreaDrawnRef,
  studyAreaDsRef
) {
  const loadGeoJsonLayer = async (layerId, data, style = {}) => {
    if (!viewer || !layerId || !data) return null;
    const requestId = (geoJsonLayerRequestIds.get(layerId) || 0) + 1;
    geoJsonLayerRequestIds.set(layerId, requestId);

    try {
      const ds = await Cesium.GeoJsonDataSource.load(data, {
        ...GEOJSON_STYLE,
        ...style,
      });

      if (geoJsonLayerRequestIds.get(layerId) !== requestId) {
        viewer.dataSources.remove(ds, true);
        return null;
      }

      const existing = geoJsonLayers.get(layerId);
      if (existing) {
        viewer.dataSources.remove(existing, true);
        geoJsonLayers.delete(layerId);
      }

      removeEntityLabels(ds);

      geoJsonLayers.set(layerId, ds);
      viewer.dataSources.add(ds);
      await flyToIndianOcean(viewer, style);

      console.log(`[Cesium] GeoJSON layer loaded: ${layerId}`);
      return ds;
    } catch (e) {
      console.error('[GeoJSON layer load error]', e);
      throw e;
    }
  };

  const clearGeoJsonLayer = (layerId, opts = {}) => {
    if (!viewer || !layerId) return;

    const existing = geoJsonLayers.get(layerId);
    if (existing) {
      viewer.dataSources.remove(existing, true);
      geoJsonLayers.delete(layerId);
    }

    if (!opts.keepCamera) {
      viewer.camera.flyHome?.(0);
    }

    console.log(`[Cesium] GeoJSON layer cleared: ${layerId}`);
  };

  return {
    loadGeoJson: async (url) => {
      if (!viewer) return;
      const requestId = ++geoJsonLoadRequestId;

      try {
        const ds = await Cesium.GeoJsonDataSource.load(
          url,
          HYPOXIA_STYLE
        );

        if (requestId !== geoJsonLoadRequestId) {
          viewer.dataSources.remove(ds, true);
          return null;
        }

        if (geoJsonLayer) {
          viewer.dataSources.remove(geoJsonLayer, true);
          geoJsonLayer = null;
        }

        removeEntityLabels(ds);

        geoJsonLayer = ds;
        geoJsonCache = ds;

        viewer.dataSources.add(ds);

        await flyToIndianOcean(viewer);

        console.log('[Cesium] GeoJSON loaded');
        return ds;
      } catch (e) {
        console.error('[GeoJSON load error]', e);
        return null;
      }
    },

    loadGeoJsonLayer,
    clearGeoJsonLayer,

    loadEofHighValueGeoJson: async (geojson) => {
      return loadGeoJsonLayer(
        'eof-high-value',
        geojson,
        EOF_HIGH_VALUE_STYLE
      );
    },

    loadEofHighValueCells: async (cells) => {
      if (!viewer || !Array.isArray(cells) || cells.length === 0) return null;

      if (eofHighValueLayer) {
        viewer.dataSources.remove(eofHighValueLayer, true);
        eofHighValueLayer = null;
      }

      const ds = new Cesium.CustomDataSource('EOF1 High-Value Region');

      cells.forEach((cell, index) => {
        ds.entities.add({
          id: `eof-high-value-${index}`,
          name: 'EOF1 high-value cell',
          properties: {
            value: cell.value,
          },
          rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(
              cell.west,
              cell.south,
              cell.east,
              cell.north
            ),
            material: EOF_FILL,
            outline: true,
            outlineColor: EOF_OUTLINE,
            outlineWidth: 1,
            height: 1500,
          },
        });
      });

      eofHighValueLayer = ds;
      await viewer.dataSources.add(ds);
      await flyToIndianOcean(viewer);

      console.log(`[Cesium] EOF high-value cells loaded: ${cells.length}`);
      return ds;
    },

    clearEofHighValueGeoJson: (opts = {}) => {
      if (eofHighValueLayer) {
        viewer.dataSources.remove(eofHighValueLayer, true);
        eofHighValueLayer = null;
      }

      clearGeoJsonLayer('eof-high-value', { keepCamera: true });

      if (!opts.keepCamera) {
        viewer.camera.flyHome?.(0);
      }
    },

    clearGeoJson: (opts = {}) => {
      if (!viewer) return;
      geoJsonLoadRequestId++;

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
            await flyToIndianOcean(viewer, opts);
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

      geoJsonLayers.forEach((dataSource) => {
        viewer.dataSources.remove(dataSource, true);
      });
      geoJsonLayers.clear();

      if (eofHighValueLayer) {
        viewer.dataSources.remove(eofHighValueLayer, true);
        eofHighValueLayer = null;
      }
    },
  };
}
