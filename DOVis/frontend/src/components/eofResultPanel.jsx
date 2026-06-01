import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
// 🌟 引入打包与下载核心库
import JSZip from "jszip";
import { saveAs } from "file-saver";

const styles = {
  panel: { padding: "16px", background: "#0b1220", color: "#fff", height: "100%", overflow: "auto" },
  title: { fontSize: "16px", fontWeight: "bold", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tabBox: { display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #1e293b", paddingBottom: "8px" },
  btn: { padding: "6px 12px", cursor: "pointer", background: "#1e293b", border: "none", color: "#ccc", borderRadius: "4px" },
  btnActive: { padding: "6px 12px", cursor: "pointer", background: "#38bdf8", border: "none", color: "#000", fontWeight: "bold", borderRadius: "4px" },
  chartBox: { width: "100%", height: "320px", marginBottom: "24px" },
  exportBtn: { padding: "6px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }
};

export default function EOFResultPanel({ result, loading }) {
  const [activeModeIdx, setActiveModeIdx] = useState(0);

  const spatialRef = useRef(null);
  const varianceRef = useRef(null);
  const pcsRef = useRef(null);

  // 🌟 使用 Ref 持有图表实例，方便在 useEffect 外部抓取图片快照
  const spatialChartInstance = useRef(null);
  const pcsChartInstance = useRef(null);

  useEffect(() => {
    if (!result || !result.coords || !result.modes) return;

    const coords = result.coords;
    const currentMode = result.modes[activeModeIdx];

    // 1. Spatial Pattern Chart
    const spatialChart = echarts.init(spatialRef.current);
    spatialChartInstance.current = spatialChart; // 挂载到 Ref
    
    let spatialOption = {};
    if (result.mode_type === "horizontal") {
      spatialOption = {
        title: { text: `Mode ${currentMode.mode} Spatial Pattern (Horizontal)`, textStyle: { color: "#fff", fontSize: 14 } },
        tooltip: {},
        xAxis: { type: "category", data: coords.lon, axisLabel: { color: "#94a3b8" } },
        yAxis: { type: "category", data: coords.lat, axisLabel: { color: "#94a3b8" } },
        visualMap: { min: currentMode.v_min, max: currentMode.v_max, calculus: "continuous", inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"] }, textStyle: { color: "#fff" }, right: 10, bottom: 20 },
        series: [{ name: "EOF Value", type: "heatmap", data: [] }]
      };
      currentMode.field.forEach((row, rIdx) => {
        row.forEach((val, cIdx) => {
          // 🛠️ 修正：使用 Number() 代替 float()
          if (val !== null && val !== undefined) spatialOption.series[0].data.push([cIdx, rIdx, Number(val.toFixed(4))]);
        });
      });
    } else {
      // Section mode charts
      const xData = coords.lon || coords.lat;
      spatialOption = {
        title: { text: `Mode ${currentMode.mode} Spatial Pattern (Section)`, textStyle: { color: "#fff", fontSize: 14 } },
        tooltip: {},
        xAxis: { type: "category", data: xData, axisLabel: { color: "#94a3b8" } },
        yAxis: { type: "category", data: coords.depth, axisLabel: { color: "#94a3b8" }, inverse: true },
        visualMap: { min: currentMode.v_min, max: currentMode.v_max, inRange: { color: ["#313695", "#74add1", "#f46d43", "#a50026"] }, textStyle: { color: "#fff" }, right: 10 },
        series: [{ name: "EOF Value", type: "heatmap", data: [] }]
      };
      currentMode.field.forEach((row, rIdx) => {
        row.forEach((val, cIdx) => {
          // 🛠️ 修正：使用 Number() 代替 float()
          if (val !== null && val !== undefined) spatialOption.series[0].data.push([cIdx, rIdx, Number(val.toFixed(4))]);
        });
      });
    }
    spatialChart.setOption(spatialOption);

    // 2. Variance Chart
    const varianceChart = echarts.init(varianceRef.current);
    varianceChart.setOption({
      title: { text: "Variance Fraction (%)", textStyle: { color: "#fff", fontSize: 14 } },
      tooltip: {},
      xAxis: { type: "category", data: result.modes.map(m => `Mode ${m.mode}`), axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      series: [{
        data: result.modes.map((m, idx) => ({
          // 🛠️ 修正：使用 Number() 代替 float()
          value: Number((m.variance * 100).toFixed(2)),
          itemStyle: { color: idx === activeModeIdx ? "#38bdf8" : "#1e293b" }
        })),
        type: "bar",
        label: { show: true, position: "top", color: "#fff" }
      }]
    });

    // 3. PCs Time Series Chart
    const pcsChart = echarts.init(pcsRef.current);
    pcsChartInstance.current = pcsChart; // 挂载到 Ref
    
    const timeLabels = coords.time_labels || Array.from({ length: result.pcs.length }, (_, i) => i);
    pcsChart.setOption({
      title: { text: `Mode ${currentMode.mode} Time Coefficient (PC)`, textStyle: { color: "#fff", fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: timeLabels, axisLabel: { color: "#94a3b8" } },
      yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
      grid: { bottom: 40, left: 50, right: 20 },
      // 🛠️ 修正：使用 Number() 代替 float()
      series: [{ data: result.pcs.map(row => Number(row[activeModeIdx].toFixed(4))), type: "line", smooth: true, itemStyle: { color: "#38bdf8" }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(56,189,248,0.3)" }, { offset: 1, color: "rgba(56,189,248,0)" }]) } }]
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


  // =========================================================================
  // 🌟 执行当前选中模态的独立数据大礼包下载
  // =========================================================================
  const handleExportCurrentMode = async () => {
    if (!result || !spatialChartInstance.current || !pcsChartInstance.current) return;

    const currentMode = result.modes[activeModeIdx];
    const coords = result.coords;
    const modeName = `Mode_${currentMode.mode}`;
    const timestamp = new Date().toISOString().slice(0,10).replace(/-/g,"");
    
    const zip = new JSZip();
    const folder = zip.folder(`EOF_Export_${modeName}_${timestamp}`);

    // --- 1. 生成实验配置与摘要文本 (Readme_Config.txt) ---
    const readmeText = `==================================================
EOF ANALYSIS EXPERIMENT REPORT (SINGLE MODE EXPORT)
==================================================
Export Time: ${new Date().toLocaleString()}
Dataset ID : ${result.dataset_id}
Variable   : ${result.variable}
Space Mode : ${result.mode_type}
Active Mode: Mode ${currentMode.mode}

[Variance Contribution]
Current Mode Variance Fraction: ${(currentMode.variance * 100).toFixed(2)}%
--------------------------------------------------
* Note: Spatial grid coordinates and time series factors are
  exported as standalone GIS-friendly CSV tables in this package.`;
    folder.file("Readme_Config.txt", readmeText);

    // --- 2. 生成时间系数序列表 (pc_timeseries.csv) ---
    let pcCsv = "time_index,time_label,pc_value\n";
    const timeLabels = coords.time_labels || [];
    result.pcs.forEach((row, idx) => {
      const label = timeLabels[idx] || `Step_${idx}`;
      const val = row[activeModeIdx];
      pcCsv += `${idx},${label},${val.toFixed(6)}\n`;
    });
    folder.file(`pc_timeseries_mode${currentMode.mode}.csv`, pcCsv);

    // --- 3. 生成空间模态网格数据表 (spatial_pattern.csv) ---
    let spatialCsv = "";
    const field = currentMode.field;

    if (result.mode_type === "horizontal") {
      spatialCsv = "longitude,latitude,eof_value\n";
      coords.lat.forEach((latVal, rIdx) => {
        coords.lon.forEach((lonVal, cIdx) => {
          const val = field[rIdx]?.[cIdx];
          spatialCsv += `${lonVal},${latVal},${val !== null && val !== undefined ? val : "NaN"}\n`;
        });
      });
    } else {
      // 剖面模式
      if (coords.lon) { 
        spatialCsv = "longitude,depth,eof_value\n";
        coords.depth.forEach((dVal, rIdx) => {
          coords.lon.forEach((lonVal, cIdx) => {
            const val = field[rIdx]?.[cIdx];
            spatialCsv += `${lonVal},${dVal},${val !== null && val !== undefined ? val : "NaN"}\n`;
          });
        });
      } else { 
        spatialCsv = "latitude,depth,eof_value\n";
        coords.depth.forEach((dVal, rIdx) => {
          coords.lat.forEach((latVal, cIdx) => {
            const val = field[rIdx]?.[cIdx];
            spatialCsv += `${latVal},${dVal},${val !== null && val !== undefined ? val : "NaN"}\n`;
          });
        });
      }
    }
    folder.file(`spatial_grid_mode${currentMode.mode}.csv`, spatialCsv);

    // --- 4. 抓取 ECharts 画面并导出超清 PNG 图片 ---
    const spatialImgBase64 = spatialChartInstance.current.getDataURL({ type: "png", pixelRatio: 2 });
    const pcsImgBase64 = pcsChartInstance.current.getDataURL({ type: "png", pixelRatio: 2 });

    folder.file(`spatial_chart_mode${currentMode.mode}.png`, spatialImgBase64.split(",")[1], { base64: true });
    folder.file(`pcs_timeseries_mode${currentMode.mode}.png`, pcsImgBase64.split(",")[1], { base64: true });

    // --- 5. 压缩并下载 ---
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `EOF_Result_Mode${currentMode.mode}_${timestamp}.zip`);
  };


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
        <div style={{ color: "#64748b" }}>Configure parameters and click "Run EOF".</div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.title}>
        <span>EOF Analysis Result</span>
        <button style={styles.exportBtn} onClick={handleExportCurrentMode}>
          📦 导出当前 Mode {activeModeIdx + 1} 数据
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

      <div ref={spatialRef} style={styles.chartBox} />
      <div ref={varianceRef} style={{ ...styles.chartBox, height: "160px" }} />
      <div ref={pcsRef} style={styles.chartBox} />
    </div>
  );
}