const styles = {
  panel: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    padding: '16px 14px',
    background: 'rgba(38, 37, 35, 0.95)',
    color: '#F0F0F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
    flexShrink: 0,
    borderRight: '1px solid rgba(218,217,215,0.08)',
  },

  title: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#F0F0F0',
    textAlign: 'center',
    fontFamily: "'Playfair Display', serif",
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '8px',
    background: 'rgba(49, 48, 46, 0.6)',
    border: '1px solid rgba(218,217,215,0.08)',
    borderRadius: '6px',
  },

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#C3C2BE',
  },

  valueText: {
    fontSize: '0.7rem',
    color: '#DAD9D7',
    fontWeight: 600,
  },

  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#DAD9D7',
  },

  timeText: {
    fontSize: '0.65rem',
    color: 'rgba(195,194,190,0.6)',
    padding: '4px 6px',
    background: 'rgba(31,30,28,0.6)',
    borderRadius: '4px',
    wordBreak: 'break-all',
  },

  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  primaryButton: {
    padding: '6px 8px',
    background: 'rgba(218, 217, 215, 0.88)',
    color: '#1a1918',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.7rem',
    cursor: 'pointer',
    width: '100%',
  },

  secondaryButton: {
    padding: '6px 8px',
    background: 'rgba(49, 48, 46, 0.85)',
    color: '#C3C2BE',
    border: '1px solid rgba(218,217,215,0.12)',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.7rem',
    cursor: 'pointer',
    width: '100%',
  },

  modeButton: (active) => ({
    padding: '5px 8px',
    background: active
      ? 'rgba(218, 217, 215, 0.88)'
      : 'rgba(49,48,46,0.6)',
    color: active ? '#1a1918' : 'rgba(195,194,190,0.6)',
    border: active
      ? 'none'
      : '1px solid rgba(218,217,215,0.1)',
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

      {mode === 'vertical' && (
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <span>Selected Point</span>
          </div>
          {selectedPoint ? (
            <div style={{ fontSize: '0.65rem', color: '#C3C2BE', lineHeight: 1.4, wordBreak: 'break-all' }}>
              {selectedPoint.lat.toFixed(2)}°N {selectedPoint.lon.toFixed(2)}°E
            </div>
          ) : (
            <div style={{ fontSize: '0.65rem', color: 'rgba(195,194,190,0.5)' }}>
              Click globe
            </div>
          )}
        </div>
      )}

      {mode === 'section' && (
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <span>Section Points</span>
            <span style={styles.valueText}>
              {sectionPoints.length} selected
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(195,194,190,0.5)' }}>
            Click on the globe to add waypoints
          </div>
          {sectionPoints.length >= 2 && (
            <div style={{ fontSize: '0.8rem', color: 'rgba(195,194,190,0.6)', maxHeight: 80, overflowY: 'auto' }}>
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
