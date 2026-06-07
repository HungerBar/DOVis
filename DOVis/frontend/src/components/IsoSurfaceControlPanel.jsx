import {
  CloudDownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const IsoSurfaceControlPanel = ({
  times,
  timeIndex,
  setTimeIndex,
  isoValue,
  setIsoValue,
  onRenderCesium,
  endRenderCesium,
  onExportNc,
}) => {
  return (
    <div className="analysis-panel">
      <div className="analysis-heading">
        <span>Oxygen layer</span>
        <strong>Indian Ocean</strong>
      </div>

      <section className="control-band">
        <div className="control-row">
          <span>Time step</span>
          <strong>{timeIndex}</strong>
        </div>
        <input
          aria-label="Time step"
          type="range"
          min={0}
          max={Math.max(times.length - 1, 0)}
          value={timeIndex}
          onChange={(event) => setTimeIndex(Number(event.target.value))}
        />
        <p>{times?.[timeIndex] || 'Loading'}</p>
      </section>

      <section className="control-band">
        <div className="control-row">
          <span>Isosurface value</span>
          <strong>{isoValue} umol/kg</strong>
        </div>
        <input
          aria-label="Isosurface value"
          type="range"
          min={0}
          max={500}
          step={1}
          value={isoValue}
          onChange={(event) => setIsoValue(Number(event.target.value))}
        />
      </section>

      <section className="action-grid">
        <button className="primary-action" onClick={onRenderCesium}>
          <PlayCircleOutlined />
          <span>Render tiles</span>
        </button>
        <button className="quiet-action" onClick={endRenderCesium}>
          <PauseCircleOutlined />
          <span>End render</span>
        </button>
        <button className="quiet-action" onClick={onExportNc}>
          <CloudDownloadOutlined />
          <span>Export NetCDF</span>
        </button>
      </section>
    </div>
  );
};

export default IsoSurfaceControlPanel;
