/*
import { useState, useCallback } from "react";

export default function useEOF() {

  // ======================
  // 全局参数
  // ======================
  const [datasetId, setDatasetId] = useState("do_predict");
  const [variable, setVariable] = useState("o2");

  // ======================
  // EOF参数
  // ======================
  const [modeType, setModeType] = useState("horizontal");
  const [depth, setDepth] = useState(0);
  const [timeRange, setTimeRange] = useState([0, 100]);
  const [modeNum, setModeNum] = useState(3);

  // ======================
  // 状态
  // ======================
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ======================
  // 核心：Run EOF（显式触发）
  // ======================
 
  const runEOF = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/eof-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          variable,
          time_range: timeRange,
          mode_type: modeType,
          mode_num: modeNum,
          slice_params: {
            depth,
          },
        }),
      });

      const data = await res.json();

      setResult(data);

    } catch (e) {
      console.error("EOF run failed:", e);
    }

    setLoading(false);
  }, [
    datasetId,
    variable,
    timeRange,
    modeType,
    modeNum,
    depth
  ]);

  // ======================
  // reset
  // ======================
  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {

    // dataset
    datasetId,
    setDatasetId,

    variable,
    setVariable,

    // EOF params
    modeType,
    setModeType,

    depth,
    setDepth,

    timeRange,
    setTimeRange,

    modeNum,
    setModeNum,

    // state
    result,
    loading,

    // actions
    runEOF,
    reset,
  };
}
*/

import { useState, useCallback } from "react";

export default function useEOF() {
  const [datasetId, setDatasetId] = useState("do_predict");
  const [variable, setVariable] = useState("o2_pred"); // 对齐变量名

  const [modeType, setModeType] = useState("horizontal"); // horizontal | section
  const [depth, setDepth] = useState(5.0);
  
  // 剖面专属参数
  const [sectionType, setSectionType] = useState("lat"); // lat | lon
  const [sectionValue, setSectionValue] = useState(10.0); 

  const [timeRange, setTimeRange] = useState([0, 100]);
  const [modeNum, setModeNum] = useState(3);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runEOF = useCallback(async () => {
    setLoading(true);

    // 动态构建 slice_params
    const slice_params = modeType === "horizontal" 
      ? { depth: Number(depth) }
      : { type: sectionType, value: Number(sectionValue) };

    try {
      const res = await fetch("http://localhost:8000/api/eof-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          variable,
          time_range: timeRange,
          mode_type: modeType,
          mode_num: modeNum,
          slice_params,
        }),
      });

      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("EOF run failed:", e);
    } finally {
      setLoading(false);
    }
  }, [datasetId, variable, timeRange, modeType, modeNum, depth, sectionType, sectionValue]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    datasetId, setDatasetId,
    variable, setVariable,
    modeType, setModeType,
    depth, setDepth,
    sectionType, setSectionType,
    sectionValue, setSectionValue,
    timeRange, setTimeRange,
    modeNum, setModeNum,
    result, loading,
    runEOF, reset
  };
}