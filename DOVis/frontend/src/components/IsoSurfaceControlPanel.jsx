const styles = {
  /**
   * 整个侧边控制面板
   */
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

  /**
  * 标题样式
  */
  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: '#e2e8f0',
  },

  /**
   * 每个功能模块容器
   * 例如：
   * - 时间选择
   * - 等值面控制
   * - 导出功能
   */
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

  /**
   * 模块顶部标题行
   * 左侧为名称
   * 右侧为当前值
   */

  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },

  /**
   * 当前数值显示
   * 如：
   * - 当前时间索引
   * - 当前氧气值
   */

  valueText: {
    fontSize: '0.9rem',
    color: '#38bdf8',
    fontWeight: 600,
  },

  /**
   * Slider滑动条
   */
  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#38bdf8',
  },

  /**
   * 时间文本显示区域
   * 显示具体时间字符串
   */
  timeText: {
    fontSize: '0.85rem',
    color: '#94a3b8',

    padding: '8px 10px',

    background: 'rgba(15,23,42,0.7)',
    borderRadius: '10px',

    wordBreak: 'break-word',
  },

  /**
   * 按钮组容器
   */
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },

  /**
   * 主按钮
   * 用于强调操作
   * 如 Export OBJ
   */
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

  /**
   * 次级按钮
   * 用于辅助功能
   * 如 Export NC
   */
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

const IsoSurfaceControlPanel = ({
  times,
  timeIndex,
  setTimeIndex,
  isoValue,
  setIsoValue,

  onRenderCesium,
  endRenderCesium,
  onExportNc,
}) => {
  return (
    <div style={styles.panel}>
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