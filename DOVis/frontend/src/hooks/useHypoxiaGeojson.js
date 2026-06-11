import { useCallback } from 'react';
import useCesiumAPI from './useCesiumAPI';

export default function useHypoxiaGeojson(
  timeIndex,
  threshold,
  depthIndex
) {
  const api = useCesiumAPI();

  // 加载GeoJSON
  const load = useCallback(async () => {
    if (!api) return;

    try {
      const res = await fetch(
        `/api/hypoxia/boundary2D?time_index=${timeIndex}&threshold=${threshold}&depth_index=${depthIndex}`
      ).then(r => r.json());

      const { boundary_url } = res;

      if (!boundary_url) {
        console.warn('[Hypoxia] geojson_url not found');
        return;
      }

      await api.loadGeoJson(boundary_url);

      console.log('[Hypoxia] geojson loaded');
    } catch (e) {
      console.error('[Hypoxia] load error', e);
    }
  }, [api, timeIndex, threshold, depthIndex]);

  // 清除GeoJSON
  const reset = useCallback(() => {
    api?.clearGeoJson?.();
  }, [api]);

  // 恢复场景（如果你有这个功能）
  const recover = useCallback((opts) => {
    api?.geojsonRecover?.(opts);
  }, [api]);

  return {
    load,
    reset,
    recover,
  };
}