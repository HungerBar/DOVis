const styles = {
  panel: {
    width: '320px',
    height: '100%',
    padding: '24px 20px',
    background: '#111827',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto'
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  label: {
    fontWeight: 600
  },

  input: {
    padding: '8px'
  },

  button: {
    padding: '12px',
    cursor: 'pointer'
  }
};

export default function EOFControlPanel({

  datasetId,
  setDatasetId,

  modeType,
  setModeType,

  depth,
  setDepth,

  sectionType,
  setSectionType,

  sectionValue,
  setSectionValue,

  timeRange,
  setTimeRange,

  modeNum,
  setModeNum,

  loading,

  runEOF

}) {

  return (
    <div style={styles.panel}>

      <h2>EOF Analysis</h2>

      {/* Dataset */}

      <div style={styles.section}>
        <label style={styles.label}>Dataset</label>

        <select
          value={datasetId}
          onChange={(e)=>setDatasetId(e.target.value)}
        >
          <option value="do_predict">
            do_predict
          </option>
        </select>
      </div>

      {/* Mode */}

      <div style={styles.section}>
        <label style={styles.label}>EOF Mode</label>

        <select
          value={modeType}
          onChange={(e)=>setModeType(e.target.value)}
        >
          <option value="horizontal">
            Horizontal
          </option>

          <option value="section">
            Section
          </option>
        </select>
      </div>

      {/* Horizontal */}

      {modeType === "horizontal" && (

        <div style={styles.section}>
          <label style={styles.label}>Depth</label>

          <input
            type="number"
            value={depth}
            onChange={(e)=>setDepth(Number(e.target.value))}
          />
        </div>

      )}

      {/* Section */}

      {modeType === "section" && (

        <>
          <div style={styles.section}>
            <label style={styles.label}>Section Type</label>

            <select
              value={sectionType}
              onChange={(e)=>setSectionType(e.target.value)}
            >
              <option value="lat">
                Latitude
              </option>

              <option value="lon">
                Longitude
              </option>
            </select>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Value</label>

            <input
              type="number"
              value={sectionValue}
              onChange={(e)=>
                setSectionValue(Number(e.target.value))
              }
            />
          </div>
        </>
      )}

      {/* Time Range */}

      <div style={styles.section}>
        <label style={styles.label}>Time Start</label>

        <input
          type="number"
          value={timeRange[0]}
          onChange={(e)=>
            setTimeRange([
              Number(e.target.value),
              timeRange[1]
            ])
          }
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Time End</label>

        <input
          type="number"
          value={timeRange[1]}
          onChange={(e)=>
            setTimeRange([
              timeRange[0],
              Number(e.target.value)
            ])
          }
        />
      </div>

      {/* EOF Modes */}

      <div style={styles.section}>
        <label style={styles.label}>
          Mode Number
        </label>

        <input
          type="number"
          value={modeNum}
          onChange={(e)=>
            setModeNum(Number(e.target.value))
          }
        />
      </div>

      {/* Run */}
      <button
        style={styles.button}
        onClick={runEOF}
        disabled={loading}
      >
        {loading ? "Running..." : "Run EOF"}
      </button>

    </div>
  );
}