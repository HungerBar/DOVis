import JSZip from "jszip";
import { saveAs } from "file-saver";

const Plotly = window.Plotly;

/**
 * 负责执行 EOF 数据导出与打包的纯业务逻辑函数 (原数据高保真版)
 * @param {Object} result - API 返回的完整 EOF 结果对象
 * @param {number} activeModeIdx - 当前选中的 Mode 索引
 * @param {Object} refs - 包含图表 DOM 节点的引用对象 { spatialRef, pcsRef }
 */
export const handleExportCurrentMode = async (result, activeModeIdx, refs) => {
  const { spatialRef, pcsRef } = refs;
  if (!result || !spatialRef?.current || !pcsRef?.current) {
    console.error("Export failed: Missing result data or DOM elements.");
    return;
  }

  const currentMode = result.modes[activeModeIdx];
  const coords = result.coords;
  const modeName = `Mode_${currentMode.mode}`;
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const zip = new JSZip();
  const folder = zip.folder(`EOF_Export_${modeName}_${timestamp}`);

  // ==========================================
  // 1. 生成 Readme 实验配置 (还原数据最真实元信息)
  // ==========================================
  const readmeText = `==================================================
EOF ANALYSIS EXPERIMENT REPORT (SINGLE MODE EXPORT)
==================================================
Export Time : ${new Date().toLocaleString()}
Dataset ID  : ${result.dataset_id}
Variable    : ${result.variable}
Mode Type   : ${result.mode_type}
Active Mode : Mode ${currentMode.mode}

[Dataset Metadata]
Total Time Points : ${result.pcs.length}

[Variance Contribution]
Current Mode Variance Fraction: ${(currentMode.variance * 100).toFixed(2)}%
--------------------------------------------------
Note: All spatial coordinates and time markers in the CSV files 
retain the exact raw values returned by the EOF solver backend.
==================================================`;
  folder.file("Readme_Config.txt", readmeText);

  // ==========================================
  // 🌟 2. 生成 CSV (PC Timeseries) — 保留后端原始时间标识
  // ==========================================
  // 移除生硬构造的 calendar_label，直接提供 time_index 与原始的 time_label
  let pcCsv = "time_index,time_label,pc_value\n";

  result.pcs.forEach((row, idx) => {
    // 获取后端原始的时间标签（如原始物理天数、序号或浮点年份）
    const rawTimeLabel = coords.time_labels?.[idx] !== undefined ? coords.time_labels[idx] : idx;
    const val = row[activeModeIdx];
    
    // PC 权重的数值保持 6 位高精度科学计数或浮点表示
    pcCsv += `${idx},${rawTimeLabel},${val.toFixed(6)}\n`;
  });
  folder.file(`pc_timeseries_mode${currentMode.mode}.csv`, pcCsv);

  // ==========================================
  // 🌟 3. 生成 CSV (Spatial Grid) — 100% 还原后端原始网格空间值
  // ==========================================
  let spatialCsv = "";
  const field = currentMode.field;

  if (result.mode_type === "horizontal") {
    spatialCsv = "longitude,latitude,eof_value\n";
    // 严格按后端行列矩阵映射，直接输出原始经纬度文本，避免 toFixed() 破坏不均匀网格或高精经纬度
    coords.lat.forEach((latVal, rIdx) => {
      coords.lon.forEach((lonVal, cIdx) => {
        const val = field[rIdx]?.[cIdx];
        spatialCsv += `${lonVal},${latVal},${val !== null && val !== undefined ? val.toFixed(6) : "NaN"}\n`;
      });
    });
  } else {
    // 垂直剖面模式 section
    if (coords.lon) {
      spatialCsv = "longitude,depth,eof_value\n";
      coords.depth.forEach((dVal, rIdx) => {
        coords.lon.forEach((lonVal, cIdx) => {
          const val = field[rIdx]?.[cIdx];
          spatialCsv += `${lonVal},${dVal},${val !== null && val !== undefined ? val.toFixed(6) : "NaN"}\n`;
        });
      });
    } else {
      spatialCsv = "latitude,depth,eof_value\n";
      coords.depth.forEach((dVal, rIdx) => {
        coords.lat.forEach((latVal, cIdx) => {
          const val = field[rIdx]?.[cIdx];
          spatialCsv += `${latVal},${dVal},${val !== null && val !== undefined ? val.toFixed(6) : "NaN"}\n`;
        });
      });
    }
  }
  folder.file(`spatial_grid_mode${currentMode.mode}.csv`, spatialCsv);

  // ==========================================
  // 🌟 4. 抓取图表快照 (高清、不发虚，且颜色条完美与图等高)
  // ==========================================
  try {
    const imageOpts = {
      format: "png",
      width: 1000,   
      height: 600,
      scale: 2       // 保持 2 倍超采样率，方便论文高清冲印
    };

    const spatialImgData = await Plotly.toImage(spatialRef.current, imageOpts);
    const pcsImgData = await Plotly.toImage(pcsRef.current, imageOpts);

    const cleanSpatialBase64 = spatialImgData.replace(/^data:image\/\w+;base64,/, "");
    const cleanPcsBase64 = pcsImgData.replace(/^data:image\/\w+;base64,/, "");

    folder.file(`spatial_chart_mode${currentMode.mode}.png`, cleanSpatialBase64, { base64: true });
    folder.file(`pcs_timeseries_mode${currentMode.mode}.png`, cleanPcsBase64, { base64: true });
  } catch (imgError) {
    console.error("Chart snapshot export failed, proceeding with CSV only:", imgError);
    folder.file("ERROR_snapshots_failed.txt", "Plotly context capture timed out or failed.");
  }

  // ==========================================
  // 5. 生成 Zip 并触发下载
  // ==========================================
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `EOF_Result_Mode${currentMode.mode}_${timestamp}.zip`);
};