import { useState, useCallback, useEffect } from "react";

export default function useEOF() {
  // 🌟 轻量参数：从 localStorage 读取历史记录，若无则使用你的默认值
  const [datasetId, setDatasetId] = useState(() => localStorage.getItem("eof_datasetId") || "do_predict");
  const [variable, setVariable] = useState(() => localStorage.getItem("eof_variable") || "o2_pred");
  const [modeType, setModeType] = useState(() => localStorage.getItem("eof_modeType") || "horizontal");
  const [depth, setDepth] = useState(() => Number(localStorage.getItem("eof_depth")) || 5.0);
  const [sectionType, setSectionType] = useState(() => localStorage.getItem("eof_sectionType") || "lat");
  const [sectionValue, setSectionValue] = useState(() => Number(localStorage.getItem("eof_sectionValue")) || 10.0);
  const [timeRange, setTimeRange] = useState(() => {
    const saved = localStorage.getItem("eof_timeRange");
    return saved ? JSON.parse(saved) : [0, 100];
  });
  const [modeNum, setModeNum] = useState(() => Number(localStorage.getItem("eof_modeNum")) || 3);

  // 🌟 巨额算力数据：保持纯内存状态
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 偷偷同步到缓存，不影响系统顶层
  useEffect(() => {
    localStorage.setItem("eof_datasetId", datasetId);
    localStorage.setItem("eof_variable", variable);
    localStorage.setItem("eof_modeType", modeType);
    localStorage.setItem("eof_depth", depth);
    localStorage.setItem("eof_sectionType", sectionType);
    localStorage.setItem("eof_sectionValue", sectionValue);
    localStorage.setItem("eof_timeRange", JSON.stringify(timeRange));
    localStorage.setItem("eof_modeNum", modeNum);
  }, [datasetId, variable, modeType, depth, sectionType, sectionValue, timeRange, modeNum]);

  const runEOF = useCallback(async () => {
    setLoading(true);
    const slice_params = modeType === "horizontal" 
      ? { depth: Math.floor(Number(depth)) } 
      : { type: sectionType, value: Number(sectionValue) };

    try {
      const res = await fetch("/api/eof-run", {
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

  // 清理函数
  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
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