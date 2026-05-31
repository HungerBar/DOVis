import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

const styles = {
  panel: { padding: "16px", background: "#0b1220", color: "#fff", height: "100%", overflow: "auto" },
  title: { fontSize: "16px", fontWeight: "bold", marginBottom: "12px" },
  tabBox: { display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" },
  btn: { padding: "6px 12px", cursor: "pointer", background: "#1e293b", border: "none", color: "#ccc", borderRadius: "4px" },
  btnActive: { padding: "6px 12px", cursor: "pointer", background: "#38bdf8", border: "none", color: "#000", fontWeight: "bold", borderRadius: "4px" },
  chartBox: { width: "100%", height: "320px", marginBottom: "24px" },
};

export default function EOFResultPanel({ result, loading }) {
  const [activeModeIdx, setActiveModeIdx] = useState(0);

  const spatialRef = useRef(null);
  const varianceRef = useRef(null);
  const pcsRef = useRef(null);

  useEffect(() => {
    if (!result || !result.coords || !result.modes) return;

    // ==========================================
    // 1. 空间模态图看板 (Spatial Pattern) - 修复版
    // ==========================================
    const spatialChart = echarts.init(spatialRef.current);
    const activeMode = result.modes[activeModeIdx] || result.modes[0];
    const matrix = activeMode.field;

    let plotData = [];
    let xName = "";
    let yName = "";
    let inverseY = false;

    if (result.mode_type === "horizontal") {
    const lons = result.coords.lon;
    const lats = result.coords.lat;
    xName = "Longitude";
    yName = "Latitude";

    for (let i = 0; i < lats.length; i++) {
        for (let j = 0; j < lons.length; j++) {
        if (matrix[i] !== undefined && matrix[i] !== null) {
            const val = matrix[i][j];
            if (val !== null && val !== undefined) {
            plotData.push([lons[j], lats[i], val]); // index 0: lon, index 1: lat, index 2: val
            }
        }
        }
    }
    } else {
    const depths = result.coords.depth;
    const spaceCoords = result.coords.lon || result.coords.lat;
    xName = result.coords.lon ? "Longitude" : "Latitude";
    yName = "Depth (m)";
    inverseY = true; 

    for (let i = 0; i < depths.length; i++) {
        for (let j = 0; j < spaceCoords.length; j++) {
        if (matrix[i] !== undefined && matrix[i] !== null) {
            const val = matrix[i][j];
            if (val !== null && val !== undefined) {
            plotData.push([spaceCoords[j], depths[i], val]);
            }
        }
        }
    }
    }

    const rawMin = activeMode.v_min;
    const rawMax = activeMode.v_max;
    let finalMin = (rawMin !== undefined && rawMin !== null && !isNaN(rawMin)) ? rawMin : -0.1;
    let finalMax = (rawMax !== undefined && rawMax !== null && !isNaN(rawMax)) ? rawMax : 0.1;

    if (Math.abs(finalMax - finalMin) < 1e-6) {
    finalMin -= 0.1;
    finalMax += 0.1;
    }

    // 💡 顺便带上之前建议的“绝对值对称零点”逻辑，这样白色永远是物理0
    const maxAbs = Math.max(Math.abs(finalMin), Math.abs(finalMax));
    const symmetricMin = -maxAbs;
    const symmetricMax = maxAbs;

    spatialChart.setOption({
    title: {
        text: `EOF Spatial Pattern - Mode ${activeMode.mode} (${(activeMode.variance * 100).toFixed(1)}%)`,
        textStyle: { color: "#fff", fontSize: 14 },
    },
    tooltip: {
        trigger: "item",
        formatter: (p) => `${xName}: ${p.data[0].toFixed(2)}°<br/>${yName}: ${p.data[1].toFixed(1)}<br/>Value: ${p.data[2].toFixed(5)}`
    },
    grid: { left: "10%", right: "15%", top: "15%", bottom: "15%" },
    xAxis: { type: "value", name: xName, axisLabel: { color: "#ccc" }, splitLine: { show: false }, scale: true },
    yAxis: { type: "value", name: yName, axisLabel: { color: "#ccc" }, splitLine: { show: false }, scale: true, inverse: inverseY },
    visualMap: {
        dimension: 2,         // 🌟【核心修复 1】强制指定映射第 3 列数据 (即数组索引为 2 的 val)
        min: symmetricMin,    // 🌟 换用对称范围
        max: symmetricMax,    // 🌟 换用对称范围
        calculable: true,
        orient: "vertical",
        right: "2%",
        top: "center",
        textStyle: { color: "#fff" },
        inRange: {
        color: ["#0a306b", "#2171b5", "#6baed6", "#f7f7f7", "#fcae91", "#cb181d", "#67000d"]
        }
    },
    series: [{
        type: "scatter",
        symbol: "rect", 
        symbolSize: result.mode_type === "horizontal" ? [6, 5] : [8, 12],
        data: plotData,
        large: false          // 🌟【核心修复 2】关闭 large 性能流，让常规映射机制完全生效
    }]
    });

    // ==========================================
    // 2. 方差贡献率柱状图
    // ==========================================
    const varianceChart = echarts.init(varianceRef.current);
    varianceChart.setOption({
      title: { text: "Variance Contribution", textStyle: { color: "#fff", fontSize: 14 } },
      tooltip: { trigger: "axis", formatter: "{b}: {(c * 100).toFixed(2)}%" },
      xAxis: { type: "category", data: result.modes.map(m => `Mode ${m.mode}`), axisLabel: { color: "#ccc" } },
      yAxis: { type: "value", axisLabel: { color: "#ccc" } },
      series: [{
        type: "bar",
        data: result.modes.map(m => m.variance),
        itemStyle: { color: "#38bdf8" },
      }]
    });

    // ==========================================
    // 3. 时间系数折线图 (PCs)
    // ==========================================
    const pcsChart = echarts.init(pcsRef.current);
    const timeLen = result.pcs.length;
    const modeNum = result.pcs[0]?.length || 0;
    const pcsSeries = [];

    for (let i = 0; i < modeNum; i++) {
      pcsSeries.push({
        name: `PC ${i + 1}`,
        type: "line",
        data: result.pcs.map(row => row[i]),
        showSymbol: false,
        lineStyle: { width: 1.5 }
      });
    }

    // 🌟【优化 3】如果后端传了时间序列的原始标记（例如年份/月份），直接优先使用它作为刻度
    const xLabels = result.coords.time_labels 
      ? result.coords.time_labels 
      : Array.from({ length: timeLen }, (_, i) => i); 

    pcsChart.setOption({
      title: { text: "Principal Components (PCs)", textStyle: { color: "#fff", fontSize: 14 } },
      tooltip: { trigger: "axis" },
      legend: { textStyle: { color: "#ccc" }, top: "5%" },
      xAxis: { 
        type: "category", 
        data: xLabels, // 🌟 替换为更有物理实际的时间标签
        axisLabel: { color: "#ccc" } 
      },
      yAxis: { type: "value", axisLabel: { color: "#ccc" } },
      series: pcsSeries,
    });

    const handleResize = () => {
      spatialChart.resize();
      varianceChart.resize();
      pcsChart.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      spatialChart.dispose();
      varianceChart.dispose();
      pcsChart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [result, activeModeIdx]);

  if (loading) {
    return (
      <div style={styles.panel}>
        <div style={{ textAlign: "center", padding: "40px", color: "#38bdf8" }}>
          Running EOF analysis solver backend...
        </div>
      </div>
    );
  }

  if (!result || !result.modes) {
    return (
      <div style={styles.panel}>
        <div style={styles.title}>EOF Result Dashboard</div>
        <div style={{ color: "#64748b" }}>Configure parameters and click \"Run EOF\".</div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.title}>EOF Analysis Result</div>

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

      <div style={styles.chartBox} ref={spatialRef} />
      <div style={styles.chartBox} ref={pcsRef} />
      <div style={{ ...styles.chartBox, height: "200px" }} ref={varianceRef} />
    </div>
  );
}