import { useState } from "react";

import {
  getVolume,
  getBoundary
} from "../api/hypoxia";

export default function HypoxiaModule({ hidden }) {

  const [time, setTime] = useState("2024-01");

  const [volume, setVolume] = useState(null);

  async function handleVolume() {

    const result = await getVolume(time);

    setVolume(result.volume_km3);
  }

  async function handleBoundary() {

    const result = await getBoundary(time);

    console.log(result);
  }

  function reset() {

    setVolume(null);

    // TODO:
    // 清除Cesium图层
  }

  return (
    <div
      style={{
        width: "320px",
        padding: "12px",
        color: "#fff"
      }}
    >
      <button
        style={{
          position: "absolute",
          right: 5,
          top: 5
        }}
        onClick={() => {
          reset();
          hidden();
        }}
      >
        x
      </button>

      <h3>Hypoxic Analysis</h3>

      <input
        type="month"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleVolume}>
        Calculate Volume
      </button>

      <button
        onClick={handleBoundary}
        style={{
          marginLeft: "10px"
        }}
      >
        Load Boundary
      </button>

      <br />
      <br />

      {volume && (
        <div>
          Volume: {volume} km³
        </div>
      )}
    </div>
  );
}
