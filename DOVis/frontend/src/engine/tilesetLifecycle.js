/* eslint-disable no-empty */
export function safeRemoveTileset(viewer, tileset) {
  if (!tileset) return;

  try {
    viewer?.camera?.cancelFlight?.();
  } catch { }

  try {
    viewer?.scene?.primitives?.remove?.(tileset);
  } catch { }

  requestAnimationFrame(() => {
    try {
      if (!tileset.isDestroyed?.()) {
        tileset.destroy?.();
      }
    } catch { }
  });
}
