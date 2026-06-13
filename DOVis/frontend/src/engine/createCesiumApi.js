import { createCameraApi } from './cameraApi';
import { createClickApi } from './clickApi';
import { createGeoJsonApi } from './geoJsonApi';
import { createPointApi } from './pointApi';
import { createTilesApi } from './tilesApi';
import { setGlobeVisible } from './globe';

export function createCesiumApi({
  viewer,
  rendererRef,
  entitiesRef,
  handlerRef,
  studyAreaDrawnRef,
  studyAreaDsRef,
}) {
  const clickApi = createClickApi(viewer, handlerRef);
  const pointApi = createPointApi(viewer, entitiesRef);
  const geoJsonApi = createGeoJsonApi(
    viewer,
    studyAreaDrawnRef,
    studyAreaDsRef
  );

  return {
    ...createTilesApi(viewer, rendererRef),
    ...createCameraApi(viewer),
    ...clickApi,
    ...pointApi,
    ...geoJsonApi,

    cleanupAll: () => {
      pointApi.removeAllPoints();
      clickApi.removeHandler(handlerRef.current);
      handlerRef.current = null;

      rendererRef.current?.destroy?.();
      rendererRef.current = null;

      geoJsonApi.cleanupGeoJson();
      geoJsonApi.removeStudyArea();

      setGlobeVisible(viewer, true);

      console.log('[Cesium] Cleanup all');
    },
  };
}
