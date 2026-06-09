import { useCallback } from 'react';
import useCesiumAPI from './useCesiumAPI';

export default function useHypoxiaTiles(
  timeIndex,
  threshold
) {
  const api = useCesiumAPI();

  const load = useCallback(async () => {
    if (!api) return;

    try {
      const res = await fetch(
        `/api/hypoxia/boundary?time_index=${timeIndex}&threshold=${threshold}`
      ).then(r => r.json());

      const { tileset_url } = res;

      if (!tileset_url) return;

      await api.loadTileset(tileset_url);

      console.log('[Hypoxia] tiles loaded');
    } catch (e) {
      console.error('[Hypoxia] load error', e);
    }
  }, [api, timeIndex, threshold]);

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