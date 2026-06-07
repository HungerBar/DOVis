import {
  CloudDownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const HypoxiaControlPanel = ({
  times,
  timeIndex,
  setTimeIndex,
  threshold,
  setThreshold,
  onRenderCesium,
  endRenderCesium,
  onExportNc,
  loading,
}) => {
  const maxIndex = Math.max((times?.length || 0) - 1, 0);

  return (
    <div className="analysis-panel">
      <div className="analysis-heading">
        <span>Boundary scan</span>
        <strong>Hypoxia</strong>
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
          max={maxIndex}
          value={timeIndex}
          onChange={(event) => setTimeIndex(Number(event.target.value))}
        />
        <p>{times?.[timeIndex] || 'Loading'}</p>
      </section>

      <section className="control-band">
        <div className="control-row">
          <span>Threshold</span>
          <strong>{threshold.toFixed(1)} mg/L</strong>
        </div>
        <input
          aria-label="Hypoxia threshold"
          type="range"
          min={0}
          max={100}
          step={1}
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
        />
      </section>

      <section className="action-grid">
        <button
          className="primary-action"
          onClick={onRenderCesium}
          disabled={loading}
        >
          <PlayCircleOutlined />
          <span>{loading ? 'Rendering' : 'Render boundary'}</span>
        </button>
        <button className="quiet-action" onClick={() => endRenderCesium?.()}>
          <PauseCircleOutlined />
          <span>End render</span>
        </button>
        <button className="quiet-action" onClick={onExportNc}>
          <CloudDownloadOutlined />
          <span>Export NC</span>
        </button>
      </section>
    </div>
  );
};

export default HypoxiaControlPanel;
