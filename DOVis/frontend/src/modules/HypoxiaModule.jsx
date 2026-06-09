import HypoxiaControlPanel from '../components/HypoxiaControlPanel';
import useHypoxia from '../hooks/useHypoxia';
import useHypoxiaTiles from '../hooks/useHypoxiaTiles';

export default function HypoxiaModule({ hidden }) {
  const {
    times,
    timeIndex,
    setTimeIndex,
    threshold,
    setThreshold,
    loading,
    handleExportNc,
  } = useHypoxia();

  const { load, reset, recover } = useHypoxiaTiles(timeIndex, threshold);

  return (
    <HypoxiaControlPanel
      times={times}
      timeIndex={timeIndex}
      setTimeIndex={setTimeIndex}
      threshold={threshold}
      setThreshold={setThreshold}
      onRenderCesium={load}
      endRenderCesium={() => { recover(); }}
      onExportNc={handleExportNc}
      loading={loading}
    />
  );
}