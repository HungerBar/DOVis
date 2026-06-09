import { useEffect } from "react";

const Plotly = window.Plotly;

export const useEOFCharts = (result, activeModeIdx, refs) => {
  // varianceRef 保留解构以防组件传入报错，但内部不再对它进行渲染
  const { spatialRef, varianceRef, pcsRef } = refs;

  useEffect(() => {
    if (
      !result ||
      !result.coords ||
      !result.modes ||
      !spatialRef.current ||
      !pcsRef.current
    ) {
      return;
    }

    const spatialDom = spatialRef.current;
    const pcsDom = pcsRef.current;

    const coords = result.coords;
    const currentMode = result.modes[activeModeIdx];
    const varianceText = (currentMode.variance * 100).toFixed(2) + "%";

    const commonLayoutProps = {
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#cbd5e1", size: 11 }
    };

    const plotlyConfig = {
      responsive: true,
      displayModeBar: false
    };

    // =====================================================
    // 1. 空间模态图（按整十/500米标注，区间锁死拉齐，完美支持东西南北半球）
    // =====================================================
    let spatialXData, spatialYData, spatialXName, spatialYName;
    const isHorizontal = result.mode_type === "horizontal";

    if (isHorizontal) {
      spatialXData = coords.lon.map(Number);
      spatialYData = coords.lat.map(Number);
      spatialXName = "Longitude";
      spatialYName = "Latitude";
    } else {
      spatialYData = coords.depth.map(Number);
      spatialYName = "Depth (m)";
      spatialXData = coords.lon ? coords.lon.map(Number) : coords.lat.map(Number);
      spatialXName = coords.lon ? "Longitude" : "Latitude";
    }

    const xMin = Math.min(...spatialXData);
    const xMax = Math.max(...spatialXData);
    const yMin = Math.min(...spatialYData);
    const yMax = Math.max(...spatialYData);

    const spatialXLayoutOpts = {
      title: spatialXName,
      showgrid: true,
      gridcolor: "#1e293b",
      zeroline: false,
      range: [xMin, xMax],
      tickmode: "array" // 🔒 强制开启自定义数组刻度
    };

    const spatialYLayoutOpts = {
      title: spatialYName,
      showgrid: true,
      gridcolor: "#1e293b",
      zeroline: false,
      autorange: !isHorizontal ? "reversed" : true,
      tickmode: "array" // 🔒 强制开启自定义数组刻度
    };

    // 🗺️ 辅助函数：将数字动态转化为地理方向文字
    const getLonLabel = (v) => {
      if (v === 0) return "0°";
      if (v === 180 || v === -180) return "180°";
      return v > 0 ? `${v}°E` : `${Math.abs(v)}°W`;
    };

    const getLatLabel = (v) => {
      if (v === 0) return "EQ"; // 赤道
      return v > 0 ? `${v}°N` : `${Math.abs(v)}°S`;
    };

    if (isHorizontal) {
      // ----------------- 1.1 水平图逻辑 (X:经度, Y:纬度) -----------------
      const sXMin = Math.ceil(xMin / 10) * 10;
      const sXMax = Math.floor(xMax / 10) * 10;
      const xTicks = [];
      for (let val = sXMin; val <= sXMax; val += 20) xTicks.push(val);
      spatialXLayoutOpts.tickvals = xTicks;
      spatialXLayoutOpts.ticktext = xTicks.map(getLonLabel); // 🔒 自动渲染成 120°E / 60°W

      const sYMin = Math.ceil(yMin / 10) * 10;
      const sYMax = Math.floor(yMax / 10) * 10;
      const yTicks = [];
      for (let val = sYMin; val <= sYMax; val += 10) yTicks.push(val);
      spatialYLayoutOpts.tickvals = yTicks;
      spatialYLayoutOpts.ticktext = yTicks.map(getLatLabel); // 🔒 自动渲染成 30°N / 10°S

      spatialYLayoutOpts.scaleanchor = "x";
      spatialYLayoutOpts.scaleratio = 1;
    } else {
      // ----------------- 1.2 剖面图逻辑 (X:经度或纬度, Y:深度) -----------------
      const sXMin = Math.ceil(xMin / 10) * 10;
      const sXMax = Math.floor(xMax / 10) * 10;
      const xTicks = [];
      for (let val = sXMin; val <= sXMax; val += 10) xTicks.push(val);
      spatialXLayoutOpts.tickvals = xTicks;
      // 剖面图的 X 轴可能是经度也可能是纬度，自适应判断方向
      spatialXLayoutOpts.ticktext = coords.lon ? xTicks.map(getLonLabel) : xTicks.map(getLatLabel);

      const yTicks = [];
      for (let val = 0; val <= yMax; val += 1000) {
        if (val >= yMin || val === 0) yTicks.push(val);
      }
      spatialYLayoutOpts.tickvals = yTicks;
      spatialYLayoutOpts.ticktext = yTicks.map(v => `${v}`);

      spatialYLayoutOpts.scaleanchor = null;
    }

    const maxAbsVal = Math.max(Math.abs(currentMode.v_min), Math.abs(currentMode.v_max));
    let decimals = 3;
    if (maxAbsVal < 0.01) decimals = 5;
    else if (maxAbsVal < 0.1) decimals = 4;
    else if (maxAbsVal > 10) decimals = 2;

    const spatialData = [{
      z: currentMode.field,
      x: spatialXData,
      y: spatialYData,
      type: "heatmap",
      colorscale: "RdBu",
      reversescale: true,
      zsmooth: false,
      zmin: currentMode.v_min,
      zmax: currentMode.v_max,
      colorbar: {
        tickfont: { color: "#cbd5e1" },
        thickness: 15,
        len: 1,
        tickmode: "linear",
        tick0: currentMode.v_min,
        dtick: (currentMode.v_max - currentMode.v_min) / 4,
        tickformat: `.${decimals}f`
      },
      // 🔒 悬浮窗同步优化：将不规范的名称清洗，直接在 Hover 面板展示干净的方向与数值
      hovertemplate: `${coords.lon ? 'Longitude' : 'Latitude'}: %{x}°<br>${!isHorizontal ? 'Depth' : (coords.lon ? 'Latitude' : 'Longitude')}: %{y}<br>Value: %{z:.${decimals}f}<extra></extra>`
    }];

    Plotly.react(spatialDom, spatialData, {
      ...commonLayoutProps,
      title: { text: `EOF${currentMode.mode} Spatial Pattern (${varianceText})`, font: { color: "#ffffff", size: 14 } },
      margin: { t: 45, b: 50, l: 60, r: 20 },
      xaxis: spatialXLayoutOpts,
      yaxis: spatialYLayoutOpts
    }, plotlyConfig);

    // =====================================================
    // 2. PC 时间序列（硬核 1980-2020 物理年份真实切分，补齐横纵坐标名称）
    // =====================================================
    const totalPoints = result.pcs.length;
    const rawTimes = coords.time_labels;

    const tickVals = [];
    const tickTexts = [];
    const hideMonthTicks = totalPoints > 60;
    const BASE_YEAR = 1980;

    for (let index = 0; index < totalPoints; index++) {
      const currentYear = BASE_YEAR + Math.floor(index / 12);
      const currentMonth = (index % 12) + 1;

      if (hideMonthTicks) {
        if (currentMonth === 1) {
          tickVals.push(index);
          tickTexts.push(String(currentYear));
        }
      } else {
        tickVals.push(index);
        if (currentMonth === 1) {
          tickTexts.push(String(currentYear));
        } else {
          tickTexts.push("");
        }
      }
    }

    const pcsValues = result.pcs.map((row) => row[activeModeIdx]);
    const yMinPC = Math.min(...pcsValues);
    const yMaxPC = Math.max(...pcsValues);
    const pcYTickVals = [];
    const startY = Math.floor(yMinPC / 100) * 100;
    const endY = Math.ceil(yMaxPC / 100) * 100;
    for (let val = startY; val <= endY; val += 100) {
      pcYTickVals.push(val);
    }

    const pcsData = [{
      x: Array.from({ length: totalPoints }, (_, i) => i),
      y: pcsValues,
      type: "scatter",
      mode: "lines",
      line: { color: "#06b6d4", width: 2 },
      hovertemplate: "Time Day: %{text}<br>PC Value: %{y:.5f}<extra></extra>",
      text: rawTimes
    }];

    Plotly.react(pcsDom, pcsData, {
      ...commonLayoutProps,
      title: { text: `PC${currentMode.mode} Time Series`, font: { color: "#ffffff", size: 14 } },
      margin: { t: 40, b: 50, l: 60, r: 20 },
      xaxis: {
        title: "Time", // 🌟 补齐横坐标轴名称
        tickvals: tickVals,
        ticktext: tickTexts,
        showgrid: true,
        gridcolor: "#1e293b",
        range: [0, totalPoints - 1],
        tickmode: "array"
      },
      yaxis: {
        title: "PC Amplitude", // 🌟 补齐纵坐标轴名称 (物理意义通常为权重振幅)
        tickvals: pcYTickVals,
        showgrid: true,
        gridcolor: "#334155",
        zeroline: true,
        zerolinecolor: "#64748b"
      }
    }, plotlyConfig);

    // =====================================================
    // 4. 清理与响应式缩放
    // =====================================================
    const handleResize = () => {
      if (spatialDom) Plotly.Plots.resize(spatialDom);
      if (pcsDom) Plotly.Plots.resize(pcsDom);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (spatialDom) Plotly.purge(spatialDom);
      if (pcsDom) Plotly.purge(pcsDom);
    };
  }, [result, activeModeIdx, spatialRef, varianceRef, pcsRef]);
};