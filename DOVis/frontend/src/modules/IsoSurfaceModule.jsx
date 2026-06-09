import IsoSurfaceRenderer from '../components/IsoSurfaceRenderer';
import IsoSurfaceControlPanel from '../components/IsoSurfaceControlPanel';

import useIsoSurface from '../hooks/useIsoSurface';
import useCesiumTiles from '../hooks/useCesiumTiles';

export default function IsoSurfaceModule({hidden}) {
  // =====================================
  // IsoSurface State
  // =====================================

  const {
    times,
    timeIndex,
    setTimeIndex,

    isoValue,
    setIsoValue,

    volume,
    shape,
    loading,

    handleExportNc,
  } = useIsoSurface();

  // =====================================
  // Cesium Tiles Command
  // =====================================

  const { load, reset } = useCesiumTiles(
    timeIndex,
    isoValue
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: '#0a0e14',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel */}
      <div style={{ width: 320, flexShrink: 0 }}>
        <IsoSurfaceControlPanel
          times={times}
          timeIndex={timeIndex}
          setTimeIndex={setTimeIndex}
          isoValue={isoValue}
          setIsoValue={setIsoValue}
          onRenderCesium={load}
          endRenderCesium={reset}
          onExportNc={handleExportNc}
        />
      </div>

      {/* Right Render */}
      <div style={{ flex: 1, position: 'relative' }}>
        <IsoSurfaceRenderer
          volume={volume}
          shape={shape}
          isoValue={isoValue}
          loading={loading}
        />
      </div>
    </div>
  );
}
