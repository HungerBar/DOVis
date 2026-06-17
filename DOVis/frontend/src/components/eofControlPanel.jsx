import { depthLevels } from '../config/depthLevels';

const base = new Date("1980-01-01T00:00:00");

function formatTimeValue(times, index) {
  const value = times?.[index];
  if (value == null) return `M${index}`;

  return new Date(
    base.getTime() + value * 24 * 3600 * 1000
  ).toLocaleDateString();
}

const styles = {
  panel: {
    width: '320px',
    height: '100%',
    padding: '24px 20px',
    background: 'rgba(38, 37, 35, 0.95)',
    color: '#F0F0F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto'
  },
  section: { display: 'flex', flexDirection: 'column', gap: '10px' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontWeight: 600, fontSize: "13px", color: "#C3C2BE" },
  valueBadge: {
    background: 'rgba(49,48,46,0.8)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#DAD9D7',
    border: '1px solid rgba(218,217,215,0.1)',
    fontFamily: 'monospace'
  },
  sliderContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
  slider: { flex: 1, accentColor: '#DAD9D7', cursor: 'pointer', height: '6px', borderRadius: '3px' },
  select: { padding: '8px', background: 'rgba(49,48,46,0.8)', border: '1px solid rgba(218,217,215,0.1)', color: '#F0F0F0', borderRadius: '4px', cursor: 'pointer' },
  numberInput: { padding: '8px', background: 'rgba(49,48,46,0.8)', border: '1px solid rgba(218,217,215,0.1)', color: '#F0F0F0', borderRadius: '4px', fontFamily: 'monospace' },
  button: { padding: '12px', cursor: 'pointer', background: 'rgba(218,217,215,0.88)', color: '#1a1918', border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: 'background-color 0.2s' },
  secondaryButton: { padding: '10px 12px', cursor: 'pointer', background: 'rgba(49,48,46,0.8)', color: '#DAD9D7', border: '1px solid rgba(218,217,215,0.12)', borderRadius: '6px', fontWeight: 600 },
  mutedText: { fontSize: '12px', color: 'rgba(195,194,190,0.62)', lineHeight: 1.45 },
  warningText: { fontSize: '12px', color: '#fca5a5', lineHeight: 1.45 },

  dualSliderWrapper: {
    position: 'relative',
    width: '100%',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    marginTop: '4px'
  }
};

export default function EOFControlPanel({
  times,
  datasetId, setDatasetId,
  modeType, setModeType,
  depth, setDepth,
  sectionType, setSectionType,
  sectionValue, setSectionValue,
  timeRange, setTimeRange,
  modeNum, setModeNum,
  highValuePercentile, setHighValuePercentile,
  result,
  loading,
  overlayLoading,
  overlayError,
  overlayMeta,
  renderFirstModeHighValue,
  clearFirstModeHighValue,
  runEOF
}) {

  const isLat = sectionType === 'lat';
  const sliderMin = isLat ? -40 : 30;
  const sliderMax = isLat ? 30 : 120;
  const sliderStep = 0.25;
  const maxTimeIndex = Math.max((times?.length || 480) - 1, 0);
  const depthIndex = Math.floor(Number(depth));
  const depthValue = depthLevels?.[depthIndex];
  const startDateLabel = formatTimeValue(times, timeRange[0]);
  const endDateLabel = formatTimeValue(times, timeRange[1]);

  const minPct = maxTimeIndex > 0 ? (timeRange[0] / maxTimeIndex) * 100 : 0;
  const maxPct = maxTimeIndex > 0 ? (timeRange[1] / maxTimeIndex) * 100 : 0;

  return (
    <div style={styles.panel}>
      <style>{`
        .eof-dual-input {
          position: absolute;
          width: 100%;
          background: none;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
        }
        .eof-dual-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #DAD9D7;
          border: 2px solid #1a1918;
          cursor: pointer;
          pointer-events: auto;
          transition: transform 0.1s;
        }
        .eof-dual-input::-webkit-slider-thumb:active {
          transform: scale(1.2);
          background: #F0F0F0;
        }
        .eof-dual-input::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #DAD9D7;
          border: 2px solid #1a1918;
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>

      <h3 style={{ margin: '0 0 5px 0', borderBottom: '1px solid rgba(218,217,215,0.08)', paddingBottom: '10px', fontSize: '16px', fontFamily: "'Playfair Display', serif" }}>EOF Analysis</h3>

      <div style={styles.section}>
        <label style={styles.label}>Dataset</label>
        <select style={styles.select} value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
          <option value="do_predict">Indian Ocean Dataset (do_predict)</option>
        </select>
      </div>

      <div style={styles.section}>
        <select style={styles.select} value={modeType} onChange={(e) => setModeType(e.target.value)}>
          <option value="horizontal">Horizontal (水平等深面)</option>
          <option value="section">Section (垂直剖面)</option>
        </select>
      </div>

      {modeType === "horizontal" && (
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.label}>Depth Level</label>
            <span style={styles.valueBadge}>
              {depthValue != null ? `${depthValue.toFixed(1)} m` : `Layer ${depthIndex}`}
            </span>
          </div>
          <div style={styles.mutedText}>Layer {depthIndex}</div>
          <div style={styles.sliderContainer}>
            <input
              style={styles.slider}
              type="range"
              min={0}
              max={depthLevels.length - 1}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {modeType === "section" && (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Section Axis</label>
            <select style={styles.select} value={sectionType} onChange={(e) => {
              setSectionType(e.target.value);
              setSectionValue(e.target.value === 'lat' ? 0.0 : 75.0);
            }}>
              <option value="lat">Latitude slice</option>
              <option value="lon">Longitude slice</option>
            </select>
          </div>

          <div style={styles.section}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Position</label>
              <span style={styles.valueBadge}>
                {sectionValue.toFixed(2)}°{isLat ? (sectionValue >= 0 ? 'N' : 'S') : 'E'}
              </span>
            </div>
            <div style={styles.sliderContainer}>
              <input
                style={styles.slider}
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={sectionValue}
                onChange={(e) => setSectionValue(Number(e.target.value))}
              />
            </div>
          </div>
        </>
      )}

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <label style={styles.label}>Time Range</label>
        </div>
        <div style={styles.valueBadge}>{startDateLabel} - {endDateLabel}</div>
        <div style={styles.mutedText}>Index {timeRange[0]} - {timeRange[1]}</div>

        <div style={styles.dualSliderWrapper}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '6px', background: 'rgba(49,48,46,0.8)', borderRadius: '3px' }} />
          <div style={{
            position: 'absolute',
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
            height: '6px',
            background: 'rgba(218,217,215,0.45)',
            borderRadius: '3px'
          }} />

          <input
            type="range"
            min={0}
            max={maxTimeIndex}
            value={timeRange[0]}
            className="eof-dual-input"
            style={{ zIndex: timeRange[0] > 240 ? 4 : 3 }}
            onChange={(e) => {
              const val = Number(e.target.value);
              const safeVal = Math.min(val, timeRange[1] - 1);
              setTimeRange([safeVal, timeRange[1]]);
            }}
          />

          <input
            type="range"
            min={0}
            max={maxTimeIndex}
            value={timeRange[1]}
            className="eof-dual-input"
            style={{ zIndex: 3 }}
            onChange={(e) => {
              const val = Number(e.target.value);
              const safeVal = Math.max(val, timeRange[0] + 1);
              setTimeRange([timeRange[0], safeVal]);
            }}
          />
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Mode Count</label>
        <select
          style={styles.select}
          value={modeNum}
          onChange={(e) => setModeNum(Number(e.target.value))}
        >
          <option value={1}>1 mode</option>
          <option value={2}>2 modes</option>
          <option value={3}>3 modes</option>
          <option value={4}>4 modes</option>
          <option value={5}>5 modes</option>
        </select>
      </div>

      <div style={styles.section}>
        <div style={styles.labelRow}>
          <label style={styles.label}>High-Value Percentile</label>
          <span style={styles.valueBadge}>P{highValuePercentile}</span>
        </div>
        <input
          style={styles.numberInput}
          type="number"
          min={1}
          max={99}
          step={1}
          value={highValuePercentile}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (!Number.isFinite(value)) return;
            setHighValuePercentile(Math.min(Math.max(value, 1), 99));
          }}
        />
        <div style={styles.mutedText}>Used when rendering EOF1 high-value cells in Cesium.</div>
      </div>

      <button
        style={{ ...styles.button, background: loading ? 'rgba(49,48,46,0.8)' : 'rgba(218,217,215,0.88)', color: loading ? 'rgba(195,194,190,0.5)' : '#1a1918' }}
        onClick={runEOF}
        disabled={loading}
      >
        {loading ? "Computing..." : "Run EOF"}
      </button>

      <div style={styles.section}>
        <label style={styles.label}>Cesium Overlay</label>
        <button
          style={{
            ...styles.button,
            background: (!result || result.mode_type !== "horizontal" || overlayLoading)
              ? 'rgba(49,48,46,0.8)'
              : 'rgba(249,115,22,0.88)',
            color: (!result || result.mode_type !== "horizontal" || overlayLoading)
              ? 'rgba(195,194,190,0.5)'
              : '#1a1918',
          }}
          onClick={renderFirstModeHighValue}
          disabled={!result || result.mode_type !== "horizontal" || overlayLoading}
        >
          {overlayLoading ? "Rendering..." : "Show EOF1 High-Value Region"}
        </button>
        <button
          style={styles.secondaryButton}
          onClick={() => clearFirstModeHighValue?.()}
        >
          Clear EOF Overlay
        </button>
        {overlayMeta && (
          <div style={styles.mutedText}>
            P{Math.round(overlayMeta.percentile * 100)} threshold: {overlayMeta.threshold.toExponential(3)};
            cells: {overlayMeta.cellCount}
          </div>
        )}
        {!result && (
          <div style={styles.mutedText}>Run horizontal EOF before rendering the first-mode high-value region.</div>
        )}
        {result?.mode_type === "section" && (
          <div style={styles.mutedText}>Section EOF is vertical; only horizontal EOF can be projected onto Cesium.</div>
        )}
        {overlayError && (
          <div style={styles.warningText}>{overlayError}</div>
        )}
      </div>

    </div>
  );
}
