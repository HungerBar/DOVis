import HypoxiaControlPanel from '../components/HypoxiaControlPanel';
import useHypoxia from '../hooks/useHypoxia';
// import useHypoxiaTiles from '../hooks/useHypoxiaTiles';
import useHypoxiaGeojson from '../hooks/useHypoxiaGeojson';

export default function HypoxiaModule({ hidden }) {
  const {
    times,
    timeIndex,
    setTimeIndex,
    threshold,
    setThreshold,
    depthIndex,
    setDepthIndex,
    loading,
    handleExportNc,
  } = useHypoxia();

  // const { load, reset, recover } = useHypoxiaTiles(timeIndex, threshold);
  const { load, reset, recover } = useHypoxiaGeojson(timeIndex, threshold, depthIndex);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <button
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}
        onClick={() => {
          reset();
          hidden();
        }}
      >
        x
      </button>

      <HypoxiaControlPanel
        times={times}
        timeIndex={timeIndex}
        setTimeIndex={setTimeIndex}
        threshold={threshold}
        setThreshold={setThreshold}
        depthIndex={depthIndex}
        setDepthIndex={setDepthIndex}
        onRenderCesium={load}
        endRenderCesium={recover}
        onExportNc={handleExportNc}
        loading={loading}
      />
    </div>
  );
}