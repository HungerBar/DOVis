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
        console.log('[CesiumTilesRenderer] Auto-zooming to tileset');
        await this.viewer.zoomTo(tileset);

        if (id !== this.requestId) {
          console.log('[CesiumTilesRenderer] Request cancelled during zoom');
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