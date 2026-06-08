const styles = {
  panel: {
    width: '100%',
    height: '100%',
    minHeight: 0,

    padding: '24px 20px',
    background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
    color: '#f8fafc',

    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',

    overflowY: 'auto',
    overflowX: 'hidden',

    scrollbarGutter: 'stable',
    scrollbarWidth: 'thin',
    scrollbarColor: '#38bdf8 rgba(15,23,42,0.7)',

    flexShrink: 0,
    borderRight: '1px solid rgba(148,163,184,0.15)',
    boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
  },

  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: '#e2e8f0',
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: 'rgba(30,41,59,0.75)',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: '16px',
    backdropFilter: 'blur(8px)',
  },

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },

  valueText: {
    fontSize: '0.9rem',
    color: '#38bdf8',
    fontWeight: 600,
  },

  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#38bdf8',
  },

  timeText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    padding: '8px 10px',
    background: 'rgba(15,23,42,0.7)',
    borderRadius: '10px',
    wordBreak: 'break-word',
  },

  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },

  primaryButton: {
    flex: 1,
    padding: '12px 14px',
    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    color: '#ffffff',
    border: '1px solid rgba(56,189,248,0.35)',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(37,99,235,0.28)',
  },

  secondaryButton: {
    flex: 1,
    padding: '12px 14px',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    color: '#e0f2fe',
    border: '1px solid rgba(96,165,250,0.35)',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 10px rgba(30,64,175,0.22)',
  },

  previewButton: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(56,189,248,0.35)',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#ffffff',
  },
};

const IsoSurfaceControlPanel = ({
  times,
  timeIndex,
  setTimeIndex,
  isoValue,
  setIsoValue,

  onRenderCesium,
  endRenderCesium,
  onExportNc,

  previewVisible,
  onTogglePreview,
}) => {
  return (
    <div className="iso-control-panel" style={styles.panel}>
      <h2 style={styles.title}>
        Indian Ocean Oxygen
      </h2>

      {/* 时间控制 */}
      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Time Step</span>
          <span style={styles.valueText}>{timeIndex}</span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(times.length - 1, 0)}
          value={timeIndex}
          onChange={(e) => setTimeIndex(Number(e.target.value))}
          style={styles.slider}
        />

        <div style={styles.timeText}>
          {times?.[timeIndex] || 'Loading...'}
        </div>
      </div>

      {/* 等值面阈值 */}
      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Isosurface Value</span>
          <span style={styles.valueText}>
            {isoValue} µmol/kg
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={500}
          step={1}
          value={isoValue}
          onChange={(e) => setIsoValue(Number(e.target.value))}
          style={styles.slider}
        />
      </div>

      {/* 预览控制 */}
      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Preview</span>
          <span style={styles.valueText}>
            {previewVisible ? 'Shown' : 'Hidden'}
          </span>
        </div>

        <button
          style={{
            ...styles.previewButton,
            background: previewVisible
              ? 'linear-gradient(135deg, #0369a1 0%, #1e40af 100%)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            boxShadow: previewVisible
              ? '0 4px 12px rgba(30,64,175,0.28)'
              : '0 4px 12px rgba(14,165,233,0.28)',
          }}
          onClick={onTogglePreview}
        >
          {previewVisible ? 'Hide Preview Renderer' : 'Show Preview Renderer'}
        </button>
      </div>

      {/* 核心功能区 */}
      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Actions</span>
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={styles.primaryButton}
            onClick={onRenderCesium}
          >
            Render 3D Tiles in Cesium
          </button>

          <button
            style={styles.secondaryButton}
            onClick={endRenderCesium}
          >
            End Render Mode
          </button>

          <button
            style={styles.secondaryButton}
            onClick={onExportNc}
          >
            Export NetCDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default IsoSurfaceControlPanel;