import { useCallback, useState } from 'react';
import useCesiumAPI from './useCesiumAPI';

export default function useCesiumTiles(
  timeIndex,
  isoValue
) {
  const api = useCesiumAPI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!api) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/export_tileset?time_index=${timeIndex}&iso_value=${isoValue}`
      ).then(r => r.json());

      const { tileset_url } = res;

      if (!tileset_url) return;

      await api.loadTileset(tileset_url);

      console.log('[Cesium] loaded');
    } catch (e) {
      setError(e.message || 'Tileset load failed');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [api, timeIndex, isoValue]);

  const reset = useCallback((opts) => {
    setError(null);
    api?.clearTileset?.(opts);
  }, [api]);

  const recover = useCallback(() => {
    api?.tilesRecover?.();
  }, [api]);

  return {
    load,
    reset,
    recover,
    loading,
    error,
  };
}
