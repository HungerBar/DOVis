import * as Cesium from 'cesium';

export default class CesiumTilesRenderer {
  constructor(viewer) {
    this.viewer = viewer;

    this.tileset = null;

    this.requestId = 0;
    this.currentUrl = null;
  }

  async load(url, options = {}) {
    if (!this.viewer) return null;

    // ✅ 打印接收到的 URL
    console.log('[CesiumTilesRenderer] Received URL:', url);
    console.log('[CesiumTilesRenderer] URL type:', typeof url);
    console.log('[CesiumTilesRenderer] URL is valid:', Boolean(url));

    const id = ++this.requestId;
    console.log('[CesiumTilesRenderer] Request ID:', id);

    if (
      this.currentUrl === url &&
      this.tileset &&
      !this.tileset.isDestroyed?.()
    ) {
      console.log('[CesiumTilesRenderer] Using cached tileset');
      return this.tileset;
    }

    const oldTileset = this.tileset;
    this.viewer.camera.cancelFlight?.();

    try {
      console.log('[CesiumTilesRenderer] Starting to load tileset from:', url);

      const tileset = await Cesium.Cesium3DTileset.fromUrl(url);

      console.log('[CesiumTilesRenderer] Tileset loaded successfully');
      console.log('[CesiumTilesRenderer] Tileset object:', tileset);

      if (id !== this.requestId) {
        console.log('[CesiumTilesRenderer] Request ID mismatch, canceling');
        this.safeRemove(tileset);
        return null;
      }

      console.log('[CesiumTilesRenderer] Adding tileset to scene');
      this.viewer.scene.primitives.add(tileset);
      this.tileset = tileset;
      this.currentUrl = url;

      if (options.autoZoom) {
        console.log('[CesiumTilesRenderer] Auto-flying to Indian Ocean');

        const lon = options.flyLon ?? 80.0;
        const lat = options.flyLat ?? -15.0;
        const height = options.flyHeight ?? 16000000.0;

        const destination = Cesium.Cartesian3.fromDegrees(
          lon,
          lat,
          height
        );

        // =====================================================
        // 1. direction: camera looks at Earth center
        // =====================================================

        const direction = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.negate(
            destination,
            new Cesium.Cartesian3()
          ),
          new Cesium.Cartesian3()
        );

        // =====================================================
        // 2. local ENU frame at camera position
        // =====================================================
        // ENU:
        //   column 0 = east
        //   column 1 = north
        //   column 2 = up
        // =====================================================

        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(destination);

        const east4 = Cesium.Matrix4.getColumn(
          enu,
          0,
          new Cesium.Cartesian4()
        );

        const north4 = Cesium.Matrix4.getColumn(
          enu,
          1,
          new Cesium.Cartesian4()
        );

        const east = new Cesium.Cartesian3(
          east4.x,
          east4.y,
          east4.z
        );

        const north = new Cesium.Cartesian3(
          north4.x,
          north4.y,
          north4.z
        );

        // =====================================================
        // 3. up: project local north onto the plane perpendicular
        //    to viewing direction.
        //
        // This keeps north visually upward and prevents pole flip.
        // =====================================================

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

        let up = Cesium.Cartesian3.normalize(
          projected,
          new Cesium.Cartesian3()
        );

        // 极端情况下 fallback，用 east 构造稳定 up
        if (
          !Cesium.defined(up) ||
          !Number.isFinite(up.x) ||
          !Number.isFinite(up.y) ||
          !Number.isFinite(up.z)
        ) {
          const right = Cesium.Cartesian3.normalize(
            east,
            new Cesium.Cartesian3()
          );

          up = Cesium.Cartesian3.cross(
            right,
            direction,
            new Cesium.Cartesian3()
          );

          Cesium.Cartesian3.normalize(
            up,
            up
          );
        }

        await this.viewer.camera.flyTo({
          destination,
          orientation: {
            direction,
            up,
          },
          duration: options.flyDuration ?? 1.5,
        });

        if (id !== this.requestId) {
          console.log('[CesiumTilesRenderer] Request cancelled during flyTo');
          return null;
        }
      }

      if (oldTileset) {
        console.log('[CesiumTilesRenderer] Removing old tileset');
        this.safeRemove(oldTileset);
      }

      console.log('[CesiumTilesRenderer] Load completed successfully');
      return tileset;
    } catch (e) {
      console.error('[CesiumTilesRenderer] Error details:');
      console.error('  Message:', e.message);
      console.error('  Name:', e.name);
      console.error('  URL was:', url);
      console.error('  Full error:', e);
      return null;
    }
  }

  safeRemove(tileset) {
    if (!tileset) return;

    try {
      this.viewer?.camera?.cancelFlight?.();
    } catch { }

    try {
      this.viewer?.scene?.primitives?.remove?.(tileset);
    } catch { }

    requestAnimationFrame(() => {
      try {
        if (!tileset.isDestroyed?.()) {
          tileset.destroy?.();
        }
      } catch { }
    });
  }

  destroy() {
    this.requestId++;

    this.currentUrl = null;

    try {
      this.viewer?.camera?.cancelFlight?.();
    } catch { }

    if (this.tileset) {
      this.safeRemove(this.tileset);
      this.tileset = null;
    }
  }
}