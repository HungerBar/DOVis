const styles = {
  panel: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    padding: '24px 20px',
    background: 'rgba(38, 37, 35, 0.95)',
    color: '#F0F0F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarGutter: 'stable',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(218,217,215,0.25) rgba(38,37,35,0.7)',
    flexShrink: 0,
    borderRight: '1px solid rgba(218,217,215,0.08)',
  },

  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: '#F0F0F0',
    fontFamily: "'Playfair Display', serif",
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: 'rgba(49, 48, 46, 0.6)',
    border: '1px solid rgba(218,217,215,0.08)',
    borderRadius: '8px',
  },

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#C3C2BE',
  },

  valueText: {
    fontSize: '0.9rem',
    color: '#DAD9D7',
    fontWeight: 600,
  },

  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#DAD9D7',
  },

  timeText: {
    fontSize: '0.85rem',
    color: 'rgba(195,194,190,0.6)',
    padding: '8px 10px',
    background: 'rgba(31,30,28,0.7)',
    borderRadius: '6px',
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
    background: 'rgba(218, 217, 215, 0.88)',
    color: '#1a1918',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  secondaryButton: {
    flex: 1,
    padding: '12px 14px',
    background: 'rgba(49, 48, 46, 0.85)',
    color: '#C3C2BE',
    border: '1px solid rgba(218,217,215,0.12)',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  previewButton: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(218,217,215,0.15)',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: '#F0F0F0',
    background: 'rgba(49, 48, 46, 0.85)',
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
          style={styles.previewButton}
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
