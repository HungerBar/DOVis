import { useEffect } from 'react';
import HypoxiaControlPanel from '../components/HypoxiaControlPanel';
import useHypoxia from '../hooks/useHypoxia';
// import useHypoxiaTiles from '../hooks/useHypoxiaTiles';
import useHypoxiaGeojson from '../hooks/useHypoxiaGeojson';

export default function HypoxiaModule({ registerCleanup }) {
  const {
    times,
    timeIndex,
    setTimeIndex,
    threshold,
    setThreshold,
    depthIndex,
    setDepthIndex,
    loading,
  } = useHypoxia();

  // const { load, reset, recover } = useHypoxiaTiles(timeIndex, threshold);
  const {
    load,
    reset,
    loading: boundaryLoading,
    error: boundaryError,
  } = useHypoxiaGeojson(timeIndex, threshold, depthIndex);

  useEffect(() => {
    registerCleanup?.(() => reset());
  }, [registerCleanup, reset]);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <HypoxiaControlPanel
        times={times}
        timeIndex={timeIndex}
        setTimeIndex={setTimeIndex}
        threshold={threshold}
        setThreshold={setThreshold}
        depthIndex={depthIndex}
        setDepthIndex={setDepthIndex}
        onRenderCesium={load}
        endRenderCesium={reset}
        loading={loading || boundaryLoading}
        polygonError={boundaryError}
      />
    </div>
  );
}
