/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';

/**
 * 获取时间列表
 */
export function useTimes() {
  const [times, setTimes] = useState([]);

  useEffect(() => {
    let alive = true;

    fetch('/api/times')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch times');
        return res.json();
      })
      .then(data => {
        if (alive) setTimes(data);
      })
      .catch(err => {
        console.error('useTimes error:', err);
      });

    return () => {
      alive = false;
    };
  }, []);

  return times;
}

/**
 * 获取 volume（二进制版本）
 */
export function useVolume(timeIndex) {
  const [volume, setVolume] = useState(null);
  const [shape, setShape] = useState([0, 0, 0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => {
    if (timeIndex === null || timeIndex === undefined) return;

    setLoading(true);
    setError(null);

    // 取消旧请求
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/volume?time_index=${timeIndex}`, {
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // 读取 shape header
        const shapeHeader = res.headers.get('X-Shape');
        const shapeParsed = shapeHeader
          ? shapeHeader.split(',').map(Number)
          : [0, 0, 0];

        const buffer = await res.arrayBuffer();

        return {
          shape: shapeParsed,
          buffer,
        };
      })
      .then(({ shape, buffer }) => {
        // 后端固定 float32
        const float32 = new Float32Array(buffer);

        setShape(shape);
        setVolume(float32);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;

        console.error(err);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [timeIndex]);

  return {
    volume,
    shape,
    loading,
    error,
  };
}