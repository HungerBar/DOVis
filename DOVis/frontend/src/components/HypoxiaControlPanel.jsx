const styles = {
  panel: {
    width: '320px',
    height: '100vh',
    padding: '24px 20px',
    background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
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
    background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(14,165,233,0.25)',
  },
  secondaryButton: {
    flex: 1,
    padding: '12px 14px',
    background: 'rgba(51,65,85,0.85)',
    color: '#f1f5f9',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.92rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

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
    <div style={styles.panel}>
      <h2 style={styles.title}>Hypoxia Boundary</h2>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Time Step</span>
          <span style={styles.valueText}>{timeIndex}</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={timeIndex}
          onChange={(e) => setTimeIndex(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.timeText}>{times?.[timeIndex] ?? 'Loading...'}</div>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Hypoxia Threshold</span>
          <span style={styles.valueText}>{threshold.toFixed(1)} mg/L</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.timeText}>可选范围：0 - 100</div>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Actions</span>
        </div>
        <div style={styles.buttonGroup}>
          <button
            style={styles.primaryButton}
            onClick={onRenderCesium}
            disabled={loading}
          >
            {loading ? 'Rendering...' : 'Render Hypoxia Boundary'}
          </button>
          <button
            style={styles.secondaryButton}
            onClick={() => endRenderCesium?.()}
          >
            End Render Mode
          </button>
          <button
            style={styles.secondaryButton}
            onClick={onExportNc}
          >
            Export Boundary NC
          </button>
        </div>
      </div>
    </div>
  );
};

export default HypoxiaControlPanel;
