import * as Cesium from 'cesium';

export function createPointApi(viewer, entitiesRef) {
  const removeAllPoints = () => {
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }

    entitiesRef.current.clear();
  };

  return {
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
  };
}
