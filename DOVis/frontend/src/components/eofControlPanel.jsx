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
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontWeight: 600, fontSize: "13px", color: "#9ca3af" },
  valueBadge: {
    background: '#1f2937',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#38bdf8',
    border: '1px solid #374151',
    fontFamily: 'monospace'
  },
  sliderContainer: { display: 'flex', alignItems: 'center', gap: '12px' },
  slider: { flex: 1, accentColor: '#3b82f6', cursor: 'pointer', height: '6px', borderRadius: '3px' },
  select: { padding: '8px', background: '#1f2937', border: '1px solid #374151', color: '#fff', borderRadius: '4px', cursor: 'pointer' },
  button: { padding: '12px', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', transition: 'background-color 0.2s' },

  // 🌟 双滑块专属样式外壳
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

  const isLat = sectionType === 'lat';
  const sliderMin = isLat ? -40 : 30;
  const sliderMax = isLat ? 30 : 120;
  const sliderStep = 0.25;

  // 🌟 计算双滑块高亮条的左右百分比位置
  const minPct = (timeRange[0] / 479) * 100;
  const maxPct = (timeRange[1] / 479) * 100;

  return (
    <div style={styles.panel}>
      {/* 注入双滑块核心控制穿透样式的局部标签，绝不污染全局 */}
      <style>{`
        .eof-dual-input {
          position: absolute;
          width: 100%;
          background: none;
          pointer-events: none; /* 🌟 关键：让输入框层穿透，不阻挡彼此 */
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
        }
        /* 针对不同浏览器的拖拽点重新激活鼠标事件 */
        .eof-dual-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          cursor: pointer;
          pointer-events: auto; /* 🌟 关键：只有纽扣响应鼠标拖拽 */
          transition: transform 0.1s;
        }
        .eof-dual-input::-webkit-slider-thumb:active {
          transform: scale(1.2);
          background: #38bdf8;
        }
        .eof-dual-input::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>

      <h3 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #374151', paddingBottom: '10px', fontSize: '16px' }}>EOF 参数配置</h3>

      {/* 数据源选择 */}
      <div style={styles.section}>
        <label style={styles.label}>分析数据集</label>
        <select style={styles.select} value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
          <option value="do_predict">Indian Ocean Dataset (do_predict)</option>
        </select>
      </div>

      {/* 分析模态选择 */}
      <div style={styles.section}>
        <select style={styles.select} value={modeType} onChange={(e) => setModeType(e.target.value)}>
          <option value="horizontal">Horizontal (水平等深面)</option>
          <option value="section">Section (垂直剖面)</option>
        </select>
      </div>

      {/* 水平模式：水深采样层级 */}
      {modeType === "horizontal" && (
        <div style={styles.section}>
          <div style={styles.labelRow}>
            <label style={styles.label}>水深采样层级 (索引)</label>
            <span style={styles.valueBadge}>Layer {depth}</span>
          </div>
          <div style={styles.sliderContainer}>
            <input
              style={styles.slider}
              type="range"
              min={0}
              max={49}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* 剖面模式专有属性 */}
      {modeType === "section" && (
        <>
          <div style={styles.section}>
            <label style={styles.label}>剖面切片控制轴</label>
            <select style={styles.select} value={sectionType} onChange={(e) => {
              setSectionType(e.target.value);
              setSectionValue(e.target.value === 'lat' ? 0.0 : 75.0);
            }}>
              <option value="lat">纬度切面 (固定 Latitude)</option>
              <option value="lon">经度切面 (固定 Longitude)</option>
            </select>
          </div>

          <div style={styles.section}>
            <div style={styles.labelRow}>
              <label style={styles.label}>切面绝对物理位置</label>
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

      {/* 🌟 核心升级：时间跨度双触点滑块 */}
      <div style={styles.section}>
        <div style={styles.labelRow}>
          <label style={styles.label}>时间跨度 (月索引序列)</label>
          <span style={styles.valueBadge}>M{timeRange[0]} - M{timeRange[1]}</span>
        </div>

        <div style={styles.dualSliderWrapper}>
          {/* 后方底色暗轨 */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: '6px', background: '#1f2937', borderRadius: '3px' }} />

          {/* 中间高亮激活轨（动态撑满两触点之间的区域） */}
          <div style={{
            position: 'absolute',
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
            height: '6px',
            background: '#3b82f6',
            borderRadius: '3px'
          }} />

          {/* 左触点滑块：控制起点 */}
          <input
            type="range"
            min={0}
            max={479}
            value={timeRange[0]}
            className="eof-dual-input"
            // 当左触点值比较大时，稍微提高层级防止遮挡
            style={{ zIndex: timeRange[0] > 240 ? 4 : 3 }}
            onChange={(e) => {
              const val = Number(e.target.value);
              // 🌟 核心防越界锁：新值绝对不能大于当前的尾部点
              const safeVal = Math.min(val, timeRange[1] - 1);
              setTimeRange([safeVal, timeRange[1]]);
            }}
          />

          {/* 右触点滑块：控制终点 */}
          <input
            type="range"
            min={0}
            max={479}
            value={timeRange[1]}
            className="eof-dual-input"
            style={{ zIndex: 3 }}
            onChange={(e) => {
              const val = Number(e.target.value);
              // 🌟 核心防越界锁：新值绝对不能小于当前的头部点
              const safeVal = Math.max(val, timeRange[0] + 1);
              setTimeRange([timeRange[0], safeVal]);
            }}
          />
        </div>
      </div>

      {/* 提取主成分个数 */}
      <div style={styles.section}>
        <label style={styles.label}>提取主成分特征数 (Mode 数量)</label>
        <select
          style={styles.select}
          value={modeNum}
          onChange={(e) => setModeNum(Number(e.target.value))}
        >
          <option value={1}>1 个主要模态</option>
          <option value={2}>2 个主要模态</option>
          <option value={3}>3 个主要模态</option>
          <option value={4}>4 个主要模态</option>
          <option value={5}>5 个主要模态</option>
        </select>
      </div>

      {/* 触发器 */}
      <button
        style={{ ...styles.button, backgroundColor: loading ? '#4b5563' : '#2563eb' }}
        onClick={runEOF}
        disabled={loading}
      >
        {loading ? "正在解算空间网格矩阵..." : "运行 EOF 算法"}
      </button>

    </div>
  );
}