const styles = {
  panel: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    padding: '16px 14px',
    background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
    flexShrink: 0,
    borderRight: '1px solid rgba(148,163,184,0.15)',
  },

  title: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#e2e8f0',
    textAlign: 'center',
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '8px',
    background: 'rgba(30,41,59,0.7)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: '8px',
  },

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },

  valueText: {
    fontSize: '0.7rem',
    color: '#38bdf8',
    fontWeight: 600,
  },

  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#38bdf8',
  },

  timeText: {
    fontSize: '0.65rem',
    color: '#94a3b8',
    padding: '4px 6px',
    background: 'rgba(15,23,42,0.6)',
    borderRadius: '6px',
    wordBreak: 'break-all',
  },

  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  primaryButton: {
    padding: '6px 8px',
    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    color: '#ffffff',
    border: '1px solid rgba(56,189,248,0.3)',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.7rem',
    cursor: 'pointer',
    width: '100%',
  },

  secondaryButton: {
    padding: '6px 8px',
    background: 'rgba(30,64,175,0.4)',
    color: '#e0f2fe',
    border: '1px solid rgba(96,165,250,0.3)',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.7rem',
    cursor: 'pointer',
    width: '100%',
  },

  modeButton: (active) => ({
    padding: '5px 8px',
    background: active
      ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
      : 'rgba(30,41,59,0.6)',
    color: active ? '#fff' : '#94a3b8',
    border: active
      ? '1px solid rgba(56,189,248,0.4)'
      : '1px solid rgba(148,163,184,0.15)',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.65rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  }),
};

export default function ProfileControlPanel({
  times,
  timeIndex,
  setTimeIndex,
  selectedPoint,
  mode,
  setMode,
  sectionPoints,
  fetchSection,
  clearSectionPoints,
}) {
  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>Vertical Profile</h2>

      {/* Time control */}
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

      {/* Mode switch */}
      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Mode</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            style={styles.modeButton(mode === 'vertical')}
            onClick={() => setMode('vertical')}
          >
            Profile
          </button>
          <button
            style={styles.modeButton(mode === 'section')}
            onClick={() => setMode('section')}
          >
            Section
          </button>
        </div>
      </div>

      {/* Selected point info */}
      {mode === 'vertical' && (
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <span>Selected Point</span>
          </div>
          {selectedPoint ? (
            <div style={{ fontSize: '0.65rem', color: '#cbd5e1', lineHeight: 1.4, wordBreak: 'break-all' }}>
              {selectedPoint.lat.toFixed(2)}°N {selectedPoint.lon.toFixed(2)}°E
            </div>
          ) : (
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
              Click globe
            </div>
          )}
        </div>
      )}

      {/* Section controls */}
      {mode === 'section' && (
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <span>Section Points</span>
            <span style={styles.valueText}>
              {sectionPoints.length} selected
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Click on the globe to add waypoints
          </div>
          {sectionPoints.length >= 2 && (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxHeight: 80, overflowY: 'auto' }}>
              {sectionPoints.map((p, i) => (
                <div key={i}>
                  [{i + 1}] {p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°
                </div>
              ))}
            </div>
          )}
          <div style={styles.buttonGroup}>
            <button
              style={styles.primaryButton}
              onClick={fetchSection}
              disabled={sectionPoints.length < 2}
            >
              Analyze Section
            </button>
            <button
              style={styles.secondaryButton}
              onClick={clearSectionPoints}
            >
              Clear Points
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
