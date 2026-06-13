import * as Cesium from 'cesium';

function toCartesian3(cartesian4) {
  return new Cesium.Cartesian3(
    cartesian4.x,
    cartesian4.y,
    cartesian4.z
  );
}

function isFiniteCartesian3(value) {
  return (
    Cesium.defined(value) &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.z)
  );
}

function getNorthUpVector(destination, direction) {
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(destination);
  const north = toCartesian3(
    Cesium.Matrix4.getColumn(
      enu,
      1,
      new Cesium.Cartesian4()
    )
  );

  const dot = Cesium.Cartesian3.dot(north, direction);

  const projected = Cesium.Cartesian3.subtract(
    north,
    Cesium.Cartesian3.multiplyByScalar(
      direction,
      dot,
      new Cesium.Cartesian3()
    ),
    new Cesium.Cartesian3()
  );

  return Cesium.Cartesian3.normalize(
    projected,
    new Cesium.Cartesian3()
  );
}

function getFallbackUpVector(destination, direction) {
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(destination);
  const east = toCartesian3(
    Cesium.Matrix4.getColumn(
      enu,
      0,
      new Cesium.Cartesian4()
    )
  );

  const right = Cesium.Cartesian3.normalize(
    east,
    new Cesium.Cartesian3()
  );

  const up = Cesium.Cartesian3.cross(
    right,
    direction,
    new Cesium.Cartesian3()
  );

  return Cesium.Cartesian3.normalize(up, up);
}

export function createEarthFacingOrientation(destination) {
  const direction = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.negate(
      destination,
      new Cesium.Cartesian3()
    ),
    new Cesium.Cartesian3()
  );

  let up = getNorthUpVector(destination, direction);

  if (!isFiniteCartesian3(up)) {
    up = getFallbackUpVector(destination, direction);
  }

  return {
    direction,
    up,
  };
}

export function createFlyDestination({
  lon = 80.0,
  lat = -15.0,
  height = 16000000.0,
} = {}) {
  return Cesium.Cartesian3.fromDegrees(
    lon,
    lat,
    height
  );
}
