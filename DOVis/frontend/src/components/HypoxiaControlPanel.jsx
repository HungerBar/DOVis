const styles = {
  panel: {
    width: '320px',
    height: '100%',
    padding: '12px 12px',
    background: 'rgba(38, 37, 35, 0.95)',
    color: '#F0F0F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
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
    gap: '4px',
    padding: '10px',
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
    margin: '2px 0',
  },
  timeText: {
    fontSize: '0.8rem',
    color: 'rgba(195,194,190,0.6)',
    padding: '6px 8px',
    background: 'rgba(31,30,28,0.7)',
    borderRadius: '6px',
    wordBreak: 'break-word',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
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
};

const base = new Date("1980-01-01T00:00:00");
const depths = [5.0, 15.1, 25.2, 35.4, 45.6, 55.9, 66.3, 76.8, 87.6, 98.6, 110.1, 122.1, 134.9, 148.7, 164.1, 181.3, 201.3, 224.8, 253.1, 287.6, 330.0, 382.4, 446.7, 525.0, 618.7, 728.7, 855.0, 996.7, 1152.4, 1320.0, 1497.6, 1683.1, 1874.8, 2071.3, 2271.3, 2474.0, 2678.8, 2884.9, 3092.1, 3300.1, 3508.6, 3717.6, 3926.8, 4136.3, 4345.9, 4555.6, 4765.4, 4975.2, 5185.1, 5395.0];
const HypoxiaControlPanel = ({
  times,
  timeIndex,
  setTimeIndex,
  threshold,
  setThreshold,
  depthIndex,
  setDepthIndex,
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
        {/* <div style={styles.timeText}>{times?.[timeIndex] ?? 'Loading...'}</div> */}
        {/* <div style={styles.timeText}>
          {timeObj?.iso
            ? timeObj.iso
            : times?.[timeIndex] ?? 'Loading...'}
        </div> */}

        <div style={styles.timeText}>
          {times?.[timeIndex] != null
            ? new Date(
                base.getTime() +
                times[timeIndex] * 24 * 3600 * 1000
              ).toLocaleDateString()
            : "Loading..."}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Hypoxia Threshold</span>
          <span style={styles.valueText}>{threshold.toFixed(1)} µmol/kg</span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.timeText}>Range: 0 - 500 µmol/kg</div>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <span>Depth Level</span>
          <span style={styles.valueText}>{depthIndex}</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={depthIndex}
          onChange={(e) => setDepthIndex(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.timeText}>
          Depth: {depths?.[depthIndex] != null
            ? `${depths[depthIndex].toFixed(1)} m`
            : "Loading..."}
        </div>
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
          {/* <button
            style={styles.secondaryButton}
            onClick={onExportNc}
          >
            Export Boundary NC
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default HypoxiaControlPanel;
