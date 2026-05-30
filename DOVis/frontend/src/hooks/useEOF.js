import { useState } from 'react';

export default function useEOF() {

  // ======================
  // 参数
  // ======================

  const [datasetId, setDatasetId] = useState("do_predict");

  const [modeType, setModeType] = useState("horizontal");

  const [depth, setDepth] = useState(0);

  const [timeRange, setTimeRange] = useState([0, 100]);

  const [modeNum, setModeNum] = useState(3);

  // ======================
  // 结果
  // ======================

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // ======================
  // Run EOF
  // ======================

  async function runEOF() {

    setLoading(true);

    const response = await fetch(
      "http://localhost:8000/eof/run",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          dataset_id: datasetId,
          variable: "o2",
          time_range: timeRange,
          mode_type: modeType,
          mode_num: modeNum,
          slice_params: {
            depth
          }
        }),
      }
    );

    const data = await response.json();

    setResult(data);

    setLoading(false);
  }

  return {

    datasetId,
    setDatasetId,

    modeType,
    setModeType,

    depth,
    setDepth,

    timeRange,
    setTimeRange,

    modeNum,
    setModeNum,

    result,

    loading,

    runEOF,
  };
}