import IsoSurfaceRenderer from '../components/IsoSurfaceRenderer';
import IsoSurfaceControlPanel from '../components/IsoSurfaceControlPanel';

import useIsoSurface from '../hooks/useIsoSurface';
import useCesiumTiles from '../hooks/useCesiumTiles';
import { div } from 'three/src/nodes/math/OperatorNode.js';

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
    <div>
      <button
        style={{
          position: 'absolute',
          top: 1,
          right: 1,
          zIndex: 5,
          background: 'transparent',
          border: 'none',

          color: '#fff',
          cursor: 'pointer'
        }} 
        onClick={() => {
        reset();
        hidden();
      }}>
        x
      </button>

      <div
        style={{
          display: 'flex',
          height: '100%',
          background: '#0b1220',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Left Panel */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
          }}
        >
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
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          <IsoSurfaceRenderer
            volume={volume}
            shape={shape}
            isoValue={isoValue}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
