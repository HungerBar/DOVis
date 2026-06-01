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
  section: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontWeight: 600, fontSize: "13px", color: "#9ca3af" },
  input: { padding: '8px', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '4px' },
  select: { padding: '8px', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '4px' },
  button: { padding: '12px', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }
};

export default function EOFControlPanel({
  datasetId, setDatasetId,
  modeType, setModeType,
  depth, setDepth,
  sectionType, setSectionType,
  sectionValue, setSectionValue,
  timeRange, setTimeRange,
  modeNum, setModeNum,
  loading,
  runEOF
}) {

  return (
    <div style={styles.panel}>
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>EOF 参数配置</h3>

      {/* 数据源选择 */}
      <div style={styles.section}>
        <label style={styles.label}>分析数据集</label>
        <select style={styles.select} value={datasetId} onChange={(e)=>setDatasetId(e.target.value)}>
          <option value="do_predict">Indian Ocean Dataset (do_predict)</option>
        </select>
      </div>

      {/* 分析模态选择 */}
      <div style={styles.section}>
        <label style={styles.label}>空间分析模式</label>
        <select style={styles.select} value={modeType} onChange={(e)=>setModeType(e.target.value)}>
          <option value="horizontal">Horizontal (水平等深面)</option>
          <option value="section">Section (垂直剖面)</option>
        </select>
      </div>

      {/* 水平模式专有属性：切片层级 */}
      {modeType === "horizontal" && (
        <div style={styles.section}>
          <label style={styles.label}>水深采样层级 (索引范围: 0 - 49)</label>
          <input
            style={styles.input}
            type="number"
            min={0}
            max={49}
            step={1}
            value={depth}
            onChange={(e)=>setDepth(Number(e.target.value))}
          />
        </div>
      )}

      {/* 剖面模式专有属性 */}
      {modeType === "section" && (
        <>
          <div style={styles.section}>
            <label style={styles.label}>剖面切片控制轴</label>
            <select style={styles.select} value={sectionType} onChange={(e)=>setSectionType(e.target.value)}>
              <option value="lat">纬度切面 (固定Latitude采样)</option>
              <option value="lon">经度切面 (固定Longitude采样)</option>
            </select>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>切面绝对物理地理位置 (°)</label>
            <input
              style={styles.input}
              type="number"
              step={0.25}
              value={sectionValue}
              onChange={(e)=>setSectionValue(Number(e.target.value))}
            />
          </div>
        </>
      )}

      {/* 时间步范围选择 */}
      <div style={styles.section}>
        <label style={styles.label}>时间跨度起点 (月序列索引: 0-479)</label>
        <input
          style={styles.input}
          type="number"
          min={0}
          max={479}
          value={timeRange[0]}
          onChange={(e)=>setTimeRange([Number(e.target.value), timeRange[1]])}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>时间跨度终点 (月序列索引: 0-479)</label>
        <input
          style={styles.input}
          type="number"
          min={0}
          max={479}
          value={timeRange[1]}
          onChange={(e)=>setTimeRange([timeRange[0], Number(e.target.value)])}
        />
      </div>

      {/* 提取主成分个数 */}
      <div style={styles.section}>
        <label style={styles.label}>提取主成分特征数 (Mode 数量)</label>
        <input
          style={styles.input}
          type="number"
          min={1}
          max={10}
          value={modeNum}
          onChange={(e)=>setModeNum(Number(e.target.value))}
        />
      </div>

      {/* 触发器 */}
      <button
        style={{...styles.button, backgroundColor: loading ? '#4b5563' : '#2563eb'}}
        onClick={runEOF}
        disabled={loading}
      >
        {loading ? "正在求解矩阵..." : "运行 EOF 算法"}
      </button>

    </div>
  );
}