import { useEffect, useState } from 'react';
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

  const [renderActive, setRenderActive] = useState(false);

  useEffect(() => {
    if (!renderActive) return;

    load();
  }, [renderActive, load]);

  useEffect(() => {
    registerCleanup?.(() => {
      setRenderActive(false);
      reset();
    });
  }, [registerCleanup, reset]);

  const handleRenderCesium = async () => {
    if (renderActive) {
      await load();
      return;
    }

    setRenderActive(true);
  };

  const handleEndRenderCesium = () => {
    setRenderActive(false);
    reset();
  };

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
        onRenderCesium={handleRenderCesium}
        endRenderCesium={handleEndRenderCesium}
        loading={loading || boundaryLoading}
        polygonError={boundaryError}
        renderActive={renderActive}
      />
    </div>
  );
}
