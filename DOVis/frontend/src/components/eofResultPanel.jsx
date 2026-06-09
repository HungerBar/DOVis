import { useRef, useState } from "react";
// 引入 Hook 和 工具函数
import { useEOFCharts } from "../hooks/useEOFchart";
import { handleExportCurrentMode } from "../utils/eofExport";

// ============== 结果区 ui =============
const styles = {
  panel: { width: "600px", padding: "16px", background: "#0b1220", color: "#fff", height: "100%", overflow: "auto" },
  title: { fontSize: "16px", fontWeight: "bold", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBox: { display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" },
  btn: { padding: "6px 12px", cursor: "pointer", background: "#1e293b", border: "none", color: "#ccc", borderRadius: "4px" },
  btnActive: { padding: "6px 12px", cursor: "pointer", background: "#38bdf8", border: "none", color: "#000", fontWeight: "bold", borderRadius: "4px" },
  chartBox: { width: "100%", height: "320px", marginBottom: "24px" },
  exportBtn: { padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }
};
// ===============================

export default function EOFResultPanel({ result, loading }) {
  const [activeModeIdx, setActiveModeIdx] = useState(0);

  const spatialRef = useRef(null);
  const varianceRef = useRef(null);
  const pcsRef = useRef(null);

  // 🌊 使用自定义 Hook 处理绘图逻辑（直接传入 refs，让 Hook 在内部通过 .current 绘图）
  useEOFCharts(result, activeModeIdx, {
    spatialRef, varianceRef, pcsRef
  });

  // 📦 点击导出按钮
  const onExportClick = () => {
    // 🚨 核心改动：不再去 chartInstancesRef 里面拿 ECharts 实例
    // 直接把当前组件维护的 React refs 原封不动传进去，让 Plotly 导出工具直接去抓 DOM
    handleExportCurrentMode(result, activeModeIdx, {
      spatialRef,
      pcsRef
    });
  };

  // ========== 计算中状态 ui =============
  if (loading) {
    return (
      <div style={styles.panel}>
        <div style={{ textAlign: "center", padding: "40px", color: "#38bdf8" }}>
          Running EOF analysis solver backend...
        </div>
      </div>
    );
  }

  // ========== 未运行状态 ui  =============
  if (!result || !result.modes) {
    return (
      <div style={styles.panel}>
        <div style={styles.title}>EOF Result Dashboard</div>
        <div style={{ color: "#64748b" }}>Configure parameters and click "Run EOF".</div>
      </div>
    );
  }

  // ======= 结果渲染 ui ==========
  return (
    <div style={styles.panel}>
      <div style={styles.title}>
        <span>EOF Analysis Result</span>
        <button style={styles.exportBtn} onClick={onExportClick}>
          📦 导出 Mode {activeModeIdx + 1} 数据
        </button>
      </div>

      <div style={styles.tabBox}>
        {result.modes.map((m, idx) => (
          <button
            key={m.mode}
            style={idx === activeModeIdx ? styles.btnActive : styles.btn}
            onClick={() => setActiveModeIdx(idx)}
          >
            Mode {m.mode} ({(m.variance * 100).toFixed(1)}%)
          </button>
        ))}
      </div>

      {/* 仅仅通过 ref 绑定 DOM，不再包含任何绘图副作用 */}
      <div ref={spatialRef} style={styles.chartBox} />
      <div ref={pcsRef} style={styles.chartBox} />
    </div>
  );
}