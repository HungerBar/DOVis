import { useCallback } from 'react';
import useCesiumAPI from './useCesiumAPI';

export default function useCesiumTiles(
  timeIndex,
  isoValue
) {
  const api = useCesiumAPI();

  const load = useCallback(async () => {
    if (!api) return;

    try {
      const res = await fetch(
        `/api/export_tileset?time_index=${timeIndex}&iso_value=${isoValue}`
      ).then(r => r.json());

      const { tileset_url } = res;

      if (!tileset_url) return;

      await api.loadTileset(tileset_url);

      console.log('[Cesium] loaded');
    } catch (e) {
      console.error(e);
    }
  }, [api, timeIndex, isoValue]);

  const reset = useCallback(() => {
    api?.clearTileset?.();
  }, [api]);

  const recover = useCallback(() => {
    api?.tilesRecover?.();
  }, [api]);

  return {
    load,
    reset,
    recover,
  };
}