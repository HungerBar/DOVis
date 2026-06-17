import {
  useCallback,
  useRef,
  useState,
} from 'react';
import useCesiumAPI from './useCesiumAPI';

const MISSING_POLYGON_MESSAGE =
  'No renderable hypoxia boundary polygon exists for the current parameters. Please adjust the threshold, time, or depth and try again.';

export default function useHypoxiaGeojson(
  timeIndex,
  threshold,
  depthIndex
) {
  const api = useCesiumAPI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  // 加载GeoJSON
  const load = useCallback(async () => {
    if (!api) return;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/hypoxia/boundary2D?time_index=${timeIndex}&threshold=${threshold}&depth_index=${depthIndex}`
      );

      const res = await response.json();

      if (requestId !== requestIdRef.current) return;

      if (!response.ok || res.status === 'error') {
        throw new Error(
          res.detail || `Boundary request failed: HTTP ${response.status}`
        );
      }

      const { boundary_url } = res;

      if (!boundary_url) {
        if (requestId === requestIdRef.current) {
          setError(MISSING_POLYGON_MESSAGE);
        }
        console.warn('[Hypoxia] boundary polygon not found');
        return;
      }

      await api.loadGeoJson(boundary_url);

      if (requestId !== requestIdRef.current) return;

      console.log('[Hypoxia] geojson loaded');
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(e.message || 'Hypoxia boundary load failed');
      console.error('[Hypoxia] load error', e);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [api, timeIndex, threshold, depthIndex]);

  // 清除GeoJSON
  const reset = useCallback((opts) => {
    requestIdRef.current++;
    setError(null);
    api?.clearGeoJson?.(opts);
  }, [api]);

  // 恢复场景（如果你有这个功能）
  const recover = useCallback((opts) => {
    api?.geojsonRecover?.(opts);
  }, [api]);

  return {
    load,
    reset,
    recover,
    loading,
    error,
  };
}
